import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import type { FormBlock } from '../../types/formBuilder'

interface FormBlockNodeData {
  block: FormBlock
  onUpdate: (updates: Partial<FormBlock>) => void
  onDelete: () => void
}

// ブロックタイプごとのアイコンと色
const blockStyles = {
  text: { icon: '📝', color: 'bg-gray-100', border: 'border-gray-300' },
  heading: { icon: '📋', color: 'bg-gray-100', border: 'border-gray-300' },
  list: { icon: '📋', color: 'bg-gray-100', border: 'border-gray-300' },
  yes_no: { icon: '❓', color: 'bg-blue-50', border: 'border-blue-300' },
  choice: { icon: '☑️', color: 'bg-purple-50', border: 'border-purple-300' },
  category_reference: { icon: '🏷️', color: 'bg-green-50', border: 'border-green-300' },
}

function FormBlockNode({ data }: NodeProps<FormBlockNodeData>) {
  const { block } = data
  const style = blockStyles[block.block_type]

  // ブロックタイプのラベル
  const typeLabels: Record<typeof block.block_type, string> = {
    text: 'テキスト',
    heading: '見出し',
    list: 'リスト',
    yes_no: 'Yes/No質問',
    choice: '選択肢',
    category_reference: 'カテゴリ参照',
  }

  return (
    <div
      className={`px-3 py-2 shadow-md rounded-lg border-2 ${style.color} ${style.border} min-w-[160px] max-w-[220px]`}
    >
      {/* 入力ハンドル（左側） - すべてのブロックに追加 */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 !bg-gray-400"
      />

      {/* ヘッダー */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-base">{style.icon}</span>
        <span className="text-xs font-semibold text-gray-600">{typeLabels[block.block_type]}</span>
      </div>

      {/* コンテンツ */}
      <div className="text-xs text-gray-800 font-medium mb-1 line-clamp-2">
        {block.content || <span className="text-gray-400 italic">（内容なし）</span>}
      </div>

      {/* Choice blockの選択肢数表示 */}
      {block.block_type === 'choice' && (
        <div className="text-xs text-purple-600 mt-1">
          {block.metadata?.auto_sync_category_id
            ? '📂 カテゴリ連動'
            : `${block.metadata?.choice_options?.length || 0}個の選択肢`}
        </div>
      )}

      {/* Category参照の場合 */}
      {block.block_type === 'category_reference' && block.metadata?.product_category_id && (
        <div className="text-xs text-green-600 mt-1">カテゴリID: {block.metadata.product_category_id}</div>
      )}

      {/* 条件表示 */}
      {block.show_condition && (
        <div className="mt-1.5 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
          条件: {block.show_condition.value}
        </div>
      )}

      {/* 出力ハンドル（右側） - すべてのブロックに追加 */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 !bg-blue-500"
      />
    </div>
  )
}

export default memo(FormBlockNode)
