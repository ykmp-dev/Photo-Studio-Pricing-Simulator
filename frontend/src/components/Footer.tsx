export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      {/* 店舗情報・コピーライト */}
      <div className="bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
