// フォームビルダー関連の型定義

export interface FormSchema {
  id: number
  shop_id: number
  name: string
  category: string | null
  description: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type FieldType = 'select' | 'checkbox' | 'radio' | 'text' | 'number'

export interface FormField {
  id: number
  form_schema_id: number
  field_type: FieldType
  label: string
  name: string
  required: boolean
  price_value: number
  sort_order: number
  metadata: FieldMetadata
  created_at: string
  updated_at: string
}

export interface FieldMetadata {
  dataVal?: string
  dataAge?: string
  familyFlg?: boolean
  [key: string]: any // その他のメタデータ
}

export interface FieldOption {
  id: number
  field_id: number
  label: string
  value: string
  price_value: number
  sort_order: number
  metadata: FieldMetadata
  created_at: string
}

export type ConditionType = 'show_if' | 'hide_if' | 'enable_if' | 'disable_if'
export type Operator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'

export interface ConditionalRule {
  id: number
  target_field_id: number
  condition_type: ConditionType
  source_field_id: number
  operator: Operator
  compare_value: string | null
  created_at: string
}

// フォーム作成・更新用の型
export interface CreateFormSchema {
  shop_id: number
  name: string
  category?: string
  description?: string
  is_active?: boolean
  sort_order?: number
}

export interface UpdateFormSchema {
  name?: string
  category?: string
  description?: string
  is_active?: boolean
  sort_order?: number
}

export interface CreateFormField {
  form_schema_id: number
  field_type: FieldType
  label: string
  name: string
  required?: boolean
  price_value?: number
  sort_order?: number
  metadata?: FieldMetadata
}

export interface UpdateFormField {
  field_type?: FieldType
  label?: string
  name?: string
  required?: boolean
  price_value?: number
  sort_order?: number
  metadata?: FieldMetadata
}

export interface CreateFieldOption {
  field_id: number
  label: string
  value: string
  price_value?: number
  sort_order?: number
  metadata?: FieldMetadata
}

export interface UpdateFieldOption {
  label?: string
  value?: string
  price_value?: number
  sort_order?: number
  metadata?: FieldMetadata
}

export interface CreateConditionalRule {
  target_field_id: number
  condition_type: ConditionType
  source_field_id: number
  operator: Operator
  compare_value?: string
}

export interface UpdateConditionalRule {
  condition_type?: ConditionType
  source_field_id?: number
  operator?: Operator
  compare_value?: string
}

// フォーム全体データ（フィールドとオプションを含む）
export interface FormWithFields extends FormSchema {
  fields: FormFieldWithOptions[]
}

export interface FormFieldWithOptions extends FormField {
  options: FieldOption[]
  conditional_rules: ConditionalRule[]
}
