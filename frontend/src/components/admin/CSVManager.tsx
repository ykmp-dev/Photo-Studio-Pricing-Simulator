import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

type TableType = 'shooting_categories' | 'product_categories' | 'items'

const TABLE_LABELS: Record<TableType, string> = {
  shooting_categories: '撮影カテゴリ',
  product_categories: '商品カテゴリ',
  items: 'アイテム',
}

interface CSVManagerProps {
  onHasChanges?: (hasChanges: boolean) => void
}

export default function CSVManager({ onHasChanges }: CSVManagerProps) {
  const shopId = 1 // TODO: Get from context
  const [selectedTable, setSelectedTable] = useState<TableType>('product_categories')
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [draftData, setDraftData] = useState<any[] | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // 変更通知
  useEffect(() => {
    onHasChanges?.(hasChanges)
  }, [hasChanges, onHasChanges])

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

  // CSVファイルを読み込んで下書きに保存
  const handleLoadCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
          } else if (header === 'is_active' || header === 'is_required' || header === 'auto_select') {
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
          e.target.value = ''
          return
        }
      }

      setDraftData(rows)
      setHasChanges(true)
      e.target.value = ''
    } catch (err) {
      console.error(err)
      alert('CSVファイルの読み込みに失敗しました: ' + (err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  // 下書きデータを実際にインポート
  const handlePublishImport = async () => {
    if (!draftData || draftData.length === 0) return

    if (!confirm(`${draftData.length}件のデータをインポートします。既存のデータは上書きされます。よろしいですか？`)) {
      return
    }

    try {
      setImporting(true)

      const { error } = await supabase
        .from(selectedTable)
        .upsert(draftData, { onConflict: 'id' })

      if (error) throw error

      alert(`${draftData.length}件のデータをインポートしました`)
      setDraftData(null)
      setHasChanges(false)
    } catch (err) {
      console.error(err)
      alert('インポートに失敗しました: ' + (err as Error).message)
    } finally {
      setImporting(false)
    }
  }

  // 下書きを破棄
  const handleDiscardDraft = () => {
    if (!confirm('読み込んだCSVデータを破棄しますか？')) return
    setDraftData(null)
    setHasChanges(false)
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
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">CSV インポート/エクスポート</h2>
          <p className="text-sm text-gray-600 mt-1">カテゴリやアイテムデータをCSVファイルで管理</p>
        </div>
        {/* 更新・破棄ボタン */}
        {hasChanges && draftData && (
          <div className="flex gap-3">
            <button
              onClick={handleDiscardDraft}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              破棄
            </button>
            <button
              onClick={handlePublishImport}
              disabled={importing}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md disabled:bg-gray-400"
            >
              {importing ? 'インポート中...' : 'インポート実行'}
            </button>
          </div>
        )}
      </div>

      {/* 変更通知バナー */}
      {hasChanges && draftData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800">
            ⚠️ {draftData.length}件のデータが読み込まれています。「インポート実行」ボタンを押すまでデータベースに反映されません。
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            テーブルを選択
          </label>
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value as TableType)}
            disabled={hasChanges}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
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
              CSVファイルを読み込んでプレビューします
            </p>
            <div className="space-y-2">
              <input
                type="file"
                accept=".csv"
                onChange={handleLoadCSV}
                disabled={importing || hasChanges}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              {importing && (
                <p className="text-sm text-gray-500">読み込み中...</p>
              )}
            </div>
          </div>

          {/* プレビュー */}
          {draftData && draftData.length > 0 && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-gray-800 mb-3">
                プレビュー（{draftData.length}件）
              </h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      {Object.keys(draftData[0]).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium text-gray-700 border-b">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {draftData.slice(0, 50).map((row, index) => (
                      <tr key={index} className="border-b hover:bg-white">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="px-3 py-2 text-gray-600">
                            {value === null ? '(null)' : String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {draftData.length > 50 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    ※ 最初の50件のみ表示しています
                  </p>
                )}
              </div>
            </div>
          )}

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
                <p className="font-mono">id,shop_id,product_category_id,name,price,description,sort_order,is_active,is_required,auto_select</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
