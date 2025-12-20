import { useState } from 'react'
import type { FormBuilderData, FormBuilderCategory } from '../../../types/formBuilderV3'
import { addTriggerStep } from '../../../utils/formBuilderLogic'
import { productTypeLabels } from '../../../utils/labelConverter'

interface StepTriggerProps {
  formData: FormBuilderData
  onUpdate: (formData: FormBuilderData) => void
  onNext: () => void
}

/**
 * Step 1: 最初に選ぶ項目を追加
 * お客様が最初に選ぶ項目（撮影コース、撮影場所など）を設定
 */
export default function StepTrigger({ formData, onUpdate, onNext }: StepTriggerProps) {
  const [categoryName, setCategoryName] = useState('')
  const [categoryDisplayName, setCategoryDisplayName] = useState('')
  const [categoryDescription, setCategoryDescription] = useState('')
  const [productType, setProductType] = useState<'plan' | 'option_single' | 'option_multi'>('plan')
  const [items, setItems] = useState<Array<{ name: string; price: number; description?: string }>>([
    { name: '', price: 0, description: '' }
  ])

  const handleAddItem = () => {
    setItems([...items, { name: '', price: 0, description: '' }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!categoryName || !categoryDisplayName) {
      alert('カテゴリ名と表示名は必須です')
      return
    }

    if (items.some((item) => !item.name || item.price < 0)) {
      alert('すべての選択肢に名前を入力し、価格は0以上にしてください')
      return
    }

    // FormBuilderCategoryを作成
    const category: FormBuilderCategory = {
      id: Date.now(), // 仮ID（保存時にサーバーが割り当て）
      name: categoryName,
      displayName: categoryDisplayName,
      description: categoryDescription || undefined,
      productType,
      items: items.map((item, index) => ({
        id: Date.now() + index,
        name: item.name,
        price: item.price,
        description: item.description || undefined
      }))
    }

    // TDDで実装したロジックを使用
    const updatedFormData = addTriggerStep(formData, category)
    onUpdate(updatedFormData)

    // フォームをリセット
    setCategoryName('')
    setCategoryDisplayName('')
    setCategoryDescription('')
    setProductType('plan')
    setItems([{ name: '', price: 0, description: '' }])
  }

  // 既存のtrigger項目
  const existingTriggers = formData.steps.filter((s) => s.type === 'trigger')

  return (
    <div className="space-y-6">
      {/* 既存のtrigger項目一覧 */}
      {existingTriggers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3">追加済みの項目</h3>
          <div className="space-y-2">
            {existingTriggers.map((step, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-lg">📸</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{step.category.displayName}</div>
                  <div className="text-xs text-gray-600">
                    {productTypeLabels[step.category.productType]} / {step.category.items.length}個の選択肢
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 新規項目追加フォーム */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">新しい項目を追加</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* カテゴリ基本情報 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                項目名（内部用キー） <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="shooting_course"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                お客様に表示する名前 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={categoryDisplayName}
                onChange={(e) => setCategoryDisplayName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="撮影コース"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
              <textarea
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                rows={2}
                placeholder="お客様が最初に選ぶコースです"
              />
            </div>
          </div>

          {/* 選択方法 */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              お客様はどう選びますか？
            </label>
            <div className="space-y-2">
              <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                style={{ borderColor: productType === 'plan' ? '#10b981' : '#e5e7eb', backgroundColor: productType === 'plan' ? '#f0fdf4' : 'white' }}>
                <input
                  type="radio"
                  value="plan"
                  checked={productType === 'plan'}
                  onChange={(e) => setProductType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">◉ 1つだけ選ぶ（丸ボタン）</div>
                  <div className="text-xs text-gray-600 mt-1">
                    コース選択など、1つだけ選ぶ場合
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                style={{ borderColor: productType === 'option_single' ? '#10b981' : '#e5e7eb', backgroundColor: productType === 'option_single' ? '#f0fdf4' : 'white' }}>
                <input
                  type="radio"
                  value="option_single"
                  checked={productType === 'option_single'}
                  onChange={(e) => setProductType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">▼ 1つだけ選ぶ（プルダウン）</div>
                  <div className="text-xs text-gray-600 mt-1">
                    選択肢が多い場合、省スペースで表示
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                style={{ borderColor: productType === 'option_multi' ? '#10b981' : '#e5e7eb', backgroundColor: productType === 'option_multi' ? '#f0fdf4' : 'white' }}>
                <input
                  type="radio"
                  value="option_multi"
                  checked={productType === 'option_multi'}
                  onChange={(e) => setProductType(e.target.value as any)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800">☑ 複数選べる（チェックボックス）</div>
                  <div className="text-xs text-gray-600 mt-1">
                    複数選択可能なオプション
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 選択肢 */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              選択肢 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex gap-2 items-start p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder={`選択肢${index + 1}の名前（例: スタジオ撮影）`}
                      required
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => handleItemChange(index, 'price', Number(e.target.value))}
                        className="w-32 border border-gray-300 rounded px-3 py-2"
                        placeholder="価格"
                        min="0"
                        required
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-3 py-2"
                        placeholder="説明（任意）"
                      />
                    </div>
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-700 text-sm px-2"
                    >
                      削除
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddItem}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + 選択肢を追加
            </button>
          </div>

          {/* 追加ボタン */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              項目を追加
            </button>
          </div>
        </form>
      </div>

      {/* 次へボタン */}
      {existingTriggers.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onNext}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            次へ：条件付き項目を追加 →
          </button>
        </div>
      )}
    </div>
  )
}
