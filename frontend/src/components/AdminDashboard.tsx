import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import PlanManager from './admin/PlanManager'
import OptionManager from './admin/OptionManager'
import CampaignManager from './admin/CampaignManager'
import FormList from './admin/FormList'
import FormBuilder from './admin/FormBuilder'

type Tab = 'plans' | 'options' | 'campaigns' | 'forms'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('plans')
  const [formBuilderView, setFormBuilderView] = useState<'list' | 'edit' | 'create'>('list')
  const [editingFormId, setEditingFormId] = useState<number | undefined>()
  const shopId = 1 // TODO: Get from user profile or context

  const handleSignOut = async () => {
    await signOut()
  }

  const handleCreateNewForm = () => {
    setEditingFormId(undefined)
    setFormBuilderView('create')
  }

  const handleEditForm = (formId: number) => {
    setEditingFormId(formId)
    setFormBuilderView('edit')
  }

  const handleBackToFormList = () => {
    setFormBuilderView('list')
    setEditingFormId(undefined)
  }

  return (
    <div className="min-h-screen bg-ivory-500">
      {/* Header */}
      <header className="bg-blue-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white font-yugothic" style={{ letterSpacing: '0.1em' }}>
              管理画面
            </h1>
            <div className="flex items-center gap-6">
              <span className="text-sm text-ivory-200 font-semibold">{user?.email}</span>
              <button onClick={handleSignOut} className="bg-white text-blue-600 px-6 py-2 rounded-md-japanese font-semibold hover:bg-ivory-100 transition-colors">
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b-2 border-blue-200 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('plans')}
              className={`py-4 px-2 border-b-4 font-semibold transition-all ${
                activeTab === 'plans'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
              style={{ letterSpacing: '0.05em' }}
            >
              プラン管理
            </button>
            <button
              onClick={() => setActiveTab('options')}
              className={`py-4 px-2 border-b-4 font-semibold transition-all ${
                activeTab === 'options'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
              style={{ letterSpacing: '0.05em' }}
            >
              オプション管理
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`py-4 px-2 border-b-4 font-semibold transition-all ${
                activeTab === 'campaigns'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
              style={{ letterSpacing: '0.05em' }}
            >
              キャンペーン管理
            </button>
            <button
              onClick={() => {
                setActiveTab('forms')
                setFormBuilderView('list')
              }}
              className={`py-4 px-2 border-b-4 font-semibold transition-all ${
                activeTab === 'forms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
              style={{ letterSpacing: '0.05em' }}
            >
              フォームビルダー
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'plans' && <PlanManager shopId={shopId} />}
        {activeTab === 'options' && <OptionManager shopId={shopId} />}
        {activeTab === 'campaigns' && <CampaignManager shopId={shopId} />}
        {activeTab === 'forms' && (
          <>
            {formBuilderView === 'list' && (
              <FormList
                shopId={shopId}
                onEditForm={handleEditForm}
                onCreateNew={handleCreateNewForm}
              />
            )}
            {(formBuilderView === 'edit' || formBuilderView === 'create') && (
              <FormBuilder
                shopId={shopId}
                formId={editingFormId}
                onBack={handleBackToFormList}
              />
            )}
          </>
        )}
      </main>
    </div>
  )
}
