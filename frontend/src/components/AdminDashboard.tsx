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
    <div className="min-h-screen bg-background-200 bg-grid-pattern bg-grid">
      {/* Header */}
      <header className="bg-brand-600 shadow-brand-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* Admin Icon */}
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm shadow-soft">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white font-mincho tracking-widest">
                  管理画面
                </h1>
                <p className="text-sm text-brand-100 mt-0.5 font-gothic">横浜そごう写真館</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <svg className="w-5 h-5 text-brand-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-sm text-white font-medium font-gothic">{user?.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="bg-white text-brand-600 px-6 py-2.5 rounded-lg font-bold hover:bg-brand-50 transition-all duration-300 shadow-soft hover:shadow-medium transform hover:scale-105 font-gothic"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b-2 border-brand-100 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1">
            <button
              onClick={() => handleTabChange('categories')}
              className={`relative py-4 px-6 font-bold transition-all duration-300 font-gothic ${
                activeTab === 'categories'
                  ? 'text-brand-700'
                  : 'text-neutral-500 hover:text-brand-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                カテゴリ・アイテム
                {hasChanges.categories && (
                  <span className="ml-1 flex items-center justify-center w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
                )}
              </span>
              {activeTab === 'categories' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => handleTabChange('campaigns')}
              className={`relative py-4 px-6 font-bold transition-all duration-300 font-gothic ${
                activeTab === 'campaigns'
                  ? 'text-brand-700'
                  : 'text-neutral-500 hover:text-brand-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                キャンペーン
                {hasChanges.campaigns && (
                  <span className="ml-1 flex items-center justify-center w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
                )}
              </span>
              {activeTab === 'campaigns' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => handleTabChange('forms')}
              className={`relative py-4 px-6 font-bold transition-all duration-300 font-gothic ${
                activeTab === 'forms'
                  ? 'text-brand-700'
                  : 'text-neutral-500 hover:text-brand-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                フォームビルダー
                {hasChanges.forms && (
                  <span className="ml-1 flex items-center justify-center w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
                )}
              </span>
              {activeTab === 'forms' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => handleTabChange('csv')}
              className={`relative py-4 px-6 font-bold transition-all duration-300 font-gothic ${
                activeTab === 'csv'
                  ? 'text-brand-700'
                  : 'text-neutral-500 hover:text-brand-600'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV管理
                {hasChanges.csv && (
                  <span className="ml-1 flex items-center justify-center w-2 h-2 rounded-full bg-secondary-500 animate-pulse" />
                )}
              </span>
              {activeTab === 'csv' && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-500 rounded-t-full" />
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-fade-in">
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
        </div>
      </main>
    </div>
  )
}
