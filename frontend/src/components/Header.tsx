import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="bg-white shadow-soft sticky top-0 z-50 border-b border-brand-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center py-5">
          {/* ロゴ */}
          <Link
            to="/"
            className="flex items-center group transition-transform duration-300 hover:scale-105"
          >
            {/* ロゴアイコン */}
            <div className="mr-3 flex items-center justify-center w-10 h-10 rounded-full bg-brand-500 shadow-brand">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-bold text-brand-700 font-mincho leading-tight tracking-widest">
                そごう写真館
              </h1>
              <p className="text-xs md:text-sm text-neutral-600 font-mincho tracking-widest">
                渡邉写真社
              </p>
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
