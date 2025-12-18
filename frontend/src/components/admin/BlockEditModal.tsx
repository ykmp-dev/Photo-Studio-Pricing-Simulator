import { useState, useEffect } from 'react'
import type { FormBlock, BlockType, ChoiceOption } from '../../types/formBuilder'

interface BlockEditModalProps {
  block: FormBlock | null
  productCategories: Array<{ id: number; display_name: string; items?: any[] }>
  onSave: (blockId: number, updates: Partial<FormBlock>) => void
  onClose: () => void
  onDelete?: (blockId: number) => void
}

export default function BlockEditModal({
  block,
  productCategories,
  onSave,
  onClose,
  onDelete,
}: BlockEditModalProps) {
  const [blockType, setBlockType] = useState<BlockType>('text')
  const [content, setContent] = useState('')
  const [productCategoryId, setProductCategoryId] = useState<number | null>(null)

  // Choice block専用
  const [choiceOptions, setChoiceOptions] = useState<ChoiceOption[]>([])
  const [choiceDisplay, setChoiceDisplay] = useState<'radio' | 'select' | 'auto'>('auto')
  const [choiceInputMode, setChoiceInputMode] = useState<'manual' | 'category'>('manual')
  const [choiceCategoryId, setChoiceCategoryId] = useState<number | null>(null)

  useEffect(() => {
    if (block) {
      setBlockType(block.block_type)
      setContent(block.content || '')
      setProductCategoryId(block.metadata?.product_category_id || null)
      setChoiceOptions(block.metadata?.choice_options || [])
      setChoiceDisplay(block.metadata?.choice_display || 'auto')
      setChoiceInputMode(block.metadata?.auto_sync_category_id ? 'category' : 'manual')
      setChoiceCategoryId(block.metadata?.auto_sync_category_id || null)
    }
  }, [block])

  if (!block) return null

  const handleSave = () => {
    let metadata: any = {}

    if (blockType === 'category_reference' && productCategoryId) {
      metadata = { product_category_id: productCategoryId }
    } else if (blockType === 'choice') {
      if (choiceInputMode === 'category' && choiceCategoryId) {
        metadata = {
          auto_sync_category_id: choiceCategoryId,
          choice_display: choiceDisplay,
        }
      } else {
        metadata = {
          choice_options: choiceOptions,
          choice_display: choiceDisplay,
        }
      }
    }

    onSave(block.id, {
      block_type: blockType,
      content: content || null,
      metadata,
    })
    onClose()
  }

  const handleAddChoiceOption = () => {
    const value = prompt('内部値（英数字）:')
    const label = prompt('表示テキスト:')
    const priceStr = prompt('追加料金（円）:', '0')

    if (value && label) {
      setChoiceOptions([...choiceOptions, {
        value,
        label,
        price: parseInt(priceStr || '0'),
      }])
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">ブロック編集</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* ブロックタイプ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ブロックタイプ
            </label>
            <select
              value={blockType}
              onChange={(e) => setBlockType(e.target.value as BlockType)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="text">テキスト</option>
              <option value="heading">見出し</option>
              <option value="yes_no">Yes/No質問</option>
              <option value="choice">選択肢（Choice）</option>
              <option value="category_reference">カテゴリ参照</option>
            </select>
          </div>

          {/* コンテンツ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              内容
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 h-24"
              placeholder="ブロックの内容を入力..."
            />
          </div>

          {/* カテゴリ参照の場合 */}
          {blockType === 'category_reference' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                商品カテゴリ
              </label>
              <select
                value={productCategoryId || ''}
                onChange={(e) => setProductCategoryId(Number(e.target.value) || null)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">選択してください</option>
                {productCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.display_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Choice blockの場合 */}
          {blockType === 'choice' && (
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <h4 className="font-medium text-purple-900 mb-3">選択肢設定</h4>

              {/* 入力モード */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">入力方法</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={choiceInputMode === 'manual'}
                      onChange={() => setChoiceInputMode('manual')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">手動入力</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={choiceInputMode === 'category'}
                      onChange={() => setChoiceInputMode('category')}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">カテゴリ連動</span>
                  </label>
                </div>
              </div>

              {/* カテゴリ連動 */}
              {choiceInputMode === 'category' && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    商品カテゴリ
                  </label>
                  <select
                    value={choiceCategoryId || ''}
                    onChange={(e) => setChoiceCategoryId(Number(e.target.value) || null)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">選択してください</option>
                    {productCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.display_name} ({cat.items?.length || 0}個)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 手動入力 */}
              {choiceInputMode === 'manual' && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">選択肢</label>
                    <button
                      type="button"
                      onClick={handleAddChoiceOption}
                      className="text-sm bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700"
                    >
                      + 追加
                    </button>
                  </div>
                  <div className="space-y-2">
                    {choiceOptions.map((opt, idx) => (
                      <div key={idx} className="bg-white border rounded p-2 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{opt.label}</div>
                          <div className="text-xs text-gray-500">
                            値: {opt.value} / 料金: ¥{opt.price.toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => setChoiceOptions(choiceOptions.filter((_, i) => i !== idx))}
                          className="text-red-600 hover:text-red-700 text-sm px-2"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 表示方式 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">表示方式</label>
                <select
                  value={choiceDisplay}
                  onChange={(e) => setChoiceDisplay(e.target.value as any)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="auto">自動判定</option>
                  <option value="radio">ラジオボタン</option>
                  <option value="select">ドロップダウン</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSave}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            保存
          </button>
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('このブロックを削除しますか？')) {
                  onDelete(block.id)
                  onClose()
                }
              }}
              className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
            >
              削除
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
