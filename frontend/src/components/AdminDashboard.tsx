import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import CampaignManager from './admin/CampaignManagerNew'
import CategoryManager from './admin/CategoryManager'
import FormBuilderManager from './admin/FormBuilderManager'
import CSVManager from './admin/CSVManager'

type Tab = 'categories' | 'campaigns' | 'forms' | 'csv'

export default function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('categories')
  const shopId = 1 // TODO: Get from user profile or context

  // 各タブの変更状態を追跡
  const [hasChanges, setHasChanges] = useState<Record<Tab, boolean>>({
    categories: false,
    campaigns: false,
    forms: false,
    csv: false,
  })

  const handleTabChange = (newTab: Tab) => {
    // 現在のタブに未保存の変更がある場合は警告
    if (hasChanges[activeTab]) {
      if (!confirm('未保存の変更があります。このタブを離れますか？変更は失われます。')) {
        return
      }
    }
    setActiveTab(newTab)
  }

  const handleSignOut = async () => {
    // 未保存の変更がある場合は警告
    if (Object.values(hasChanges).some(Boolean)) {
      if (!confirm('未保存の変更があります。ログアウトしますか？変更は失われます。')) {
        return
      }
    }
    await signOut()
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
              onClick={() => handleTabChange('categories')}
              className={`py-4 px-2 border-b-4 font-semibold transition-all ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
              style={{ letterSpacing: '0.05em' }}
            >
              カテゴリ・アイテム管理
              {hasChanges.categories && <span className="ml-1 text-yellow-500">●</span>}
            </button>
            <button
              onClick={() => handleTabChange('campaigns')}
              className={`py-4 px-2 border-b-4 font-semibold transition-all ${
                activeTab === 'campaigns'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
              style={{ letterSpacing: '0.05em' }}
            >
              キャンペーン管理
              {hasChanges.campaigns && <span className="ml-1 text-yellow-500">●</span>}
            </button>
            <button
              onClick={() => handleTabChange('forms')}
              className={`py-4 px-2 border-b-4 font-semibold transition-all ${
                activeTab === 'forms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
              style={{ letterSpacing: '0.05em' }}
            >
              フォームビルダー
              {hasChanges.forms && <span className="ml-1 text-yellow-500">●</span>}
            </button>
            <button
              onClick={() => handleTabChange('csv')}
              className={`py-4 px-2 border-b-4 font-semibold transition-all ${
                activeTab === 'csv'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
              }`}
              style={{ letterSpacing: '0.05em' }}
            >
              CSV管理
              {hasChanges.csv && <span className="ml-1 text-yellow-500">●</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'categories' && (
          <CategoryManager
            shopId={shopId}
            onHasChanges={(value) => setHasChanges((prev) => ({ ...prev, categories: value }))}
          />
        )}
        {activeTab === 'campaigns' && (
          <CampaignManager
            shopId={shopId}
            onHasChanges={(value) => setHasChanges((prev) => ({ ...prev, campaigns: value }))}
          />
        )}
        {activeTab === 'forms' && (
          <FormBuilderManager
            shopId={shopId}
            onHasChanges={(value) => setHasChanges((prev) => ({ ...prev, forms: value }))}
          />
        )}
        {activeTab === 'csv' && (
          <CSVManager onHasChanges={(value) => setHasChanges((prev) => ({ ...prev, csv: value }))} />
        )}
      </main>
    </div>
  )
}
