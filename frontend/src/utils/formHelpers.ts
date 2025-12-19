import type { ProductType, FieldType } from '../types/formV3'
import type { Item } from '../types/category'

/**
 * v3仕様書: 商品タイプからUIコンポーネントタイプへのマッピング
 * @param productType 商品タイプ
 * @returns UIコンポーネントタイプ
 */
export function getFieldTypeFromProductType(productType: ProductType): FieldType {
  const mapping: Record<ProductType, FieldType> = {
    plan: 'radio',
    option_single: 'select',
    option_multi: 'checkbox'
  }

  return mapping[productType]
}

/**
 * v3仕様書: 合計金額を計算（税込10%、端数切り捨て）
 * @param selectedItemIds 選択されたアイテムIDの配列
 * @param allItems すべてのアイテム
 * @returns 税込合計金額（円）
 */
export function calculateTotalPrice(
  selectedItemIds: number[],
  allItems: Item[]
): number {
  const TAX_RATE = 0.1

  // 重複を除去
  const uniqueIds = Array.from(new Set(selectedItemIds))

  // 小計を計算
  const subtotal = uniqueIds.reduce((sum, itemId) => {
    const item = allItems.find((i) => i.id === itemId)
    if (!item) {
      return sum // アイテムが見つからない場合は無視
    }
    return sum + item.price
  }, 0)

  // 税込金額を計算（端数切り捨て）
  const total = Math.floor(subtotal * (1 + TAX_RATE))

  return total
}
