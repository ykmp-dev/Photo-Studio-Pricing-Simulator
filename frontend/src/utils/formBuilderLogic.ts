/**
 * フォームビルダーロジック実装
 * TDD方式で実装された純粋関数群
 */
import type {
  FormBuilderData,
  FormBuilderCategory,
  FormBuilderCondition
} from '../types/formBuilderV3'
import type { ProductCategory, Item } from '../types/category'
import type { ConditionalRule } from '../types/formV3'

export function initFormBuilder(
  shootingCategoryId: number,
  shootingCategoryName: string
): FormBuilderData {
  return {
    shootingCategoryId,
    shootingCategoryName,
    steps: []
  }
}

export function addTriggerStep(
  formData: FormBuilderData,
  category: FormBuilderCategory
): FormBuilderData {
  return {
    ...formData,
    steps: [
      ...formData.steps,
      {
        type: 'trigger',
        category
      }
    ]
  }
}

export function addConditionalStep(
  formData: FormBuilderData,
  category: FormBuilderCategory,
  condition: FormBuilderCondition
): FormBuilderData {
  // triggerステップが存在するかチェック
  const hasTrigger = formData.steps.some(s => s.type === 'trigger')
  if (!hasTrigger) {
    throw new Error('分岐設定を追加するには、最初に選ぶ項目が必要です')
  }

  return {
    ...formData,
    steps: [
      ...formData.steps,
      {
        type: 'conditional',
        category,
        condition
      }
    ]
  }
}

export function addCommonFinalStep(
  formData: FormBuilderData,
  category: FormBuilderCategory
): FormBuilderData {
  return {
    ...formData,
    steps: [
      ...formData.steps,
      {
        type: 'common_final',
        category
      }
    ]
  }
}

export function removeStep(
  formData: FormBuilderData,
  index: number
): FormBuilderData {
  return {
    ...formData,
    steps: formData.steps.filter((_, i) => i !== index)
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateFormBuilder(formData: FormBuilderData): ValidationResult {
  const errors: string[] = []

  // triggerステップが存在するかチェック
  const hasTrigger = formData.steps.some(s => s.type === 'trigger')
  if (!hasTrigger) {
    errors.push('最初に選ぶ項目を追加してください')
  }

  // 各カテゴリにアイテムが存在するかチェック
  formData.steps.forEach((step, index) => {
    if (step.category.items.length === 0) {
      errors.push(`ステップ${index + 1}（${step.category.displayName}）に選択肢を追加してください`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}

export interface ConvertResult {
  categories: Partial<ProductCategory>[]
  items: Partial<Item>[]
}

export function convertToProductCategories(formData: FormBuilderData): ConvertResult {
  const categories: Partial<ProductCategory>[] = []
  const items: Partial<Item>[] = []

  formData.steps.forEach((step, stepIndex) => {
    // ProductCategoryを作成
    const category: Partial<ProductCategory> = {
      id: step.category.id,
      name: step.category.name,
      display_name: step.category.displayName,
      description: step.category.description || null,
      form_section: step.type,
      product_type: step.category.productType,
      sort_order: stepIndex,
      is_active: true
    }

    // conditional_ruleを設定
    if (step.type === 'conditional' && step.condition) {
      category.conditional_rule = {
        AND: [{
          field: `category_${step.condition.fieldId}`,
          operator: '=',
          value: step.condition.value
        }]
      } as ConditionalRule
    }

    categories.push(category)

    // Itemsを作成
    step.category.items.forEach((item, itemIndex) => {
      items.push({
        id: item.id,
        product_category_id: step.category.id,
        name: item.name,
        price: item.price,
        description: item.description || null,
        sort_order: itemIndex,
        is_active: true,
        is_required: false,
        auto_select: false
      })
    })
  })

  return {
    categories,
    items
  }
}
