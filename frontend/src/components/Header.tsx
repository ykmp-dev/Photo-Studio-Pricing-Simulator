import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-4">
          {/* ロゴ */}
          <Link to="/" className="flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 font-yugothic">
              そごう写真館 <span className="text-sm md:text-base font-normal text-gray-600">渡邉写真社</span>
            </h1>
          </Link>
        </div>
      </div>
    </header>
  )
}
