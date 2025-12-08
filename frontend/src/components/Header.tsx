import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* ロゴ */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 font-yugothic">
              そごう写真館 <span className="text-sm md:text-base font-normal text-gray-600">渡邉写真社</span>
            </h1>
          </Link>

          {/* ナビゲーション */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="nav-link">
              5つのお決め撮影
            </Link>
            <Link to="/" className="nav-link">
              撮影メニュー
            </Link>
            <Link to="/" className="nav-link">
              フォトギャラリー
            </Link>
            <Link to="/" className="nav-link">
              スタッフブログ
            </Link>
            <Link to="/login" className="nav-link flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              ログイン
            </Link>
            <Link to="/" className="nav-link flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              アクセス
            </Link>
          </nav>

          {/* モバイルメニューボタン */}
          <button className="md:hidden p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}
