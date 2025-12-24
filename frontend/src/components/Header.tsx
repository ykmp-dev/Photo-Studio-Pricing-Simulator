import { Link } from 'react-router-dom'
import logoSvg from './logo-bk.svg'

export default function Header() {
  return (
    <header className="bg-white shadow-soft sticky top-0 z-50 border-b border-brand-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-5">
          {/* ロゴ */}
          <Link
            to="/"
            className="group transition-transform duration-300 hover:scale-105"
          >
            <img
              src={logoSvg}
              alt="そごう写真館 渡邉写真社"
              className="h-8 md:h-10 w-auto"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
