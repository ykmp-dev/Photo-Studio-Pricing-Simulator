import { useState, useEffect } from 'react'
import {
  getFormWithFields,
  createFormSchema,
  updateFormSchema,
  createFormField,
  updateFormField,
  deleteFormField,
  updateFieldsOrder,
} from '../../services/formBuilderService'
import type {
  FormWithFields,
  FormFieldWithOptions,
} from '../../types/formBuilder'
import FieldEditor from './FieldEditor'

interface FormBuilderProps {
  shopId: number
  formId?: number // undefinedなら新規作成
  onBack: () => void
}

export default function FormBuilder({ shopId, formId, onBack }: FormBuilderProps) {
  const [form, setForm] = useState<FormWithFields | null>(null)
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [isActive, setIsActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingFieldId, setEditingFieldId] = useState<number | null>(null)

  useEffect(() => {
    if (formId) {
      loadForm()
    }
  }, [formId])

  const loadForm = async () => {
    if (!formId) return

    try {
      setLoading(true)
      const data = await getFormWithFields(formId)
      if (data) {
        setForm(data)
        setFormName(data.name)
        setFormCategory(data.category || '')
        setFormDescription(data.description || '')
        setIsActive(data.is_active)
      }
    } catch (err) {
      alert('フォームの読み込みに失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveFormInfo = async () => {
    try {
      setSaving(true)

      if (formId) {
        // 既存フォーム更新
        const updated = await updateFormSchema(formId, {
          name: formName,
          category: formCategory || undefined,
          description: formDescription || undefined,
          is_active: isActive,
        })
        if (form) {
          setForm({ ...form, ...updated })
        }
      } else {
        // 新規フォーム作成
        const created = await createFormSchema({
          shop_id: shopId,
          name: formName,
          category: formCategory || undefined,
          description: formDescription || undefined,
          is_active: isActive,
        })
        setForm({ ...created, fields: [] })
      }

      alert('保存しました')
    } catch (err) {
      alert('保存に失敗しました')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleAddField = async () => {
    if (!form) {
      alert('先にフォーム情報を保存してください')
      return
    }

    try {
      const newField = await createFormField({
        form_schema_id: form.id,
        field_type: 'select',
        label: '新しいフィールド',
        name: `field_${Date.now()}`,
        required: false,
        price_value: 0,
        sort_order: form.fields.length,
        metadata: {},
      })

      setForm({
        ...form,
        fields: [...form.fields, { ...newField, options: [], conditional_rules: [] }],
      })
      setEditingFieldId(newField.id)
    } catch (err) {
      alert('フィールドの追加に失敗しました')
      console.error(err)
    }
  }

  const handleDeleteField = async (fieldId: number) => {
    if (!confirm('このフィールドを削除しますか？')) return

    try {
      await deleteFormField(fieldId)
      if (form) {
        setForm({
          ...form,
          fields: form.fields.filter((f) => f.id !== fieldId),
        })
      }
    } catch (err) {
      alert('フィールドの削除に失敗しました')
      console.error(err)
    }
  }

  const handleFieldUpdate = async (fieldId: number, updates: Partial<FormFieldWithOptions>) => {
    try {
      const updatedField = await updateFormField(fieldId, {
        field_type: updates.field_type,
        label: updates.label,
        name: updates.name,
        required: updates.required,
        price_value: updates.price_value,
        metadata: updates.metadata,
      })

      if (form) {
        setForm({
          ...form,
          fields: form.fields.map((f) =>
            f.id === fieldId ? { ...f, ...updatedField } : f
          ),
        })
      }
    } catch (err) {
      alert('フィールドの更新に失敗しました')
      console.error(err)
    }
  }

  const handleMoveField = async (fieldId: number, direction: 'up' | 'down') => {
    if (!form) return

    const currentIndex = form.fields.findIndex((f) => f.id === fieldId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= form.fields.length) return

    // フィールドを並び替え
    const newFields = [...form.fields]
    const [movedField] = newFields.splice(currentIndex, 1)
    newFields.splice(newIndex, 0, movedField)

    // UIを即座に更新
    setForm({ ...form, fields: newFields })

    // バックエンドに保存
    try {
      const fieldIds = newFields.map((f) => f.id)
      await updateFieldsOrder(fieldIds)
    } catch (err) {
      alert('並び順の更新に失敗しました')
      console.error(err)
      // エラー時は元に戻す
      await loadForm()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← 戻る
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            {formId ? 'フォーム編集' : '新規フォーム作成'}
          </h2>
        </div>
      </div>

      {/* フォーム基本情報 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">基本情報</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フォーム名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 七五三撮影プラン"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ
            </label>
            <input
              type="text"
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: 七五三, 成人式, お宮参り"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="フォームの説明を入力してください"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              このフォームを公開する
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveFormInfo}
              disabled={saving || !formName}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {saving ? '保存中...' : '基本情報を保存'}
            </button>
          </div>
        </div>
      </div>

      {/* フィールド管理 */}
      {form && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">フィールド設定</h3>
            <button
              onClick={handleAddField}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              + フィールド追加
            </button>
          </div>

          {form.fields.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500 mb-2">フィールドがまだありません</p>
              <button
                onClick={handleAddField}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                最初のフィールドを追加
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {form.fields.map((field, index) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  isEditing={editingFieldId === field.id}
                  onEdit={() => setEditingFieldId(field.id)}
                  onCollapse={() => setEditingFieldId(null)}
                  onUpdate={(updates) => handleFieldUpdate(field.id, updates)}
                  onDelete={() => handleDeleteField(field.id)}
                  onMoveUp={index > 0 ? () => handleMoveField(field.id, 'up') : undefined}
                  onMoveDown={
                    index < form.fields.length - 1
                      ? () => handleMoveField(field.id, 'down')
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
