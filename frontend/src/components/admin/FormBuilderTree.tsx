import { useState, useMemo } from 'react'
import type { FormBlock, BlockType } from '../../types/formBuilder'

interface FormBuilderTreeProps {
  blocks: FormBlock[]
  onBlockUpdate: (blockId: number, updates: Partial<FormBlock>) => void
  onBlockDelete: (blockId: number) => void
  onBlockAdd: (blockType: BlockType, parentId?: number, conditionValue?: string) => void
}

interface TreeNode {
  block: FormBlock
  children: TreeNode[]
  depth: number
}

// ブロックからツリー構造を構築
function buildTree(blocks: FormBlock[]): TreeNode[] {
  const rootBlocks = blocks.filter(b => !b.show_condition)

  function buildNode(block: FormBlock, depth: number = 0): TreeNode {
    // このブロックを参照している子ブロックを見つける
    const children = blocks
      .filter(b => b.show_condition?.block_id === block.id)
      .map(child => buildNode(child, depth + 1))

    return { block, children, depth }
  }

  return rootBlocks.map(root => buildNode(root))
}

// ブロックタイプのアイコンとラベル
const getBlockTypeInfo = (type: BlockType): { icon: string; label: string; color: string } => {
  const info: Record<BlockType, { icon: string; label: string; color: string }> = {
    text: { icon: '📝', label: 'テキスト', color: 'bg-gray-100 text-gray-700' },
    heading: { icon: '📌', label: '見出し', color: 'bg-blue-100 text-blue-700' },
    list: { icon: '📋', label: 'リスト', color: 'bg-purple-100 text-purple-700' },
    yes_no: { icon: '❓', label: 'Yes/No', color: 'bg-green-100 text-green-700' },
    choice: { icon: '🎯', label: '選択肢', color: 'bg-orange-100 text-orange-700' },
    category_reference: { icon: '🏷️', label: 'カテゴリ', color: 'bg-pink-100 text-pink-700' },
  }
  return info[type] || { icon: '📄', label: type, color: 'bg-gray-100' }
}

// 個別のツリーアイテム
function TreeBlockItem({
  node,
  onUpdate,
  onDelete,
  onAddChild,
  isEditing,
  onStartEdit,
  onEndEdit,
}: {
  node: TreeNode
  onUpdate: (blockId: number, updates: Partial<FormBlock>) => void
  onDelete: (blockId: number) => void
  onAddChild: (parentId: number, conditionValue?: string) => void
  isEditing: boolean
  onStartEdit: () => void
  onEndEdit: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [editContent, setEditContent] = useState(node.block.content || '')
  const { icon, label, color } = getBlockTypeInfo(node.block.block_type)

  const hasChildren = node.children.length > 0
  const indentLevel = node.depth

  const handleSaveContent = () => {
    if (editContent !== node.block.content) {
      onUpdate(node.block.id, { content: editContent })
    }
    onEndEdit()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSaveContent()
    }
    if (e.key === 'Escape') {
      setEditContent(node.block.content || '')
      onEndEdit()
    }
  }

  return (
    <div className="select-none">
      {/* ブロック本体 */}
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-gray-50 rounded group"
        style={{ paddingLeft: `${indentLevel * 24 + 12}px` }}
      >
        {/* 展開/折りたたみボタン */}
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* ブロックタイプバッジ */}
        <div className={`px-2 py-1 rounded text-xs font-medium ${color} flex items-center gap-1`}>
          <span>{icon}</span>
          <span>{label}</span>
        </div>

        {/* 条件ラベル */}
        {node.block.show_condition && (
          <div className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded">
            {node.block.show_condition.value === 'yes' && '✓ Yes'}
            {node.block.show_condition.value === 'no' && '✗ No'}
            {node.block.show_condition.value === 'next' && '→ 次へ'}
            {!['yes', 'no', 'next'].includes(node.block.show_condition.value) &&
              `→ ${node.block.show_condition.value}`}
          </div>
        )}

        {/* コンテンツ表示/編集 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onBlur={handleSaveContent}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="内容を入力..."
            />
          ) : (
            <div
              onClick={onStartEdit}
              className="px-2 py-1 cursor-text hover:bg-white hover:border hover:border-gray-300 rounded truncate"
            >
              {node.block.content || (
                <span className="text-gray-400 italic">内容なし（クリックで編集）</span>
              )}
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* 子ブロック追加 */}
          {(node.block.block_type === 'yes_no' ||
            node.block.block_type === 'choice' ||
            node.block.block_type === 'text' ||
            node.block.block_type === 'heading' ||
            node.block.block_type === 'category_reference') && (
            <button
              onClick={() => onAddChild(node.block.id)}
              className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              title="子ブロックを追加"
            >
              + 子
            </button>
          )}

          {/* 削除ボタン */}
          <button
            onClick={() => {
              if (confirm(`「${node.block.content || label}」を削除しますか？`)) {
                onDelete(node.block.id)
              }
            }}
            className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            title="削除"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* 子ブロック */}
      {isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeBlockItemWrapper
              key={child.block.id}
              node={child}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Wrapperコンポーネントで編集状態を管理
function TreeBlockItemWrapper({
  node,
  onUpdate,
  onDelete,
  onAddChild,
}: {
  node: TreeNode
  onUpdate: (blockId: number, updates: Partial<FormBlock>) => void
  onDelete: (blockId: number) => void
  onAddChild: (parentId: number, conditionValue?: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)

  return (
    <TreeBlockItem
      node={node}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onAddChild={onAddChild}
      isEditing={isEditing}
      onStartEdit={() => setIsEditing(true)}
      onEndEdit={() => setIsEditing(false)}
    />
  )
}

export default function FormBuilderTree({
  blocks,
  onBlockUpdate,
  onBlockDelete,
  onBlockAdd,
}: FormBuilderTreeProps) {
  const [showAddMenu, setShowAddMenu] = useState(false)

  // ツリー構造を構築
  const tree = useMemo(() => buildTree(blocks), [blocks])

  // ルートブロックを追加
  const handleAddRoot = (blockType: BlockType) => {
    onBlockAdd(blockType)
    setShowAddMenu(false)
  }

  // 子ブロックを追加
  const handleAddChild = (parentId: number, conditionValue?: string) => {
    // 親ブロックを見つける
    const parentBlock = blocks.find(b => b.id === parentId)
    if (!parentBlock) return

    // ブロックタイプに応じてデフォルトの条件値を設定
    let defaultConditionValue = conditionValue || 'next'
    if (parentBlock.block_type === 'yes_no' && !conditionValue) {
      // Yes/Noブロックの場合、既存の子の条件を確認
      const existingYes = blocks.some(b =>
        b.show_condition?.block_id === parentId && b.show_condition.value === 'yes'
      )
      const existingNo = blocks.some(b =>
        b.show_condition?.block_id === parentId && b.show_condition.value === 'no'
      )

      if (!existingYes) {
        defaultConditionValue = 'yes'
      } else if (!existingNo) {
        defaultConditionValue = 'no'
      } else {
        alert('Yes/Noブロックには、YesとNoの2つの子ブロックしか追加できません。')
        return
      }
    }

    onBlockAdd('text', parentId, defaultConditionValue)
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">フォームブロック</h3>
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
            >
              + ルートブロック追加
            </button>

            {showAddMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {(['text', 'heading', 'yes_no', 'choice', 'category_reference'] as BlockType[]).map((type) => {
                    const { icon, label, color } = getBlockTypeInfo(type)
                    return (
                      <button
                        key={type}
                        onClick={() => handleAddRoot(type)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                      >
                        <span className={`px-2 py-1 rounded text-xs ${color}`}>
                          {icon} {label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ツリー表示 */}
      <div className="flex-1 overflow-y-auto p-4">
        {tree.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <p className="text-lg mb-2">ブロックがありません</p>
            <p className="text-sm">「+ ルートブロック追加」からブロックを追加してください</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => (
              <TreeBlockItemWrapper
                key={node.block.id}
                node={node}
                onUpdate={onBlockUpdate}
                onDelete={onBlockDelete}
                onAddChild={handleAddChild}
              />
            ))}
          </div>
        )}
      </div>

      {/* フッター情報 */}
      <div className="border-t border-gray-200 px-4 py-3 bg-gray-50">
        <div className="text-sm text-gray-600">
          合計ブロック数: {blocks.length}
        </div>
      </div>
    </div>
  )
}
