import { useState, useEffect } from 'react'
import type { ConditionalRule, ConditionItem, ConditionalOperator } from '../../types/formV3'

interface ConditionalRuleBuilderProps {
  value: ConditionalRule | null
  onChange: (rule: ConditionalRule | null) => void
  availableFields: { value: string; label: string }[]
}

interface ConditionRow extends ConditionItem {
  id: string
}

interface AndGroup {
  id: string
  conditions: ConditionRow[]
}

/**
 * 非エンジニア向け条件設定ウィザード
 * 専門用語を使わず、自然な日本語で条件を設定できるUI
 */
export default function ConditionalRuleBuilder({
  value,
  onChange,
  availableFields
}: ConditionalRuleBuilderProps) {
  const [matchType, setMatchType] = useState<'any' | 'all'>('any')
  const [patterns, setPatterns] = useState<AndGroup[]>([])
  const [showTechnicalView, setShowTechnicalView] = useState(false)

  // 初期化
  useEffect(() => {
    if (!value) {
      setPatterns([{
        id: generateId(),
        conditions: [{
          id: generateId(),
          field: '',
          operator: '=',
          value: ''
        }]
      }])
      setMatchType('any')
      return
    }

    if (value.OR) {
      setMatchType('any')
      const groups: AndGroup[] = value.OR.map((item) => {
        if ('AND' in item && Array.isArray(item.AND)) {
          return {
            id: generateId(),
            conditions: item.AND.map((cond) => ({
              id: generateId(),
              ...(cond as ConditionItem)
            }))
          }
        } else {
          return {
            id: generateId(),
            conditions: [{
              id: generateId(),
              ...(item as ConditionItem)
            }]
          }
        }
      })
      setPatterns(groups)
    } else if (value.AND) {
      setMatchType('all')
      setPatterns([{
        id: generateId(),
        conditions: value.AND.map((cond) => ({
          id: generateId(),
          ...(cond as ConditionItem)
        }))
      }])
    }
  }, [value])

  useEffect(() => {
    const rule = buildConditionalRule()
    onChange(rule)
  }, [patterns, matchType])

  function generateId() {
    return Math.random().toString(36).substring(2, 9)
  }

  function buildConditionalRule(): ConditionalRule | null {
    const validGroups = patterns
      .map((group) => ({
        ...group,
        conditions: group.conditions.filter((c) => c.field && c.operator)
      }))
      .filter((group) => group.conditions.length > 0)

    if (validGroups.length === 0) return null

    if (matchType === 'all') {
      const allConditions = validGroups.flatMap((group) =>
        group.conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: parseValue(c.value, c.operator)
        }))
      )
      return { AND: allConditions }
    } else {
      const orItems = validGroups.map((group) => {
        if (group.conditions.length === 1) {
          const c = group.conditions[0]
          return {
            field: c.field,
            operator: c.operator,
            value: parseValue(c.value, c.operator)
          }
        } else {
          return {
            AND: group.conditions.map((c) => ({
              field: c.field,
              operator: c.operator,
              value: parseValue(c.value, c.operator)
            }))
          }
        }
      })
      return { OR: orItems }
    }
  }

  function parseValue(value: any, operator: ConditionalOperator): any {
    if (operator === 'IN' || operator === 'NOT_IN') {
      if (typeof value === 'string') {
        return value.split(',').map((v) => v.trim()).filter((v) => v)
      }
      return value
    }
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      return Number(value)
    }
    return value
  }

  function addPattern() {
    setPatterns([
      ...patterns,
      {
        id: generateId(),
        conditions: [{
          id: generateId(),
          field: '',
          operator: '=',
          value: ''
        }]
      }
    ])
  }

  function removePattern(groupId: string) {
    setPatterns(patterns.filter((g) => g.id !== groupId))
  }

  function addCondition(groupId: string) {
    setPatterns(
      patterns.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: [
                ...g.conditions,
                {
                  id: generateId(),
                  field: '',
                  operator: '=',
                  value: ''
                }
              ]
            }
          : g
      )
    )
  }

  function removeCondition(groupId: string, conditionId: string) {
    setPatterns(
      patterns.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.filter((c) => c.id !== conditionId)
            }
          : g
      )
    )
  }

  function updateCondition(
    groupId: string,
    conditionId: string,
    field: keyof ConditionItem,
    value: any
  ) {
    setPatterns(
      patterns.map((g) =>
        g.id === groupId
          ? {
              ...g,
              conditions: g.conditions.map((c) =>
                c.id === conditionId ? { ...c, [field]: value } : c
              )
            }
          : g
      )
    )
  }

  // 演算子の日本語表記（専門用語なし）
  const operators: { value: ConditionalOperator; label: string; description: string }[] = [
    { value: '=', label: 'が次と同じ', description: '完全一致' },
    { value: '!=', label: 'が次と違う', description: '一致しない' },
    { value: 'IN', label: 'がいずれか', description: '複数の選択肢から選ぶ' },
    { value: 'NOT_IN', label: 'がいずれでもない', description: '複数の選択肢を除外' },
    { value: '>', label: 'より大きい', description: '数値比較' },
    { value: '>=', label: '以上', description: '数値比較（同じ値を含む）' },
    { value: '<', label: 'より小さい', description: '数値比較' },
    { value: '<=', label: '以下', description: '数値比較（同じ値を含む）' }
  ]

  // 自然言語プレビュー生成
  function generatePreview(): string {
    const validGroups = patterns
      .map((group) => ({
        ...group,
        conditions: group.conditions.filter((c) => c.field && c.operator)
      }))
      .filter((group) => group.conditions.length > 0)

    if (validGroups.length === 0) {
      return 'まだ条件が設定されていません'
    }

    const groupDescriptions = validGroups.map((group) => {
      const condDescriptions = group.conditions.map((cond) => {
        const field = availableFields.find((f) => f.value === cond.field)
        const fieldLabel = field ? field.label : cond.field
        const op = operators.find((o) => o.value === cond.operator)
        const opLabel = op ? op.label : cond.operator

        let valueStr = ''
        if (Array.isArray(cond.value)) {
          valueStr = `「${cond.value.join('」または「')}」`
        } else {
          valueStr = `「${cond.value}」`
        }

        return `${fieldLabel}${opLabel}${valueStr}`
      })

      if (group.conditions.length > 1) {
        return `(${condDescriptions.join(' かつ ')})`
      } else {
        return condDescriptions[0]
      }
    })

    if (matchType === 'any') {
      return `以下のいずれかに該当したら表示：\n${groupDescriptions.map((d, i) => `  ${i + 1}. ${d}`).join('\n')}`
    } else {
      return `以下の全てに該当したら表示：\n${groupDescriptions.map((d, i) => `  ${i + 1}. ${d}`).join('\n')}`
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-base font-semibold text-gray-800">
          📋 この項目をいつ表示しますか？
        </label>
        <button
          type="button"
          onClick={() => setShowTechnicalView(!showTechnicalView)}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          {showTechnicalView ? '詳細を非表示' : '詳細を表示'}
        </button>
      </div>

      {/* プレビュー */}
      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <div className="text-blue-600 text-xl">💡</div>
          <div className="flex-1">
            <div className="font-semibold text-blue-900 mb-1">表示条件</div>
            <div className="text-sm text-blue-800 whitespace-pre-line">
              {generatePreview()}
            </div>
          </div>
        </div>
      </div>

      {/* マッチタイプ選択 */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          複数の条件がある場合、どう判定しますか？
        </label>
        <div className="space-y-2">
          <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: matchType === 'any' ? '#3b82f6' : '#d1d5db' }}>
            <input
              type="radio"
              value="any"
              checked={matchType === 'any'}
              onChange={(e) => setMatchType(e.target.value as 'any')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-800">
                いずれか1つに該当すればOK
              </div>
              <div className="text-xs text-gray-600 mt-1">
                例: 「スタジオ撮影」または「平日」のどちらかを選んでいれば表示
              </div>
            </div>
          </label>
          <label className="flex items-start gap-3 p-3 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
            style={{ borderColor: matchType === 'all' ? '#3b82f6' : '#d1d5db' }}>
            <input
              type="radio"
              value="all"
              checked={matchType === 'all'}
              onChange={(e) => setMatchType(e.target.value as 'all')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-800">
                全ての条件を満たす必要がある
              </div>
              <div className="text-xs text-gray-600 mt-1">
                例: 「スタジオ撮影」かつ「平日」の両方を選んでいる時だけ表示
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 条件パターン */}
      <div className="space-y-3">
        {patterns.map((pattern, patternIndex) => (
          <div key={pattern.id} className="border-2 border-gray-300 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                {matchType === 'any' ? `パターン ${patternIndex + 1}` : '条件'}
              </h4>
              {patterns.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePattern(pattern.id)}
                  className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
                >
                  削除
                </button>
              )}
            </div>

            {/* 条件リスト */}
            <div className="space-y-3">
              {pattern.conditions.map((condition, condIndex) => (
                <div key={condition.id} className="space-y-2">
                  {condIndex > 0 && (
                    <div className="text-xs font-semibold text-gray-500 px-2">
                      ↓ かつ
                    </div>
                  )}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="grid gap-3">
                      {/* フィールド選択 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          どの質問の回答を見ますか？
                        </label>
                        <select
                          value={condition.field}
                          onChange={(e) =>
                            updateCondition(pattern.id, condition.id, 'field', e.target.value)
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          <option value="">-- 質問を選択 --</option>
                          {availableFields.map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 演算子選択 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          どういう条件ですか？
                        </label>
                        <select
                          value={condition.operator}
                          onChange={(e) =>
                            updateCondition(
                              pattern.id,
                              condition.id,
                              'operator',
                              e.target.value as ConditionalOperator
                            )
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        >
                          {operators.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 値入力 */}
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {condition.operator === 'IN' || condition.operator === 'NOT_IN'
                            ? '値（カンマ区切りで複数入力）'
                            : '値'}
                        </label>
                        <input
                          type="text"
                          value={
                            Array.isArray(condition.value)
                              ? condition.value.join(',')
                              : String(condition.value ?? '')
                          }
                          onChange={(e) =>
                            updateCondition(pattern.id, condition.id, 'value', e.target.value)
                          }
                          placeholder={
                            condition.operator === 'IN' || condition.operator === 'NOT_IN'
                              ? '例: スタジオ,ロケーション'
                              : '例: スタジオ'
                          }
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {condition.operator === 'IN' || condition.operator === 'NOT_IN'
                            ? '※ 複数の値を設定する場合は、カンマ（,）で区切ってください'
                            : '※ お客様が選んだ値と比較します'}
                        </p>
                      </div>
                    </div>

                    {/* 条件削除ボタン */}
                    {pattern.conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCondition(pattern.id, condition.id)}
                        className="mt-2 text-xs text-red-600 hover:text-red-800"
                      >
                        この条件を削除
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 条件追加 */}
            <button
              type="button"
              onClick={() => addCondition(pattern.id)}
              className="mt-3 w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              ＋ さらに条件を追加（「かつ」で結合）
            </button>
          </div>
        ))}
      </div>

      {/* パターン追加（anyの場合のみ） */}
      {matchType === 'any' && (
        <button
          type="button"
          onClick={addPattern}
          className="w-full border-2 border-dashed border-blue-300 rounded-lg py-3 text-sm text-blue-600 hover:border-blue-500 hover:bg-blue-50 font-medium transition-colors"
        >
          ＋ 別のパターンを追加（「または」で結合）
        </button>
      )}

      {/* ヘルプ */}
      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
        <div className="flex gap-2">
          <div className="text-yellow-600 text-lg">📌</div>
          <div className="flex-1 text-sm text-gray-700">
            <div className="font-semibold text-gray-800 mb-2">使い方のヒント</div>
            <ul className="space-y-1 list-disc list-inside text-xs">
              <li>「質問」とは、お客様が最初に選ぶ項目（コースや撮影場所など）のことです</li>
              <li>複数のパターンがある場合、「いずれか1つ」を選ぶのがおすすめです</li>
              <li>「全ての条件を満たす」は、厳しい条件になるので注意してください</li>
              <li>上の青いボックスで、設定内容がどう表示されるか確認できます</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 技術的な詳細（オプション） */}
      {showTechnicalView && (
        <div className="bg-gray-100 border border-gray-300 rounded-lg p-3">
          <div className="text-xs font-semibold text-gray-600 mb-2">
            技術的な詳細（開発者向け）
          </div>
          <pre className="text-xs font-mono text-gray-700 overflow-auto">
            {JSON.stringify(buildConditionalRule(), null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
