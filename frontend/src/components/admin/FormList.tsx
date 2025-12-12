import { useState, useEffect } from 'react'
import { getFormSchemas, deleteFormSchema, updateFormSchema, duplicateFormSchema } from '../../services/formBuilderService'
import type { FormSchema } from '../../types/formBuilder'

interface FormListProps {
  shopId: number
  onEditForm: (formId: number) => void
  onCreateNew: () => void
}

export default function FormList({ shopId, onEditForm, onCreateNew }: FormListProps) {
  const [forms, setForms] = useState<FormSchema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadForms()
  }, [shopId])

  const loadForms = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getFormSchemas(shopId)
      setForms(data)
    } catch (err) {
      setError('フォームの読み込みに失敗しました')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (form: FormSchema) => {
    try {
      await updateFormSchema(form.id, { is_active: !form.is_active })
      await loadForms()
    } catch (err) {
      alert('ステータスの変更に失敗しました')
      console.error(err)
    }
  }

  const handleDuplicate = async (formId: number) => {
    if (!confirm('このフォームを複製しますか？')) return

    try {
      await duplicateFormSchema(formId, shopId)
      await loadForms()
    } catch (err) {
      alert('フォームの複製に失敗しました')
      console.error(err)
    }
  }

  const handleDelete = async (formId: number, formName: string) => {
    if (!confirm(`「${formName}」を削除しますか？この操作は取り消せません。`)) return

    try {
      await deleteFormSchema(formId)
      await loadForms()
    } catch (err) {
      alert('フォームの削除に失敗しました')
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">フォーム一覧</h2>
        <button
          onClick={onCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          + 新規フォーム作成
        </button>
      </div>

      {/* フォームリスト */}
      {forms.length === 0 ? (
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">フォームがまだありません</p>
          <button
            onClick={onCreateNew}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            最初のフォームを作成
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {form.name}
                    </h3>
                    {form.is_active ? (
                      <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                        公開中
                      </span>
                    ) : (
                      <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                        非公開
                      </span>
                    )}
                  </div>

                  {form.category && (
                    <p className="text-sm text-gray-600 mb-1">
                      カテゴリ: {form.category}
                    </p>
                  )}

                  {form.description && (
                    <p className="text-sm text-gray-600 mb-3">
                      {form.description}
                    </p>
                  )}

                  <p className="text-xs text-gray-400">
                    作成日: {new Date(form.created_at).toLocaleDateString('ja-JP')} |
                    更新日: {new Date(form.updated_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>

                {/* アクション */}
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => onEditForm(form.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    編集
                  </button>

                  <button
                    onClick={() => handleToggleActive(form)}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      form.is_active
                        ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    {form.is_active ? '非公開にする' : '公開する'}
                  </button>

                  <button
                    onClick={() => handleDuplicate(form.id)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    複製
                  </button>

                  <button
                    onClick={() => handleDelete(form.id, form.name)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
