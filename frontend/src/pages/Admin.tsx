import { useState } from 'react'
import FormList from '../components/admin/FormList'
import FormBuilder from '../components/admin/FormBuilder'

export default function Admin() {
  const [currentView, setCurrentView] = useState<'list' | 'edit' | 'create'>('list')
  const [editingFormId, setEditingFormId] = useState<number | undefined>()

  // TODO: 実際のshopIdはログイン情報から取得する
  const shopId = 1

  const handleCreateNew = () => {
    setEditingFormId(undefined)
    setCurrentView('create')
  }

  const handleEditForm = (formId: number) => {
    setEditingFormId(formId)
    setCurrentView('edit')
  }

  const handleBack = () => {
    setCurrentView('list')
    setEditingFormId(undefined)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            フォームビルダー管理画面
          </h1>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'list' && (
          <FormList
            shopId={shopId}
            onEditForm={handleEditForm}
            onCreateNew={handleCreateNew}
          />
        )}

        {(currentView === 'edit' || currentView === 'create') && (
          <FormBuilder
            shopId={shopId}
            formId={editingFormId}
            onBack={handleBack}
          />
        )}
      </main>
    </div>
  )
}
