import logoSvg from './logo-bk.svg'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-brand-100">
      {/* 店舗情報・コピーライト */}
      <div className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            {/* ロゴ */}
            <div className="flex items-center justify-center mb-4">
              <img
                src={logoSvg}
                alt="そごう写真館 渡邉写真社"
                className="h-10 md:h-12 w-auto"
              />
            </div>

            {/* 店舗情報 */}
            <div className="space-y-3 font-gothic">
              <div className="flex items-center justify-center text-neutral-600">
                <svg
                  className="w-5 h-5 mr-2 text-brand-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p className="text-sm">
                  〒220-8510 神奈川県横浜市西区高島2-18-1 そごう横浜店8F
                </p>
              </div>

              <div className="flex items-center justify-center text-neutral-600">
                <svg
                  className="w-5 h-5 mr-2 text-brand-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <p className="text-sm">TEL. 045-465-2382</p>
              </div>

              <div className="flex items-center justify-center text-neutral-600">
                <svg
                  className="w-5 h-5 mr-2 text-brand-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm">【営業時間】10:00 〜 19:00（定休日除く）</p>
              </div>
            </div>

            {/* 区切り線 */}
            <div className="max-w-md mx-auto pt-6">
              <div className="h-px bg-brand-200"></div>
            </div>

            {/* コピーライト */}
            <p className="text-xs text-neutral-500 pt-2 font-gothic">
              Copyright © WATANABE PHOTO Co., Ltd. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
