/**
 * フォームビルダーv3用の型定義
 * TDD方式で実装する新しいフォームビルダー
 */

export interface FormBuilderItem {
  id: number
  name: string
  price: number
  description?: string
}

export interface FormBuilderCategory {
  id: number
  name: string
  displayName: string
  description?: string
  productType: 'plan' | 'option_single' | 'option_multi'
  items: FormBuilderItem[]
}

export interface FormBuilderCondition {
  fieldId: number
  fieldName: string
  value: string
}

export interface FormBuilderStep {
  type: 'trigger' | 'conditional' | 'common_final'
  category: FormBuilderCategory
  condition?: FormBuilderCondition
}

export interface FormBuilderData {
  shopId: number
  shootingCategoryId: number
  shootingCategoryName: string
  steps: FormBuilderStep[]
}

/**
 * データベース保存用の型
 */
export interface ShootingCategoryForm {
  id: number
  shop_id: number
  shooting_category_id: number
  form_data: FormBuilderData
  created_at: string
  updated_at: string
}

export type WizardStep = 'select_shooting' | 'add_trigger' | 'add_conditional' | 'add_common_final' | 'preview'
