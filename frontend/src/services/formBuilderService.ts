import { supabase } from '../lib/supabase'
import type {
  FormSchema,
  FormField,
  FieldOption,
  ConditionalRule,
  CreateFormSchema,
  UpdateFormSchema,
  CreateFormField,
  UpdateFormField,
  CreateFieldOption,
  UpdateFieldOption,
  CreateConditionalRule,
  UpdateConditionalRule,
  FormWithFields,
  FormFieldWithOptions,
  FormBlock,
  FormSchemaWithBlocks,
  CreateFormBlock,
  UpdateFormBlock,
} from '../types/formBuilder'

// ==================== FormSchema CRUD ====================

export async function getFormSchemas(shopId: number): Promise<FormSchema[]> {
  const { data, error } = await supabase
    .from('form_schemas')
    .select('*')
    .eq('shop_id', shopId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getFormSchema(id: number): Promise<FormSchema | null> {
  const { data, error } = await supabase
    .from('form_schemas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createFormSchema(formSchema: CreateFormSchema): Promise<FormSchema> {
  const { data, error } = await supabase
    .from('form_schemas')
    .insert(formSchema)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFormSchema(id: number, formSchema: UpdateFormSchema): Promise<FormSchema> {
  const { data, error } = await supabase
    .from('form_schemas')
    .update({ ...formSchema, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFormSchema(id: number): Promise<void> {
  const { error } = await supabase
    .from('form_schemas')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== FormField CRUD ====================

export async function getFormFields(formSchemaId: number): Promise<FormField[]> {
  const { data, error } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_schema_id', formSchemaId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getFormField(id: number): Promise<FormField | null> {
  const { data, error } = await supabase
    .from('form_fields')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createFormField(field: CreateFormField): Promise<FormField> {
  const { data, error } = await supabase
    .from('form_fields')
    .insert(field)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFormField(id: number, field: UpdateFormField): Promise<FormField> {
  const { data, error } = await supabase
    .from('form_fields')
    .update({ ...field, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFormField(id: number): Promise<void> {
  const { error } = await supabase
    .from('form_fields')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== FieldOption CRUD ====================

export async function getFieldOptions(fieldId: number): Promise<FieldOption[]> {
  const { data, error } = await supabase
    .from('field_options')
    .select('*')
    .eq('field_id', fieldId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function createFieldOption(option: CreateFieldOption): Promise<FieldOption> {
  const { data, error } = await supabase
    .from('field_options')
    .insert(option)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFieldOption(id: number, option: UpdateFieldOption): Promise<FieldOption> {
  const { data, error } = await supabase
    .from('field_options')
    .update(option)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFieldOption(id: number): Promise<void> {
  const { error } = await supabase
    .from('field_options')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== ConditionalRule CRUD ====================

export async function getConditionalRules(targetFieldId: number): Promise<ConditionalRule[]> {
  const { data, error } = await supabase
    .from('conditional_rules')
    .select('*')
    .eq('target_field_id', targetFieldId)

  if (error) throw error
  return data || []
}

export async function createConditionalRule(rule: CreateConditionalRule): Promise<ConditionalRule> {
  const { data, error } = await supabase
    .from('conditional_rules')
    .insert(rule)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateConditionalRule(id: number, rule: UpdateConditionalRule): Promise<ConditionalRule> {
  const { data, error } = await supabase
    .from('conditional_rules')
    .update(rule)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteConditionalRule(id: number): Promise<void> {
  const { error } = await supabase
    .from('conditional_rules')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== 複合クエリ ====================

/**
 * フォームスキーマとそのフィールド、オプション、条件ルールを一括取得
 */
export async function getFormWithFields(formSchemaId: number): Promise<FormWithFields | null> {
  // フォームスキーマ取得
  const formSchema = await getFormSchema(formSchemaId)
  if (!formSchema) return null

  // フィールド取得
  const fields = await getFormFields(formSchemaId)

  // 各フィールドのオプションと条件ルールを取得
  const fieldsWithOptions: FormFieldWithOptions[] = await Promise.all(
    fields.map(async (field) => {
      const [options, conditional_rules] = await Promise.all([
        getFieldOptions(field.id),
        getConditionalRules(field.id),
      ])

      return {
        ...field,
        options,
        conditional_rules,
      }
    })
  )

  return {
    ...formSchema,
    fields: fieldsWithOptions,
  }
}

/**
 * フィールドの並び順を一括更新
 */
export async function updateFieldsOrder(fieldIds: number[]): Promise<void> {
  const updates = fieldIds.map((id, index) =>
    updateFormField(id, { sort_order: index })
  )

  await Promise.all(updates)
}

/**
 * オプションの並び順を一括更新
 */
export async function updateOptionsOrder(optionIds: number[]): Promise<void> {
  const updates = optionIds.map((id, index) =>
    updateFieldOption(id, { sort_order: index })
  )

  await Promise.all(updates)
}

/**
 * フォームスキーマを複製（フィールド、オプション、ルール含む）
 */
export async function duplicateFormSchema(sourceId: number, shopId: number): Promise<FormSchema> {
  const sourceForm = await getFormWithFields(sourceId)
  if (!sourceForm) throw new Error('Source form not found')

  // 新しいフォームスキーマ作成
  const newForm = await createFormSchema({
    shop_id: shopId,
    name: `${sourceForm.name} (コピー)`,
    category: sourceForm.category || undefined,
    description: sourceForm.description || undefined,
    is_active: false, // コピーはデフォルトで非アクティブ
    sort_order: sourceForm.sort_order,
  })

  // フィールドとオプションを複製
  for (const field of sourceForm.fields) {
    const newField = await createFormField({
      form_schema_id: newForm.id,
      field_type: field.field_type,
      label: field.label,
      name: field.name,
      required: field.required,
      price_value: field.price_value,
      sort_order: field.sort_order,
      metadata: field.metadata,
    })

    // オプション複製
    for (const option of field.options) {
      await createFieldOption({
        field_id: newField.id,
        label: option.label,
        value: option.value,
        price_value: option.price_value,
        sort_order: option.sort_order,
        metadata: option.metadata,
      })
    }

    // 条件ルールは後で対応（フィールドIDのマッピングが必要）
  }

  return newForm
}

// ==================== FormBlock CRUD ====================

export async function getFormBlocks(formSchemaId: number): Promise<FormBlock[]> {
  const { data, error } = await supabase
    .from('form_blocks')
    .select('*')
    .eq('form_schema_id', formSchemaId)
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data || []
}

export async function getFormBlock(id: number): Promise<FormBlock | null> {
  const { data, error } = await supabase
    .from('form_blocks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createFormBlock(block: CreateFormBlock): Promise<FormBlock> {
  const { data, error } = await supabase
    .from('form_blocks')
    .insert(block)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFormBlock(id: number, block: UpdateFormBlock): Promise<FormBlock> {
  const { data, error } = await supabase
    .from('form_blocks')
    .update({ ...block, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteFormBlock(id: number): Promise<void> {
  const { error } = await supabase
    .from('form_blocks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * フォームブロックの並び順を一括更新
 */
export async function updateBlocksOrder(blockIds: number[]): Promise<void> {
  const updates = blockIds.map((id, index) =>
    updateFormBlock(id, { sort_order: index })
  )

  await Promise.all(updates)
}

/**
 * フォームスキーマとそのブロックを一括取得
 */
export async function getFormWithBlocks(formSchemaId: number): Promise<FormSchemaWithBlocks | null> {
  const formSchema = await getFormSchema(formSchemaId)
  if (!formSchema) return null

  const blocks = await getFormBlocks(formSchemaId)

  return {
    ...formSchema,
    blocks,
  }
}

/**
 * 撮影カテゴリIDからフォームとブロックを取得
 */
export async function getFormByShootingCategory(
  shopId: number,
  shootingCategoryId: number
): Promise<FormSchemaWithBlocks | null> {
  const { data: formSchema, error } = await supabase
    .from('form_schemas')
    .select('*')
    .eq('shop_id', shopId)
    .eq('shooting_category_id', shootingCategoryId)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    throw error
  }

  if (!formSchema) return null

  const blocks = await getFormBlocks(formSchema.id)

  return {
    ...formSchema,
    blocks,
  }
}
