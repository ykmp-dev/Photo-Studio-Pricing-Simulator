import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  BackgroundVariant,
  MiniMap,
  NodeMouseHandler,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { FormBlock, BlockType } from '../../types/formBuilder'
import FormBlockNode from './FormBlockNode'
import BlockEditModal from './BlockEditModal'

interface FormBuilderCanvasProps {
  blocks: FormBlock[]
  productCategories: Array<{ id: number; display_name: string; items?: any[] }>
  onBlockUpdate: (blockId: number, updates: Partial<FormBlock>) => void
  onBlockDelete: (blockId: number) => void
  onBlockAdd: (blockType: BlockType) => void
  onBlocksReorder: (blocks: FormBlock[]) => void
  fullScreen?: boolean
}

// 階層的自動レイアウト: 左から右へのフロー
function calculateHierarchicalLayout(blocks: FormBlock[]): Map<number, { x: number; y: number }> {
  const positions = new Map<number, { x: number; y: number }>()

  // ルートノード（show_conditionがない）を見つける
  const rootBlocks = blocks.filter((b) => !b.show_condition)
  const childrenMap = new Map<number, FormBlock[]>()

  // 子ノードをマッピング
  blocks.forEach((block) => {
    if (block.show_condition) {
      const parentId = block.show_condition.block_id
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, [])
      }
      childrenMap.get(parentId)!.push(block)
    }
  })

  // ノード間隔を狭くする
  const HORIZONTAL_SPACING = 250  // 左から右への間隔
  const VERTICAL_SPACING = 100     // 上下の間隔

  // 深さごとに使用したY座標を追跡
  const depthYPosition = new Map<number, number>()

  // 再帰的にレイアウト（左から右へ）
  const layoutNode = (block: FormBlock, depth: number): void => {
    const x = 100 + depth * HORIZONTAL_SPACING

    // この深さで次に使用するY座標を取得
    const currentY = depthYPosition.get(depth) || 100
    const y = currentY

    // 次のノードのために、Y座標を更新
    depthYPosition.set(depth, currentY + VERTICAL_SPACING)

    positions.set(block.id, { x, y })

    // 子ノードを配置
    const children = childrenMap.get(block.id) || []
    children.forEach((child) => {
      layoutNode(child, depth + 1)
    })
  }

  // ルートノードからレイアウト開始（左側から）
  rootBlocks.forEach((root) => {
    layoutNode(root, 0)
  })

  return positions
}

// バリデーション：到達不可能ノードと循環参照を検出
interface ValidationIssue {
  type: 'unreachable' | 'circular' | 'suggestion'
  blockIds: number[]
  message: string
  suggestion?: string  // 推奨アクション
}

function validateBlocks(blocks: FormBlock[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // ルートノード（show_conditionがない）を見つける
  const rootBlocks = blocks.filter((b) => !b.show_condition)
  if (rootBlocks.length === 0 && blocks.length > 0) {
    issues.push({
      type: 'unreachable',
      blockIds: blocks.map((b) => b.id),
      message: 'ルートノード（条件なし）が存在しません',
    })
    return issues
  }

  // 到達可能ノードを探索
  const reachable = new Set<number>()
  const visiting = new Set<number>()
  const visited = new Set<number>()

  function dfs(blockId: number, path: number[]): boolean {
    if (visiting.has(blockId)) {
      // 循環参照を検出
      const cycleStart = path.indexOf(blockId)
      const cycle = path.slice(cycleStart)
      issues.push({
        type: 'circular',
        blockIds: cycle,
        message: `循環参照が検出されました: ${cycle.join(' → ')} → ${blockId}`,
      })
      return false
    }

    if (visited.has(blockId)) {
      return true
    }

    visiting.add(blockId)
    reachable.add(blockId)

    // 子ノードを探索
    const children = blocks.filter((b) => b.show_condition?.block_id === blockId)
    for (const child of children) {
      dfs(child.id, [...path, blockId])
    }

    visiting.delete(blockId)
    visited.add(blockId)
    return true
  }

  // ルートノードから探索開始
  rootBlocks.forEach((root) => dfs(root.id, []))

  // 到達不可能なノードを検出
  const unreachableBlocks = blocks.filter((b) => !reachable.has(b.id))
  if (unreachableBlocks.length > 0) {
    const blockNames = unreachableBlocks.map((b) => `「${b.content || b.block_type}」`).join(', ')
    issues.push({
      type: 'unreachable',
      blockIds: unreachableBlocks.map((b) => b.id),
      message: `到達不可能なノード: ${blockNames}`,
      suggestion: '親ブロックから接続してください',
    })
  }

  // Yes/Noブロックの後に推奨アクション
  const yesNoBlocks = blocks.filter((b) => b.block_type === 'yes_no')
  yesNoBlocks.forEach((yesNoBlock) => {
    const yesChildren = blocks.filter((b) => b.show_condition?.block_id === yesNoBlock.id && b.show_condition.value === 'yes')
    const noChildren = blocks.filter((b) => b.show_condition?.block_id === yesNoBlock.id && b.show_condition.value === 'no')

    if (yesChildren.length === 0 || noChildren.length === 0) {
      issues.push({
        type: 'suggestion',
        blockIds: [yesNoBlock.id],
        message: `「${yesNoBlock.content || 'Yes/No'}」ブロックには、Yesの場合とNoの場合の両方のブロックを追加することをお勧めします`,
        suggestion: '右側のハンドルから次のブロックに接続してください',
      })
    }
  })

  return issues
}

// FormBlocksをReact Flowのノード構造に変換
function blocksToNodes(
  blocks: FormBlock[],
  positions?: Map<number, { x: number; y: number }>,
  validationIssues?: ValidationIssue[],
  onCopy?: (block: FormBlock) => void
): Node[] {
  const layout = positions || calculateHierarchicalLayout(blocks)
  const unreachableIds = new Set(
    validationIssues?.filter((i) => i.type === 'unreachable').flatMap((i) => i.blockIds) || []
  )
  const circularIds = new Set(
    validationIssues?.filter((i) => i.type === 'circular').flatMap((i) => i.blockIds) || []
  )

  return blocks.map((block) => {
    const pos = layout.get(block.id) || { x: 250, y: 100 }

    return {
      id: block.id.toString(),
      type: 'formBlock',
      position: pos,
      data: {
        block,
        onUpdate: (_updates: Partial<FormBlock>) => {},
        onDelete: () => {},
        onCopy,
      },
      // バリデーションエラーのあるノードを視覚的に区別
      style: unreachableIds.has(block.id)
        ? { border: '3px solid #ef4444', opacity: 0.7 }
        : circularIds.has(block.id)
          ? { border: '3px solid #f59e0b', opacity: 0.8 }
          : undefined,
    }
  })
}

// show_conditionからReact Flowのエッジ構造に変換
function blocksToEdges(blocks: FormBlock[]): Edge[] {
  const edges: Edge[] = []

  blocks.forEach((block) => {
    if (block.show_condition) {
      const sourceId = block.show_condition.block_id.toString()
      const targetId = block.id.toString()

      edges.push({
        id: `e${sourceId}-${targetId}`,
        source: sourceId,
        target: targetId,
        label: block.show_condition.value,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
      })
    }
  })

  return edges
}

function FormBuilderCanvasInner({
  blocks,
  productCategories,
  onBlockUpdate,
  onBlockDelete,
  onBlockAdd,
  onBlocksReorder: _onBlocksReorder,
  fullScreen = false,
}: FormBuilderCanvasProps) {
  const [editingBlock, setEditingBlock] = useState<FormBlock | null>(null)
  const [copiedBlock, setCopiedBlock] = useState<FormBlock | null>(null)  // コピーしたブロック
  const previousBlockCountRef = useRef(blocks.length)
  const { fitView } = useReactFlow()

  // ブロックをコピー
  const handleCopyBlock = useCallback((block: FormBlock) => {
    setCopiedBlock(block)
    alert(`「${block.content || 'ブロック'}」をコピーしました`)
  }, [])

  // バリデーション実行
  const validationIssues = useMemo(() => validateBlocks(blocks), [blocks])

  const initialNodes = useMemo(() => blocksToNodes(blocks, undefined, validationIssues, handleCopyBlock), [blocks, validationIssues, handleCopyBlock])
  const initialEdges = useMemo(() => blocksToEdges(blocks), [blocks])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // blocksが変更されたときにnodesとedgesを更新
  useEffect(() => {
    setNodes(blocksToNodes(blocks, undefined, validationIssues, handleCopyBlock))
    setEdges(blocksToEdges(blocks))
  }, [blocks, validationIssues, handleCopyBlock, setNodes, setEdges])

  // 新しいブロックが追加されたときにフォーカス
  useEffect(() => {
    if (blocks.length > previousBlockCountRef.current) {
      // ブロックが追加された
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 300 })
      }, 100)
    }
    previousBlockCountRef.current = blocks.length
  }, [blocks.length, fitView])

  // 自動レイアウト整理
  const handleAutoLayout = useCallback(() => {
    const newLayout = calculateHierarchicalLayout(blocks)
    const updatedNodes = nodes.map((node) => {
      const blockId = parseInt(node.id)
      const newPos = newLayout.get(blockId)
      if (newPos) {
        return { ...node, position: newPos }
      }
      return node
    })
    setNodes(updatedNodes)
  }, [blocks, nodes, setNodes])

  // ブロックを貼り付け
  const handlePasteBlock = useCallback(async () => {
    if (!copiedBlock) {
      alert('コピーされたブロックがありません')
      return
    }

    // 新しいブロックを作成（show_conditionは除外）
    await onBlockAdd(copiedBlock.block_type)

    // TODO: コピーしたブロックのcontentやmetadataも反映させる
    // 現在の実装では、ブロックタイプのみコピーされます
    alert('ブロックを貼り付けました（内容は後で編集してください）')
  }, [copiedBlock, onBlockAdd])

  // ノードダブルクリックで編集モーダル
  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      const block = blocks.find((b) => b.id.toString() === node.id)
      if (block) {
        setEditingBlock(block)
      }
    },
    [blocks]
  )

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds))

      // 接続が作成されたら、show_conditionを更新
      if (connection.source && connection.target) {
        const sourceBlockId = parseInt(connection.source)
        const targetBlockId = parseInt(connection.target)

        const sourceBlock = blocks.find((b) => b.id === sourceBlockId)
        let conditionValue = 'next'  // デフォルト値
        let conditionType: 'yes_no' | 'choice' | 'next' = 'next'

        // ブロックタイプに応じて条件値を設定
        if (sourceBlock?.block_type === 'yes_no') {
          conditionType = 'yes_no'
          conditionValue = 'yes'  // デフォルトで「はい」の場合に表示
        } else if (sourceBlock?.block_type === 'choice') {
          conditionType = 'choice'
          // Choice blockの場合、最初の選択肢をデフォルトにする
          const options = sourceBlock.metadata?.choice_options || []
          conditionValue = options[0]?.value || 'next'
        } else {
          // text/heading/category_referenceの場合は'next'タイプを使用
          conditionType = 'next'
          conditionValue = 'next'
        }

        onBlockUpdate(targetBlockId, {
          show_condition: {
            type: conditionType,
            block_id: sourceBlockId,
            value: conditionValue,
          },
        })
      }
    },
    [blocks, onBlockUpdate]
  )

  // カスタムノードタイプ
  const nodeTypes = useMemo(
    () => ({
      formBlock: FormBlockNode,
    }),
    []
  )

  return (
    <div
      style={{ width: '100%', height: fullScreen ? '100%' : '600px' }}
      className={fullScreen ? 'relative' : 'border border-gray-300 rounded-lg relative'}
    >
      {/* バリデーション警告 */}
      {validationIssues.length > 0 && (
        <div className="absolute top-4 right-4 bg-white border-2 border-yellow-400 rounded-lg shadow-xl p-4 max-w-md z-10">
          <h4 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
            ⚠️ アドバイス ({validationIssues.length})
          </h4>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {validationIssues.map((issue, idx) => (
              <div key={idx} className={`text-sm p-2 rounded ${
                issue.type === 'unreachable' ? 'bg-red-50 border border-red-200' :
                issue.type === 'circular' ? 'bg-orange-50 border border-orange-200' :
                'bg-blue-50 border border-blue-200'
              }`}>
                <div className="font-medium mb-1">
                  {issue.type === 'unreachable' && '🔴 '}
                  {issue.type === 'circular' && '🟠 '}
                  {issue.type === 'suggestion' && '💡 '}
                  {issue.message}
                </div>
                {issue.suggestion && (
                  <div className="text-xs text-gray-600 mt-1">
                    👉 {issue.suggestion}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500 mt-3 pt-2 border-t border-gray-200">
            🔴 エラー / 🟠 警告 / 💡 推奨アクション
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2 },
        }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        maxZoom={2}
        snapToGrid={true}
        snapGrid={[15, 15]}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* ブロック追加ツールバー */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <button
          onClick={() => onBlockAdd('text')}
          className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          + テキスト
        </button>
        <button
          onClick={() => onBlockAdd('heading')}
          className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
        >
          + 見出し
        </button>
        <button
          onClick={() => onBlockAdd('yes_no')}
          className="w-full px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded"
        >
          + Yes/No
        </button>
        <button
          onClick={() => onBlockAdd('choice')}
          className="w-full px-3 py-2 text-sm bg-purple-100 hover:bg-purple-200 rounded"
        >
          + 選択肢
        </button>
        <button
          onClick={() => onBlockAdd('category_reference')}
          className="w-full px-3 py-2 text-sm bg-green-100 hover:bg-green-200 rounded"
        >
          + カテゴリ
        </button>
      </div>

      {/* 操作ツールバー */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <button
          onClick={handleAutoLayout}
          className="w-full px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
          title="ノードを階層的に自動整列します（左から右へのフロー形式）"
        >
          📐 レイアウト整列
        </button>
        <button
          onClick={handlePasteBlock}
          disabled={!copiedBlock}
          className={`w-full px-3 py-2 text-sm rounded font-medium ${
            copiedBlock
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={copiedBlock ? `「${copiedBlock.content || copiedBlock.block_type}」を貼り付け` : 'ブロックをコピーしてください'}
        >
          📋 貼り付け
        </button>
      </div>

      {/* ブロック編集モーダル */}
      {editingBlock && (
        <BlockEditModal
          block={editingBlock}
          productCategories={productCategories}
          onSave={(blockId, updates) => {
            onBlockUpdate(blockId, updates)
            setEditingBlock(null)
          }}
          onClose={() => setEditingBlock(null)}
          onDelete={(blockId) => {
            onBlockDelete(blockId)
            setEditingBlock(null)
          }}
        />
      )}
    </div>
  )
}

// ReactFlowProviderでラップしたデフォルトエクスポート
export default function FormBuilderCanvas(props: FormBuilderCanvasProps) {
  return (
    <ReactFlowProvider>
      <FormBuilderCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
