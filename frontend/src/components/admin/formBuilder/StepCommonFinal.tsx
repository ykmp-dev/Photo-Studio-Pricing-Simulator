import { useState, useEffect } from 'react'
import type { FormBuilderData, FormBuilderCategory } from '../../../types/formBuilderV3'
import type { ProductCategory, Item } from '../../../types/category'
import { addCommonFinalStep, removeStep } from '../../../utils/formBuilderLogic'
import { productTypeLabels } from '../../../utils/labelConverter'
import { getProductCategories, getItems } from '../../../services/categoryService'

interface StepCommonFinalProps {
  formData: FormBuilderData
  onUpdate: (formData: FormBuilderData) => void
  onNext: () => void
  onBack: () => void
}

/**
 * Step 3: いつも表示する項目を追加
 * どの選択肢でも必ず表示する追加オプションを設定
 */
export default function StepCommonFinal({ formData, onUpdate, onNext, onBack }: StepCommonFinalProps) {
  // 既存データの取得
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [productType, setProductType] = useState<'plan' | 'option_single' | 'option_multi'>('option_multi')
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null)

  const shopId = formData.shopId
  const commonFinalSteps = formData.steps.filter((s) => s.type === 'common_final')

  // 商品カテゴリ一覧を取得
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true)
        const categories = await getProductCategories(shopId)
        setProductCategories(categories)
      } catch (error) {
        console.error('商品カテゴリの読み込みに失敗:', error)
        alert('商品カテゴリの読み込みに失敗しました')
      } finally {
        setLoading(false)
      }
    }
    loadCategories()
  }, [shopId])

  // 選択されたカテゴリのアイテム一覧を取得
  useEffect(() => {
    const loadItems = async () => {
      if (selectedCategoryId) {
        try {
          const categoryItems = await getItems(shopId, selectedCategoryId)
          setItems(categoryItems)
        } catch (error) {
          console.error('アイテムの読み込みに失敗:', error)
          alert('アイテムの読み込みに失敗しました')
          setItems([])
        }
      } else {
        setItems([])
      }
    }
    loadItems()
  }, [selectedCategoryId, shopId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // バリデーション
    if (!selectedCategoryId) {
      alert('商品カテゴリを選択してください')
      return
    }

    if (items.length === 0) {
      alert('選択したカテゴリにアイテムが登録されていません。先にカテゴリ管理タブでアイテムを追加してください。')
      return
    }

    // 選択されたカテゴリ情報を取得
    const selectedCategory = productCategories.find(c => c.id === selectedCategoryId)
    if (!selectedCategory) {
      alert('カテゴリ情報の取得に失敗しました')
      return
    }

    // FormBuilderCategoryを作成（既存データから）
    const category: FormBuilderCategory = {
      id: selectedCategory.id,
      name: selectedCategory.name,
      displayName: selectedCategory.display_name,
      description: selectedCategory.description || undefined,
      productType,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description || undefined
      }))
    }

    let updatedFormData: FormBuilderData

    if (editingStepIndex !== null) {
      // 編集モード: 既存ステップを更新
      const commonFinalStepsWithIndex = formData.steps
        .map((step, idx) => ({ step, idx }))
        .filter(({ step }) => step.type === 'common_final')

      const actualIndex = commonFinalStepsWithIndex[editingStepIndex]?.idx
      if (actualIndex !== undefined) {
        const newSteps = [...formData.steps]
        newSteps[actualIndex] = {
          ...newSteps[actualIndex],
          category
        }
        updatedFormData = { ...formData, steps: newSteps }
      } else {
        alert('編集対象のステップが見つかりませんでした')
        return
      }
    } else {
      // 新規追加モード
      updatedFormData = addCommonFinalStep(formData, category)
    }

    onUpdate(updatedFormData)

    // フォームリセット
    setSelectedCategoryId(null)
    setProductType('option_multi')
    setItems([])
    setEditingStepIndex(null)
  }

  const handleEdit = async (stepIndex: number) => {
    const commonFinalSteps = formData.steps.filter((s) => s.type === 'common_final')
    const step = commonFinalSteps[stepIndex]

    if (!step) return

    // フォームに既存データをセット
    setSelectedCategoryId(step.category.id)
    setProductType(step.category.productType)
    setEditingStepIndex(stepIndex)

    // アイテムはuseEffectで自動的に読み込まれる
  }

  const handleCancelEdit = () => {
    setSelectedCategoryId(null)
    setProductType('option_multi')
    setItems([])
    setEditingStepIndex(null)
  }

  const handleDelete = (stepIndex: number) => {
    if (!confirm('この項目を削除しますか？')) return

    // 実際のsteps配列内のインデックスを見つける
    const commonFinalStepsWithIndex = formData.steps
      .map((step, idx) => ({ step, idx }))
      .filter(({ step }) => step.type === 'common_final')

    const actualIndex = commonFinalStepsWithIndex[stepIndex]?.idx
    if (actualIndex !== undefined) {
      const updatedFormData = removeStep(formData, actualIndex)
      onUpdate(updatedFormData)
    }
  }

  return (
    <div className="space-y-6">
      {/* 既存のcommon_final項目一覧 */}
      {commonFinalSteps.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-base font-semibold text-gray-800 mb-3">追加済みのいつも表示する項目</h3>
          <div className="space-y-2">
            {commonFinalSteps.map((step, index) => (
              <div key={index} className={`flex items-center gap-2 p-3 border rounded-lg ${
                editingStepIndex === index ? 'bg-yellow-50 border-yellow-400' : 'bg-green-50 border-green-200'
              }`}>
                <span className="text-lg">📚</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{step.category.displayName}</div>
                  <div className="text-xs text-gray-600">
                    {productTypeLabels[step.category.productType]} / {step.category.items.length}個の選択肢
                  </div>
                  {editingStepIndex === index && (
                    <div className="text-xs text-yellow-700 mt-1">編集中...</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(index)}
                    className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors"
                    title="編集"
                    disabled={editingStepIndex !== null && editingStepIndex !== index}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(index)}
                    className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                    title="削除"
                    disabled={editingStepIndex !== null}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 既存カテゴリ選択フォーム */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              {editingStepIndex !== null ? '項目を編集' : '新しい項目を追加'}
            </h3>
            {editingStepIndex === null && (
              <p className="text-sm text-gray-600 mt-1">
                どのコースを選んでも最後に表示される追加オプションです（例：データ納品、アルバム追加など）
              </p>
            )}
          </div>
          {editingStepIndex !== null && (
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
            >
              編集をキャンセル
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 商品カテゴリ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              商品カテゴリを選択 <span className="text-red-500">*</span>
            </label>
            {loading ? (
              <div className="text-sm text-gray-500">読み込み中...</div>
            ) : productCategories.length === 0 ? (
              <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                商品カテゴリが登録されていません。先に「カテゴリ管理」タブで商品カテゴリとアイテムを作成してください。
              </div>
            ) : (
              <select
                value={selectedCategoryId || ''}
                onChange={(e) => setSelectedCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">選択してください</option>
                {productCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.display_name} ({category.name})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 選択されたカテゴリの説明 */}
          {selectedCategoryId && productCategories.find(c => c.id === selectedCategoryId)?.description && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-xs font-medium text-blue-800 mb-1">カテゴリ説明</div>
              <div className="text-sm text-blue-700">
                {productCategories.find(c => c.id === selectedCategoryId)?.description}
              </div>
            </div>
          )}

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
                  <div className="text-xs text-gray-600 mt-1">おすすめ</div>
                </div>
              </label>
            </div>
          </div>

          {/* アイテム一覧（自動表示・編集不可） */}
          {selectedCategoryId && (
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                このカテゴリのアイテム（自動表示）
              </label>
              {items.length === 0 ? (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  このカテゴリにはアイテムが登録されていません。先に「カテゴリ管理」タブでアイテムを追加してください。
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{item.name}</div>
                        {item.description && (
                          <div className="text-xs text-gray-600 mt-1">{item.description}</div>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-gray-800">
                        ¥{item.price.toLocaleString()}
                      </div>
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 mt-2">
                    ※ アイテムの編集は「カテゴリ管理」タブで行えます
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 追加ボタン */}
          <button
            type="submit"
            className={`w-full px-4 py-2 rounded-lg font-medium text-white ${
              editingStepIndex !== null
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {editingStepIndex !== null ? '更新' : '項目を追加'}
          </button>
        </form>
      </div>

      {/* ナビゲーション */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
        >
          ← 戻る
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
        >
          次へ：プレビュー →
        </button>
      </div>
    </div>
  )
}
