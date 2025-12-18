import { useState } from 'react'
import { supabase } from '../../lib/supabase'

type TableType = 'shooting_categories' | 'product_categories' | 'items'

const TABLE_LABELS: Record<TableType, string> = {
  shooting_categories: '撮影カテゴリ',
  product_categories: '商品カテゴリ',
  items: 'アイテム',
}

export default function CSVManager() {
  const shopId = 1 // TODO: Get from context
  const [selectedTable, setSelectedTable] = useState<TableType>('product_categories')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  // CSVエクスポート
  const handleExport = async () => {
    try {
      setExporting(true)

      let query = supabase.from(selectedTable).select('*').eq('shop_id', shopId)

      if (selectedTable !== 'items') {
        query = query.order('sort_order', { ascending: true })
      }

      const { data, error } = await query

      if (error) throw error
      if (!data || data.length === 0) {
        alert('エクスポートするデータがありません')
        return
      }

      // CSVに変換
      const headers = Object.keys(data[0])
      const csvContent = [
        headers.join(','),
        ...data.map((row: any) =>
          headers.map(header => {
            const value = row[header]
            // 値にカンマや改行が含まれる場合はダブルクォートで囲む
            if (value === null || value === undefined) return ''
            const stringValue = String(value)
            if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
              return `"${stringValue.replace(/"/g, '""')}"`
            }
            return stringValue
          }).join(',')
        )
      ].join('\n')

      // ダウンロード
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${selectedTable}_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      alert('エクスポートが完了しました')
    } catch (err) {
      console.error(err)
      alert('エクスポートに失敗しました: ' + (err as Error).message)
    } finally {
      setExporting(false)
    }
  }

  // CSVインポート
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setImporting(true)

      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        alert('CSVファイルにデータがありません')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim())
      const rows = lines.slice(1).map(line => {
        const values = parseCSVLine(line)
        const row: any = {}
        headers.forEach((header, index) => {
          const value = values[index]?.trim()
          if (value === '' || value === 'null' || value === 'undefined') {
            row[header] = null
          } else if (header === 'price' || header === 'sort_order' || header === 'shop_id' || header === 'product_category_id' || header === 'id') {
            row[header] = parseInt(value)
          } else if (header === 'is_active') {
            row[header] = value === 'true' || value === '1'
          } else {
            row[header] = value
          }
        })
        return row
      })

      // データのバリデーション
      if (rows.some(row => !row.shop_id || row.shop_id !== shopId)) {
        if (!confirm('shop_idが一致しないデータが含まれています。続行しますか？')) {
          return
        }
      }

      // 確認
      if (!confirm(`${rows.length}件のデータをインポートします。既存のデータは上書きされます。よろしいですか？`)) {
        return
      }

      // Upsert（更新または挿入）
      const { error } = await supabase
        .from(selectedTable)
        .upsert(rows, { onConflict: 'id' })

      if (error) throw error

      alert(`${rows.length}件のデータをインポートしました`)

      // ファイル入力をリセット
      e.target.value = ''
    } catch (err) {
      console.error(err)
      alert('インポートに失敗しました: ' + (err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  // CSV行のパース（カンマを含むフィールドに対応）
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const nextChar = line[i + 1]

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // エスケープされたダブルクォート
          current += '"'
          i++
        } else {
          // クォートの開始/終了
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // フィールドの区切り
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    result.push(current)
    return result
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">CSV インポート/エクスポート</h2>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          テーブルを選択
        </label>
        <select
          value={selectedTable}
          onChange={(e) => setSelectedTable(e.target.value as TableType)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {Object.entries(TABLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-4">
        {/* エクスポート */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">エクスポート</h3>
          <p className="text-sm text-gray-600 mb-3">
            現在のデータをCSVファイルとしてダウンロードします
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {exporting ? 'エクスポート中...' : 'CSVエクスポート'}
          </button>
        </div>

        {/* インポート */}
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">インポート</h3>
          <p className="text-sm text-gray-600 mb-3">
            CSVファイルからデータをインポートします（既存データは上書きされます）
          </p>
          <div className="space-y-2">
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              disabled={importing}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {importing && (
              <p className="text-sm text-gray-500">インポート中...</p>
            )}
          </div>
        </div>

        {/* CSV形式の説明 */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">CSV形式</h3>
          <div className="text-xs text-gray-600 space-y-1">
            {selectedTable === 'shooting_categories' && (
              <p className="font-mono">id,shop_id,name,display_name,description,sort_order,is_active</p>
            )}
            {selectedTable === 'product_categories' && (
              <p className="font-mono">id,shop_id,name,display_name,description,sort_order,is_active</p>
            )}
            {selectedTable === 'items' && (
              <p className="font-mono">id,shop_id,product_category_id,name,price,description,sort_order,is_active</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
