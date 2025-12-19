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
  shootingCategoryId: number
  shootingCategoryName: string
  steps: FormBuilderStep[]
}

export type WizardStep = 'select_shooting' | 'add_trigger' | 'add_conditional' | 'add_common_final' | 'preview'
