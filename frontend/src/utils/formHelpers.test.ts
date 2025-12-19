import { describe, it, expect } from 'vitest'
import {
  getFieldTypeFromProductType,
  calculateTotalPrice
} from './formHelpers'
import type { Item } from '../types/category'

describe('UIコンポーネントマッピング', () => {
  it('product_type: "plan" → field_type: "radio"', () => {
    expect(getFieldTypeFromProductType('plan')).toBe('radio')
  })

  it('product_type: "option_single" → field_type: "select"', () => {
    expect(getFieldTypeFromProductType('option_single')).toBe('select')
  })

  it('product_type: "option_multi" → field_type: "checkbox"', () => {
    expect(getFieldTypeFromProductType('option_multi')).toBe('checkbox')
  })
})

describe('合計金額計算', () => {
  const createItem = (id: number, price: number): Item => ({
    id,
    shop_id: 1,
    product_category_id: 1,
    name: `Item ${id}`,
    price,
    description: null,
    sort_order: 0,
    is_active: true,
    is_required: false,
    auto_select: false,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  })

  it('v3仕様書の税込計算: floor(subtotal * 1.10)', () => {
    const items: Item[] = [
      createItem(1, 50000), // スタジオ撮影プラン
      createItem(2, 10000), // 正絹標準
      createItem(3, 8000),  // 洋髪セット
    ]

    const selectedItemIds = [1, 2, 3]

    // 小計: 50000 + 10000 + 8000 = 68000
    // 税込: floor(68000 * 1.10) = floor(74800) = 74800
    expect(calculateTotalPrice(selectedItemIds, items)).toBe(74800)
  })

  it('端数の切り捨て処理', () => {
    const items: Item[] = [
      createItem(1, 333),
      createItem(2, 333),
      createItem(3, 333)
    ]

    const selectedItemIds = [1, 2, 3]

    // 小計: 999
    // 税込: floor(999 * 1.10) = floor(1098.9) = 1098
    expect(calculateTotalPrice(selectedItemIds, items)).toBe(1098)
  })

  it('選択アイテムが0件の場合、0円', () => {
    const items: Item[] = [
      createItem(1, 10000),
      createItem(2, 5000)
    ]

    const selectedItemIds: number[] = []

    expect(calculateTotalPrice(selectedItemIds, items)).toBe(0)
  })

  it('選択アイテムIDが存在しない場合、そのIDは無視される', () => {
    const items: Item[] = [
      createItem(1, 10000),
      createItem(2, 5000)
    ]

    const selectedItemIds = [1, 999] // 999は存在しない

    // 小計: 10000 のみ
    // 税込: floor(10000 * 1.10) = 11000
    expect(calculateTotalPrice(selectedItemIds, items)).toBe(11000)
  })

  it('負の価格は計算に含まれる（マイナス値も許容）', () => {
    const items: Item[] = [
      createItem(1, 10000),
      createItem(2, -1000) // 割引アイテム
    ]

    const selectedItemIds = [1, 2]

    // 小計: 10000 + (-1000) = 9000
    // 税込: floor(9000 * 1.10) = 9900
    expect(calculateTotalPrice(selectedItemIds, items)).toBe(9900)
  })

  it('重複IDは1回のみカウント', () => {
    const items: Item[] = [
      createItem(1, 10000)
    ]

    const selectedItemIds = [1, 1, 1] // 重複

    // 小計: 10000 (1回のみ)
    // 税込: 11000
    expect(calculateTotalPrice(selectedItemIds, items)).toBe(11000)
  })
})
