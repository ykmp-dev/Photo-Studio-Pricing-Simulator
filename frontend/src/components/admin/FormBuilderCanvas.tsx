import { useCallback, useMemo } from 'react'
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
} from 'reactflow'
import 'reactflow/dist/style.css'
import type { FormBlock, BlockType } from '../../types/formBuilder'
import FormBlockNode from './FormBlockNode'

interface FormBuilderCanvasProps {
  blocks: FormBlock[]
  onBlockUpdate: (blockId: number, updates: Partial<FormBlock>) => void
  onBlockDelete: (blockId: number) => void
  onBlockAdd: (blockType: BlockType) => void
  onBlocksReorder: (blocks: FormBlock[]) => void
}

// FormBlocksをReact Flowのノード構造に変換
function blocksToNodes(blocks: FormBlock[]): Node[] {
  return blocks.map((block, index) => {
    // 自動レイアウト: 上から下へ、条件分岐で横に広がる
    const baseX = 250
    const baseY = 100 + index * 150

    return {
      id: block.id.toString(),
      type: 'formBlock',
      position: { x: baseX, y: baseY },
      data: {
        block,
        onUpdate: (_updates: Partial<FormBlock>) => {},
        onDelete: () => {},
      },
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

export default function FormBuilderCanvas({
  blocks,
  onBlockUpdate,
  onBlockDelete: _onBlockDelete,
  onBlockAdd,
  onBlocksReorder: _onBlocksReorder,
}: FormBuilderCanvasProps) {
  const initialNodes = useMemo(() => blocksToNodes(blocks), [blocks])
  const initialEdges = useMemo(() => blocksToEdges(blocks), [blocks])

  const [nodes, _setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds))

      // 接続が作成されたら、show_conditionを更新
      if (connection.source && connection.target) {
        const sourceBlockId = parseInt(connection.source)
        const targetBlockId = parseInt(connection.target)

        // TODO: モーダルで条件値を入力させる
        // 今は仮でデフォルト値を設定
        const sourceBlock = blocks.find((b) => b.id === sourceBlockId)
        let conditionValue = 'yes'

        if (sourceBlock?.block_type === 'choice') {
          // Choice blockの場合、最初の選択肢をデフォルトにする
          const options = sourceBlock.metadata?.choice_options || []
          conditionValue = options[0]?.value || ''
        }

        onBlockUpdate(targetBlockId, {
          show_condition: {
            type: sourceBlock?.block_type === 'yes_no' ? 'yes_no' : 'choice',
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
    <div style={{ width: '100%', height: '600px' }} className="border border-gray-300 rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
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
    </div>
  )
}
