// v3フォームビルダーの型定義

// フォームセクションタイプ
export type FormSection = 'trigger' | 'conditional' | 'common_final'

// 商品タイプ
export type ProductType = 'plan' | 'option_single' | 'option_multi'

// UIコンポーネントタイプ
export type FieldType = 'radio' | 'select' | 'checkbox'

// 条件演算子
export type ConditionalOperator = '=' | '!=' | 'IN' | 'NOT_IN' | '>' | '>=' | '<' | '<='

// 条件アイテム（単一条件）
export interface ConditionItem {
  field: string
  operator: ConditionalOperator
  value: string | number | boolean | string[] | number[]
}

// ネストされたAND条件（OR内で使用）
export interface NestedAndCondition {
  AND: ConditionItem[]
}

// 条件ルール（AND/OR対応）
export interface ConditionalRule {
  AND?: (ConditionItem | NestedAndCondition)[]
  OR?: (ConditionItem | NestedAndCondition)[]
}

// フォーム値の型（フィールド名 → 値のマップ）
export type FormValues = Record<string, string | number | boolean | number[] | null | undefined>

// 商品カテゴリ（v3拡張版）
export interface ProductCategoryV3 {
  id: number
  shop_id: number
  name: string
  display_name: string
  description: string | null
  sort_order: number
  is_active: boolean

  // v3追加フィールド
  form_section: FormSection | null
  product_type: ProductType | null
  conditional_rule: ConditionalRule | null

  created_at: string
  updated_at: string
}

// UIコンポーネントマッピング
export const productTypeToFieldType: Record<ProductType, FieldType> = {
  plan: 'radio',
  option_single: 'select',
  option_multi: 'checkbox'
}
