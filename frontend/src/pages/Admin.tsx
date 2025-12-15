import FormManager from '../components/admin/FormManager'

export default function Admin() {
  // TODO: 実際のshopIdはログイン情報から取得する
  const shopId = 1

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
        <FormManager shopId={shopId} />
      </main>
    </div>
  )
}
