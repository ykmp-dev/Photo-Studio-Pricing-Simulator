import { useState, useEffect } from 'react'
import type { ConditionalRule } from '../../types/formV3'

interface SimpleConditionBuilderProps {
  value: ConditionalRule | null
  onChange: (rule: ConditionalRule | null) => void
  availableFields: { value: string; label: string }[]
}

/**
 * 超シンプル条件設定
 * 「常に表示」or「○○を選んだ時だけ表示」の2択のみ
 */
export default function SimpleConditionBuilder({
  value,
  onChange,
  availableFields
}: SimpleConditionBuilderProps) {
  const [mode, setMode] = useState<'always' | 'when'>('always')
  const [selectedField, setSelectedField] = useState('')
  const [selectedValue, setSelectedValue] = useState('')

  // 初期化
  useEffect(() => {
    if (!value) {
      setMode('always')
      return
    }

    // シンプルな条件のみ対応（単一AND条件）
    if (value.AND && value.AND.length === 1) {
      const cond = value.AND[0] as any
      if (cond.field && cond.operator === '=' && cond.value) {
        setMode('when')
        setSelectedField(cond.field)
        setSelectedValue(String(cond.value))
        return
      }
    }

    // それ以外は「常に表示」扱い
    setMode('always')
  }, [value])

  // 条件変更時
  useEffect(() => {
    if (mode === 'always') {
      onChange(null)
    } else {
      if (selectedField && selectedValue) {
        onChange({
          AND: [{
            field: selectedField,
            operator: '=',
            value: selectedValue
          }]
        })
      } else {
        onChange(null)
      }
    }
  }, [mode, selectedField, selectedValue])

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <label className="block text-sm font-semibold text-gray-800 mb-3">
        いつ表示しますか？
      </label>

      <div className="space-y-3">
        {/* 常に表示 */}
        <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
          style={{ borderColor: mode === 'always' ? '#3b82f6' : '#e5e7eb', backgroundColor: mode === 'always' ? '#eff6ff' : 'transparent' }}>
          <input
            type="radio"
            value="always"
            checked={mode === 'always'}
            onChange={(e) => setMode(e.target.value as 'always')}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-800">常に表示</div>
            <div className="text-xs text-gray-600 mt-1">
              お客様が何を選んでも、この項目は必ず表示されます
            </div>
          </div>
        </label>

        {/* 条件付き表示 */}
        <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
          style={{ borderColor: mode === 'when' ? '#3b82f6' : '#e5e7eb', backgroundColor: mode === 'when' ? '#eff6ff' : 'transparent' }}>
          <input
            type="radio"
            value="when"
            checked={mode === 'when'}
            onChange={(e) => setMode(e.target.value as 'when')}
            className="mt-1"
          />
          <div className="flex-1">
            <div className="font-medium text-gray-800">特定の選択肢を選んだ時だけ表示</div>
            <div className="text-xs text-gray-600 mt-1">
              例: 「スタジオ撮影」を選んだ時だけヘアメイクを表示
            </div>
          </div>
        </label>

        {/* 条件詳細（whenの場合のみ） */}
        {mode === 'when' && (
          <div className="ml-8 mt-2 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                どの項目を見ますか？
              </label>
              <select
                value={selectedField}
                onChange={(e) => setSelectedField(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">-- 項目を選択 --</option>
                {availableFields.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                どの選択肢を選んだ時ですか？
              </label>
              <input
                type="text"
                value={selectedValue}
                onChange={(e) => setSelectedValue(e.target.value)}
                placeholder="例: スタジオ撮影"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                ※ 選択肢の名前を正確に入力してください
              </p>
            </div>
          </div>
        )}
      </div>

      {/* プレビュー */}
      {mode === 'when' && selectedField && selectedValue && (
        <div className="mt-3 bg-blue-50 border border-blue-300 rounded p-2">
          <div className="text-xs text-blue-800">
            💡 「{availableFields.find(f => f.value === selectedField)?.label || selectedField}」が「{selectedValue}」の時に表示されます
          </div>
        </div>
      )}
    </div>
  )
}
