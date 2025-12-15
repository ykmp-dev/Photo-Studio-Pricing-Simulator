// フォームビルダー関連の型定義

export interface FormSchema {
  id: number
  shop_id: number
  name: string
  category: string | null
  description: string | null
  is_active: boolean
  sort_order: number
  shooting_category_id?: number | null
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
  shooting_category_id?: number
}

export interface UpdateFormSchema {
  name?: string
  category?: string
  description?: string
  is_active?: boolean
  sort_order?: number
  shooting_category_id?: number
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

// ====================================
// 新しいブロックベースのフォーム型定義
// ====================================

export type BlockType = 'text' | 'heading' | 'list' | 'category_reference' | 'yes_no' | 'choice'

export interface ChoiceOption {
  value: string          // 内部値（条件分岐で使用）
  label: string          // 表示テキスト
  price: number          // この選択肢の追加料金（税込、円単位）
  description?: string   // 補足説明（オプション）
}

export interface ShowCondition {
  type: 'yes_no' | 'choice'
  block_id: number
  value: string  // yes_no: 'yes'|'no', choice: ChoiceOption.value
}

export interface FormBlock {
  id: number
  form_schema_id: number
  block_type: BlockType
  content: string | null
  sort_order: number
  metadata: {
    product_category_id?: number
    display_mode?: 'expanded' | 'collapsed'
    choice_options?: ChoiceOption[]
    choice_display?: 'radio' | 'select' | 'auto'
    auto_sync_category_id?: number  // カテゴリから自動生成
  }
  show_condition: ShowCondition | null
  created_at: string
  updated_at: string
}

export interface FormSchemaWithBlocks extends FormSchema {
  shooting_category_id: number | null
  blocks: FormBlock[]
}
