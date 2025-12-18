import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getFormSchemas,
  createFormSchema,
  updateFormSchema,
  deleteFormSchema,
} from '../services/formBuilderService'
import { getShootingCategories } from '../services/categoryService'
import type { FormSchema } from '../types/formBuilder'
import type { ShootingCategory } from '../types/category'
import { getErrorMessage, getSuccessMessage } from '../utils/errorMessages'

interface FormListPageProps {
  shopId: number
}

export default function FormListPage({ shopId }: FormListPageProps) {
  const navigate = useNavigate()
  const [forms, setForms] = useState<FormSchema[]>([])
  const [shootingCategories, setShootingCategories] = useState<ShootingCategory[]>([])
  const [loading, setLoading] = useState(true)

  // フォーム作成・編集用の状態
  const [editingFormId, setEditingFormId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formShootingCategoryId, setFormShootingCategoryId] = useState<number | null>(null)
  const [formIsActive, setFormIsActive] = useState(true)

  useEffect(() => {
    loadData()
  }, [shopId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [formsData, categoriesData] = await Promise.all([
        getFormSchemas(shopId),
        getShootingCategories(shopId),
      ])
      setForms(formsData)
      setShootingCategories(categoriesData)
    } catch (err) {
      console.error('データの読み込みに失敗しました:', err)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createFormSchema({
        shop_id: shopId,
        name: formName,
        description: formDescription || undefined,
        shooting_category_id: formShootingCategoryId || undefined,
        is_active: formIsActive,
        status: 'draft',
      })
      resetFormForm()
      await loadData()
      alert(getSuccessMessage('create', 'フォーム'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleUpdateForm = async (id: number) => {
    try {
      await updateFormSchema(id, {
        name: formName,
        description: formDescription || undefined,
        shooting_category_id: formShootingCategoryId || undefined,
        is_active: formIsActive,
      })
      resetFormForm()
      await loadData()
      alert(getSuccessMessage('update', 'フォーム'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleDeleteForm = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    try {
      await deleteFormSchema(id)
      await loadData()
      alert(getSuccessMessage('delete', 'フォーム'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const resetFormForm = () => {
    setFormName('')
    setFormDescription('')
    setFormShootingCategoryId(null)
    setFormIsActive(true)
    setEditingFormId(null)
  }

  const startEditForm = (form: FormSchema) => {
    setFormName(form.name)
    setFormDescription(form.description || '')
    setFormShootingCategoryId(form.shooting_category_id)
    setFormIsActive(form.is_active)
    setEditingFormId(form.id)
  }

  if (loading) {
    return <div className="text-gray-500">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">フォームビルダー</h2>
        <p className="text-sm text-gray-600 mt-1">撮影カテゴリごとのフォームを作成・管理</p>
      </div>

      {/* フォーム作成フォーム */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">新しいフォームを作成</h3>
        <form onSubmit={handleCreateForm} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フォーム名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="七五三撮影フォーム"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">撮影カテゴリ</label>
              <select
                value={formShootingCategoryId || ''}
                onChange={(e) => setFormShootingCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">選択してください</option>
                {shootingCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              rows={2}
              placeholder="フォームの用途や概要を記載"
            />
          </div>

          <div className="flex gap-2">
            {editingFormId ? (
              <>
                <button
                  type="button"
                  onClick={() => handleUpdateForm(editingFormId)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                >
                  更新
                </button>
                <button
                  type="button"
                  onClick={resetFormForm}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded"
                >
                  キャンセル
                </button>
              </>
            ) : (
              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium"
              >
                作成
              </button>
            )}
          </div>
        </form>
      </div>

      {/* フォーム一覧 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">フォーム一覧</h3>

        {forms.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            まだフォームがありません。上のフォームから新しいフォームを作成してください。
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form) => {
              const category = shootingCategories.find((c) => c.id === form.shooting_category_id)
              return (
                <div
                  key={form.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/admin/forms/${form.id}/edit`)}
                >
                  <div className="mb-3">
                    <h4 className="font-semibold text-gray-800 text-lg mb-1">{form.name}</h4>
                    {category && (
                      <p className="text-xs text-blue-600">📋 {category.display_name}</p>
                    )}
                    {form.description && (
                      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{form.description}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100">
                    <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                      form.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {form.is_active ? '✅ 公開中' : '⚪ 非公開'}
                    </span>

                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={async () => {
                          const newStatus = !form.is_active
                          const action = newStatus ? '公開' : '非公開'
                          if (!confirm(`「${form.name}」を${action}にしますか？`)) return
                          try {
                            await updateFormSchema(form.id, { is_active: newStatus })
                            await loadData()
                            alert(`フォームを${action}にしました`)
                          } catch (err) {
                            console.error(err)
                            alert(`${action}に失敗しました: ` + getErrorMessage(err))
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded ${
                          form.is_active
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={form.is_active ? '非公開にする' : '公開する'}
                      >
                        {form.is_active ? '🔒' : '🚀'}
                      </button>
                      <button
                        onClick={() => startEditForm(form)}
                        className="text-blue-600 hover:text-blue-700 text-xs px-2 py-1 hover:bg-blue-50 rounded"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteForm(form.id, form.name)}
                        className="text-red-600 hover:text-red-700 text-xs px-2 py-1 hover:bg-red-50 rounded"
                      >
                        削除
                      </button>
                    </div>
                  </div>

                  {(form.published_at || form.updated_at) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                      {form.published_at && (
                        <div>最終反映: {new Date(form.published_at).toLocaleString('ja-JP')}</div>
                      )}
                      {form.updated_at && (
                        <div>最終保存: {new Date(form.updated_at).toLocaleString('ja-JP')}</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
