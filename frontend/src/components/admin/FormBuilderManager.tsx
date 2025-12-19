import { useState, useEffect } from 'react'
import { getShootingCategories } from '../../services/categoryService'
import type { ShootingCategory } from '../../types/category'
import type { FormBuilderData } from '../../types/formBuilderV3'
import FormBuilderWizard from './formBuilder/FormBuilderWizard'

interface FormBuilderManagerProps {
  shopId: number
  onHasChanges?: (hasChanges: boolean) => void
}

export default function FormBuilderManager({ shopId, onHasChanges }: FormBuilderManagerProps) {
  // 撮影カテゴリ
  const [shootingCategories, setShootingCategories] = useState<ShootingCategory[]>([])

  // 本番データ（データベースから読み込んだフォーム）
  const [publishedForms, setPublishedForms] = useState<FormBuilderData[]>([])

  // 下書きデータ（編集中のフォーム）
  const [draftForms, setDraftForms] = useState<FormBuilderData[]>([])

  // 変更フラグ
  const [hasChanges, setHasChanges] = useState(false)

  // モーダル状態
  const [showWizard, setShowWizard] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<ShootingCategory | null>(null)

  // 変更通知
  useEffect(() => {
    onHasChanges?.(hasChanges)
  }, [hasChanges, onHasChanges])

  // データ読み込み
  useEffect(() => {
    loadData()
  }, [shopId])

  const loadData = async () => {
    try {
      // 撮影カテゴリを読み込み
      const categories = await getShootingCategories(shopId)
      setShootingCategories(categories)

      // TODO: フォームデータの読み込み（APIエンドポイント実装後）
      // const forms = await getFormBuilderData(shopId)
      // setPublishedForms(forms)
      // setDraftForms(forms)
    } catch (err) {
      console.error('データの読み込みに失敗しました:', err)
    }
  }

  const handleOpenWizard = (category: ShootingCategory) => {
    setSelectedCategory(category)
    setShowWizard(true)
  }

  const handleCloseWizard = () => {
    setShowWizard(false)
    setSelectedCategory(null)
  }

  const handleSaveForm = (formData: FormBuilderData) => {
    // 下書きに保存
    const existingIndex = draftForms.findIndex(
      (f) => f.shootingCategoryId === formData.shootingCategoryId
    )

    if (existingIndex >= 0) {
      // 既存フォームを更新
      const updatedDrafts = [...draftForms]
      updatedDrafts[existingIndex] = formData
      setDraftForms(updatedDrafts)
    } else {
      // 新規フォームを追加
      setDraftForms([...draftForms, formData])
    }

    setHasChanges(true)
    handleCloseWizard()
  }

  // 下書きを本番に反映（データベースに保存）
  const handlePublish = async () => {
    if (!confirm('変更を保存しますか？')) return

    try {
      // TODO: データベースへの保存処理
      // for (const draft of draftForms) {
      //   await saveFormBuilderData(draft)
      // }

      // 仮実装: 下書きを本番にコピー
      setPublishedForms([...draftForms])
      setHasChanges(false)
      alert('変更を保存しました')
    } catch (err) {
      console.error('保存に失敗しました:', err)
      alert('保存に失敗しました')
    }
  }

  // 下書きを破棄して本番データに戻す
  const handleDiscard = () => {
    if (!confirm('編集中の変更を破棄しますか？')) return
    setDraftForms([...publishedForms])
    setHasChanges(false)
  }

  // 撮影カテゴリごとのフォーム状態を取得
  const getFormStatus = (categoryId: number) => {
    const draftForm = draftForms.find((f) => f.shootingCategoryId === categoryId)
    const publishedForm = publishedForms.find((f) => f.shootingCategoryId === categoryId)

    if (!draftForm && !publishedForm) {
      return { status: 'none', badge: null }
    }

    if (draftForm && !publishedForm) {
      return { status: 'draft', badge: '下書き' }
    }

    if (draftForm && publishedForm && JSON.stringify(draftForm) !== JSON.stringify(publishedForm)) {
      return { status: 'modified', badge: '編集中' }
    }

    return { status: 'published', badge: '公開中' }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📋 フォームビルダー</h2>
          <p className="text-sm text-gray-600 mt-1">
            お客様向けの見積もりフォームを撮影メニューごとに作成できます
          </p>
        </div>

        {/* 更新・破棄ボタン */}
        {hasChanges && (
          <div className="flex gap-3">
            <button
              onClick={handleDiscard}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              変更を破棄
            </button>
            <button
              onClick={handlePublish}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
            >
              更新（本番に反映）
            </button>
          </div>
        )}
      </div>

      {/* 変更通知バナー */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800">
            ⚠️ 未保存の変更があります。「更新」ボタンを押すまで変更は保存されません。
          </p>
        </div>
      )}

      {/* 撮影カテゴリタイル */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          撮影メニューを選んでフォームを作成
        </h3>

        {shootingCategories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">撮影カテゴリが登録されていません。</p>
            <p className="text-xs mt-1">先にカテゴリ管理タブで撮影カテゴリを作成してください。</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {shootingCategories.map((category) => {
              const formStatus = getFormStatus(category.id)
              return (
                <button
                  key={category.id}
                  onClick={() => handleOpenWizard(category)}
                  className="relative p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center group"
                >
                  {/* ステータスバッジ */}
                  {formStatus.badge && (
                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          formStatus.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : formStatus.status === 'modified'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {formStatus.badge}
                      </span>
                    </div>
                  )}

                  <div className="text-4xl mb-3">📸</div>
                  <div className="font-semibold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
                    {category.display_name}
                  </div>
                  {category.description && (
                    <div className="text-xs text-gray-500 mt-2">{category.description}</div>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* モーダル: FormBuilderWizard */}
      {showWizard && selectedCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <FormBuilderWizard
              shopId={shopId}
              shootingCategories={shootingCategories}
              selectedCategory={selectedCategory}
              initialFormData={draftForms.find(
                (f) => f.shootingCategoryId === selectedCategory.id
              )}
              onSave={handleSaveForm}
              onCancel={handleCloseWizard}
            />
          </div>
        </div>
      )}
    </div>
  )
}
