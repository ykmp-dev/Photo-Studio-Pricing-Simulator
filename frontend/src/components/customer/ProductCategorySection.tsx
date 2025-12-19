import type { ProductCategoryV3 } from '../../types/formV3'
import type { Item } from '../../types/category'
import { getFieldTypeFromProductType } from '../../utils/formHelpers'

interface ProductCategorySectionProps {
  category: ProductCategoryV3
  items: Item[]
  selectedItemIds: number[]
  onFieldChange: (fieldName: string, value: string | number | boolean | number[] | null) => void
  onItemSelectionChange: (itemId: number, isSelected: boolean) => void
}

/**
 * v3仕様書: 商品カテゴリセクション
 * UIコンポーネント（radio/select/checkbox）は product_type から自動決定
 */
export default function ProductCategorySection({
  category,
  items,
  selectedItemIds,
  onFieldChange,
  onItemSelectionChange
}: ProductCategorySectionProps) {
  if (!category.product_type) {
    return null // product_typeが設定されていない場合は何も表示しない
  }

  const fieldType = getFieldTypeFromProductType(category.product_type)
  const fieldName = `category_${category.id}`

  const handleRadioChange = (itemId: number) => {
    // ラジオボタンは排他選択
    // 既存の選択を解除
    items.forEach((item) => {
      if (selectedItemIds.includes(item.id) && item.id !== itemId) {
        onItemSelectionChange(item.id, false)
      }
    })
    // 新しい選択を追加
    onItemSelectionChange(itemId, true)
    onFieldChange(fieldName, itemId)
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const itemId = parseInt(e.target.value)
    if (itemId) {
      // セレクトは排他選択
      items.forEach((item) => {
        if (selectedItemIds.includes(item.id) && item.id !== itemId) {
          onItemSelectionChange(item.id, false)
        }
      })
      onItemSelectionChange(itemId, true)
      onFieldChange(fieldName, itemId)
    } else {
      // 選択解除
      items.forEach((item) => {
        if (selectedItemIds.includes(item.id)) {
          onItemSelectionChange(item.id, false)
        }
      })
      onFieldChange(fieldName, null)
    }
  }

  const handleCheckboxChange = (itemId: number, checked: boolean) => {
    onItemSelectionChange(itemId, checked)
    // チェックボックスは複数選択可能なので、配列で管理
    const currentSelection = selectedItemIds.filter((id) =>
      items.some((item) => item.id === id)
    )
    const newSelection = checked
      ? [...currentSelection, itemId]
      : currentSelection.filter((id) => id !== itemId)
    onFieldChange(fieldName, newSelection)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{category.display_name}</h3>
      {category.description && (
        <p className="text-sm text-gray-600 mb-4">{category.description}</p>
      )}

      {/* Radio (plan) */}
      {fieldType === 'radio' && (
        <div className="space-y-2">
          {items.map((item) => (
            <label key={item.id} className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="radio"
                name={fieldName}
                value={item.id}
                checked={selectedItemIds.includes(item.id)}
                onChange={() => handleRadioChange(item.id)}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <div className="ml-3 flex-1">
                <div className="font-medium text-gray-900">{item.name}</div>
                {item.description && (
                  <div className="text-sm text-gray-600">{item.description}</div>
                )}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                ¥{item.price.toLocaleString()}
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Select (option_single) */}
      {fieldType === 'select' && (
        <select
          value={items.find((item) => selectedItemIds.includes(item.id))?.id || ''}
          onChange={handleSelectChange}
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- 選択してください --</option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} - ¥{item.price.toLocaleString()}
            </option>
          ))}
        </select>
      )}

      {/* Checkbox (option_multi) */}
      {fieldType === 'checkbox' && (
        <div className="space-y-2">
          {items.map((item) => (
            <label key={item.id} className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedItemIds.includes(item.id)}
                onChange={(e) => handleCheckboxChange(item.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500 rounded"
              />
              <div className="ml-3 flex-1">
                <div className="font-medium text-gray-900">{item.name}</div>
                {item.description && (
                  <div className="text-sm text-gray-600">{item.description}</div>
                )}
              </div>
              <div className="text-lg font-semibold text-gray-900">
                ¥{item.price.toLocaleString()}
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}
