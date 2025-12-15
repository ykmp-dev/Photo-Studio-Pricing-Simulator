import { supabase } from '../lib/supabase'
import type {
  ShootingCategory,
  ProductCategory,
  Item,
  ShootingProductAssociation,
  CreateShootingCategory,
  CreateProductCategory,
  CreateItem,
  CreateShootingProductAssociation,
  UpdateShootingCategory,
  UpdateProductCategory,
  UpdateItem,
  ProductCategoryWithItems,
  ShootingCategoryWithProducts,
} from '../types/category'

// ==================== 撮影カテゴリ CRUD ====================

export async function getShootingCategories(shopId: number): Promise<ShootingCategory[]> {
  const { data, error } = await supabase
    .from('shooting_categories')
    .select('*')
    .eq('shop_id', shopId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createShootingCategory(category: CreateShootingCategory): Promise<ShootingCategory> {
  const { data, error } = await supabase
    .from('shooting_categories')
    .insert(category)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateShootingCategory(id: number, category: UpdateShootingCategory): Promise<ShootingCategory> {
  const { data, error } = await supabase
    .from('shooting_categories')
    .update(category)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteShootingCategory(id: number): Promise<void> {
  const { error } = await supabase
    .from('shooting_categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== 商品カテゴリ CRUD ====================

export async function getProductCategories(shopId: number): Promise<ProductCategory[]> {
  const { data, error } = await supabase
    .from('product_categories')
    .select('*')
    .eq('shop_id', shopId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createProductCategory(category: CreateProductCategory): Promise<ProductCategory> {
  const { data, error } = await supabase
    .from('product_categories')
    .insert(category)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProductCategory(id: number, category: UpdateProductCategory): Promise<ProductCategory> {
  const { data, error } = await supabase
    .from('product_categories')
    .update(category)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteProductCategory(id: number): Promise<void> {
  const { error } = await supabase
    .from('product_categories')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== アイテム CRUD ====================

export async function getItems(shopId: number, productCategoryId?: number): Promise<Item[]> {
  let query = supabase
    .from('items')
    .select('*')
    .eq('shop_id', shopId)

  if (productCategoryId) {
    query = query.eq('product_category_id', productCategoryId)
  }

  const { data, error } = await query.order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createItem(item: CreateItem): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .insert(item)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateItem(id: number, item: UpdateItem): Promise<Item> {
  const { data, error } = await supabase
    .from('items')
    .update(item)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteItem(id: number): Promise<void> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== 撮影カテゴリと商品カテゴリの関連 ====================

export async function getShootingProductAssociations(shootingCategoryId: number): Promise<ShootingProductAssociation[]> {
  const { data, error } = await supabase
    .from('shooting_product_associations')
    .select('*')
    .eq('shooting_category_id', shootingCategoryId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createShootingProductAssociation(
  association: CreateShootingProductAssociation
): Promise<ShootingProductAssociation> {
  const { data, error } = await supabase
    .from('shooting_product_associations')
    .insert(association)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateShootingProductAssociation(
  id: number,
  association: Partial<CreateShootingProductAssociation>
): Promise<ShootingProductAssociation> {
  const { data, error } = await supabase
    .from('shooting_product_associations')
    .update(association)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteShootingProductAssociation(id: number): Promise<void> {
  const { error } = await supabase
    .from('shooting_product_associations')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function updateAssociationsSortOrder(associationIds: number[]): Promise<void> {
  const updates = associationIds.map((id, index) =>
    updateShootingProductAssociation(id, { sort_order: index })
  )

  await Promise.all(updates)
}

// ==================== 複合クエリ ====================

/**
 * 商品カテゴリとそのアイテムを取得
 */
export async function getProductCategoryWithItems(categoryId: number): Promise<ProductCategoryWithItems | null> {
  const { data: category, error: categoryError } = await supabase
    .from('product_categories')
    .select('*')
    .eq('id', categoryId)
    .single()

  if (categoryError) throw categoryError
  if (!category) return null

  const { data: items, error: itemsError } = await supabase
    .from('items')
    .select('*')
    .eq('product_category_id', categoryId)
    .order('sort_order', { ascending: true })

  if (itemsError) throw itemsError

  return {
    ...category,
    items: items || [],
  }
}

/**
 * 撮影カテゴリと関連する商品カテゴリ・アイテムを取得
 */
export async function getShootingCategoryWithProducts(
  shootingCategoryId: number
): Promise<ShootingCategoryWithProducts | null> {
  // 撮影カテゴリ取得
  const { data: shootingCategory, error: categoryError } = await supabase
    .from('shooting_categories')
    .select('*')
    .eq('id', shootingCategoryId)
    .single()

  if (categoryError) throw categoryError
  if (!shootingCategory) return null

  // 関連する商品カテゴリIDを取得
  const { data: associations, error: assocError } = await supabase
    .from('shooting_product_associations')
    .select('product_category_id')
    .eq('shooting_category_id', shootingCategoryId)

  if (assocError) throw assocError

  const productCategoryIds = associations?.map((a) => a.product_category_id) || []

  if (productCategoryIds.length === 0) {
    return {
      ...shootingCategory,
      product_categories: [],
    }
  }

  // 商品カテゴリとアイテムを取得
  const productCategoriesWithItems = await Promise.all(
    productCategoryIds.map((id) => getProductCategoryWithItems(id))
  )

  return {
    ...shootingCategory,
    product_categories: productCategoriesWithItems.filter((c) => c !== null) as ProductCategoryWithItems[],
  }
}

/**
 * ショップの全カテゴリ構造を取得
 */
export async function getAllCategoryStructure(shopId: number): Promise<ShootingCategoryWithProducts[]> {
  const shootingCategories = await getShootingCategories(shopId)

  const result = await Promise.all(
    shootingCategories.map((category) => getShootingCategoryWithProducts(category.id))
  )

  return result.filter((c) => c !== null) as ShootingCategoryWithProducts[]
}

/**
 * 撮影カテゴリに商品カテゴリを関連付け
 */
export async function linkProductToShooting(
  shootingCategoryId: number,
  productCategoryIds: number[]
): Promise<void> {
  // 既存の関連をすべて削除
  await supabase
    .from('shooting_product_associations')
    .delete()
    .eq('shooting_category_id', shootingCategoryId)

  // 新しい関連を作成
  if (productCategoryIds.length > 0) {
    const associations = productCategoryIds.map((productCategoryId, index) => ({
      shooting_category_id: shootingCategoryId,
      product_category_id: productCategoryId,
      sort_order: index,
    }))

    const { error } = await supabase.from('shooting_product_associations').insert(associations)

    if (error) throw error
  }
}
