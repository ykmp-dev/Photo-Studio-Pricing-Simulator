import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      {/* お問い合わせCTA */}
      <div className="bg-gradient-to-b from-blue-50 to-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="diamond-icon mx-auto mb-6"></div>
          <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-800 mb-8 font-yugothic">
            お問い合わせ
          </h2>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* 電話 */}
            <div className="bg-blue-600 text-white rounded-md-japanese p-6 text-center hover:bg-blue-700 transition-colors">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span className="text-sm">お電話でのお問い合わせ</span>
              </div>
              <p className="text-2xl font-bold">045-465-2382</p>
              <p className="text-xs mt-2 opacity-90">[受付時間] 10:00 〜 19:00（定休日除く）</p>
            </div>

            {/* WEB予約 */}
            <div className="bg-blue-600 text-white rounded-md-japanese p-6 text-center hover:bg-blue-700 transition-colors cursor-pointer">
              <div className="flex items-center justify-center mb-2">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">メールでのお問い合わせ</span>
              </div>
              <p className="text-lg font-bold">WEB予約・お問い合わせ</p>
            </div>
          </div>
        </div>
      </div>

      {/* フッターメニュー */}
      <div className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <Link to="/" className="hover:text-blue-600">各種撮影</Link>
            <span className="text-gray-300">|</span>
            <Link to="/" className="hover:text-blue-600">撮影場所</Link>
            <span className="text-gray-300">|</span>
            <Link to="/" className="hover:text-blue-600">利用規約</Link>
            <span className="text-gray-300">|</span>
            <Link to="/" className="hover:text-blue-600">プライバシーポリシー</Link>
            <span className="text-gray-300">|</span>
            <Link to="/" className="hover:text-blue-600">徹底衛生対策</Link>
            <span className="text-gray-300">|</span>
            <Link to="/" className="hover:text-blue-600">サイトマップ</Link>
          </div>
        </div>
      </div>

      {/* 店舗情報・コピーライト */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* SNS */}
          <div className="flex justify-center space-x-4 mb-6">
            <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>

          <h3 className="text-xl font-bold text-gray-800 mb-2 font-yugothic">そごう写真館 <span className="font-normal text-gray-600">渡邉写真社</span></h3>
          <p className="text-sm text-gray-600 mb-4">
            〒220-8510 神奈川県横浜市西区高島2-18-1 そごう横浜店8F TEL.045-465-2382【営業時間】10:00 〜 19:00（定休日除く）
          </p>
          <p className="text-xs text-gray-500">
            Copyright WATANABE PHOTO Co., Ltd. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
