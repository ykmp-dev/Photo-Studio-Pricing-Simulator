/**
 * FormBuilderDataをお客様向けフォーム用のデータに変換
 */
import type { FormBuilderData } from '../types/formBuilderV3'
import type { ProductCategoryV3, ConditionalRule } from '../types/formV3'
import type { Item } from '../types/category'

export interface ConvertedFormData {
  categories: ProductCategoryV3[]
  items: Item[]
}

/**
 * FormBuilderDataをProductCategoryV3とItemの配列に変換
 */
export function convertFormBuilderToCustomerForm(
  formData: FormBuilderData
): ConvertedFormData {
  const categories: ProductCategoryV3[] = []
  const items: Item[] = []

  // 第1パス: カテゴリIDごとのアイテム名→IDマップを作成
  const itemNameToIdMap = new Map<number, Map<string, number>>()

  formData.steps.forEach((step) => {
    const categoryItemMap = new Map<string, number>()
    step.category.items.forEach((item) => {
      categoryItemMap.set(item.name, item.id)
    })
    itemNameToIdMap.set(step.category.id, categoryItemMap)
  })

  // 第2パス: カテゴリとアイテムを作成
  formData.steps.forEach((step, stepIndex) => {
    // ProductCategoryV3を作成
    const category: ProductCategoryV3 = {
      id: step.category.id,
      shop_id: formData.shopId,
      name: step.category.name,
      display_name: step.category.displayName,
      description: step.category.description || null,
      sort_order: stepIndex,
      is_active: true,
      form_section: step.type,
      product_type: step.category.productType,
      conditional_rule: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // conditionalステップの場合、条件ルールを設定
    if (step.type === 'conditional' && step.condition) {
      // 条件値（アイテム名）を対応するアイテムIDに変換
      const triggerCategoryItemMap = itemNameToIdMap.get(step.condition.fieldId)
      const itemId = triggerCategoryItemMap?.get(step.condition.value)

      if (itemId !== undefined) {
        category.conditional_rule = {
          AND: [
            {
              field: `category_${step.condition.fieldId}`,
              operator: '=',
              value: itemId, // アイテムIDを使用（数値）
            },
          ],
        } as ConditionalRule
      } else {
        console.warn(
          `条件ルールの変換エラー: カテゴリ ${step.condition.fieldId} にアイテム "${step.condition.value}" が見つかりません`
        )
      }
    }

    categories.push(category)

    // Itemsを作成
    step.category.items.forEach((item, itemIndex) => {
      items.push({
        id: item.id,
        product_category_id: step.category.id,
        shop_id: formData.shopId,
        name: item.name,
        price: item.price,
        description: item.description || null,
        sort_order: itemIndex,
        is_active: true,
        is_required: false,
        auto_select: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    })
  })

  return {
    categories,
    items,
  }
}
