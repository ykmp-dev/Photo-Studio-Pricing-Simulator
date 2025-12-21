// カテゴリとアイテムの型定義

// 撮影カテゴリ（親カテゴリ）
export interface ShootingCategory {
  id: number
  shop_id: number
  name: string
  display_name: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 商品カテゴリ（子カテゴリ）
export interface ProductCategory {
  id: number
  shop_id: number
  name: string
  display_name: string
  description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string

  // v3フィールド（オプショナル）
  form_section?: 'trigger' | 'conditional' | 'common_final' | null
  product_type?: 'plan' | 'option_single' | 'option_multi' | null
  conditional_rule?: any | null
}

// 撮影カテゴリと商品カテゴリの関連（shooting_product_associations テーブル）
export interface ShootingProductAssociation {
  id: number
  shooting_category_id: number
  product_category_id: number
  sort_order: number
  is_required: boolean
  created_at: string
  updated_at: string
}

// アイテム（実際の商品）
export interface Item {
  id: number
  shop_id: number
  product_category_id: number
  name: string
  price: number // 税込価格（円）
  description: string | null
  sort_order: number
  is_active: boolean
  is_required: boolean // 必須アイテム（選択解除不可）
  auto_select: boolean // 商品カテゴリ選択時に自動選択
  created_at: string
  updated_at: string
}

// 作成用の型
export interface CreateShootingCategory {
  shop_id: number
  name: string
  display_name: string
  description?: string
  image_url?: string
  sort_order?: number
  is_active?: boolean
}

export interface CreateProductCategory {
  shop_id: number
  name: string
  display_name: string
  description?: string
  sort_order?: number
  is_active?: boolean

  // v3フィールド
  form_section?: 'trigger' | 'conditional' | 'common_final' | null
  product_type?: 'plan' | 'option_single' | 'option_multi' | null
  conditional_rule?: any | null
}

export interface CreateItem {
  shop_id: number
  product_category_id: number
  name: string
  price: number
  description?: string
  sort_order?: number
  is_active?: boolean
  is_required?: boolean
  auto_select?: boolean
}

export interface CreateShootingProductAssociation {
  shooting_category_id: number
  product_category_id: number
  sort_order?: number
  is_required?: boolean
}

export interface UpdateShootingProductAssociation {
  sort_order?: number
  is_required?: boolean
}

// 更新用の型
export interface UpdateShootingCategory {
  name?: string
  display_name?: string
  description?: string
  image_url?: string
  sort_order?: number
  is_active?: boolean
}

export interface UpdateProductCategory {
  name?: string
  display_name?: string
  description?: string
  sort_order?: number
  is_active?: boolean

  // v3フィールド
  form_section?: 'trigger' | 'conditional' | 'common_final' | null
  product_type?: 'plan' | 'option_single' | 'option_multi' | null
  conditional_rule?: any | null
}

export interface UpdateItem {
  name?: string
  price?: number
  description?: string
  sort_order?: number
  is_active?: boolean
  is_required?: boolean
  auto_select?: boolean
}

// 商品カテゴリとアイテムを含む拡張型
export interface ProductCategoryWithItems extends ProductCategory {
  items: Item[]
}

// 撮影カテゴリと関連商品カテゴリを含む拡張型
export interface ShootingCategoryWithProducts extends ShootingCategory {
  product_categories: ProductCategoryWithItems[]
}
