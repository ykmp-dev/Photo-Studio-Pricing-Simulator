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
 * ビジュアル条件ルールビルダー
 * 非エンジニアスタッフ向けに、フォームベースで条件ルールを作成できるUI
 */
export default function ConditionalRuleBuilder({
  value,
  onChange,
  availableFields
}: ConditionalRuleBuilderProps) {
  const [logicType, setLogicType] = useState<'AND' | 'OR'>('OR')
  const [andGroups, setAndGroups] = useState<AndGroup[]>([])
  const [showJsonPreview, setShowJsonPreview] = useState(false)

  // 初期化: valueからandGroupsを復元
  useEffect(() => {
    if (!value) {
      // デフォルト: 1つのANDグループに1つの条件
      setAndGroups([{
        id: generateId(),
        conditions: [{
          id: generateId(),
          field: '',
          operator: '=',
          value: ''
        }]
      }])
      setLogicType('OR')
      return
    }

    // valueからandGroupsを復元
    if (value.OR) {
      setLogicType('OR')
      const groups: AndGroup[] = value.OR.map((item) => {
        if ('AND' in item && Array.isArray(item.AND)) {
          // ANDグループ
          return {
            id: generateId(),
            conditions: item.AND.map((cond) => ({
              id: generateId(),
              ...cond
            }))
          }
        } else {
          // 単一条件
          return {
            id: generateId(),
            conditions: [{
              id: generateId(),
              ...(item as ConditionItem)
            }]
          }
        }
      })
      setAndGroups(groups)
    } else if (value.AND) {
      setLogicType('AND')
      setAndGroups([{
        id: generateId(),
        conditions: value.AND.map((cond) => ({
          id: generateId(),
          ...(cond as ConditionItem)
        }))
      }])
    }
  }, [value])

  // andGroupsが変更されたらConditionalRuleを生成してonChangeを呼ぶ
  useEffect(() => {
    const rule = buildConditionalRule()
    onChange(rule)
  }, [andGroups, logicType])

  function generateId() {
    return Math.random().toString(36).substring(2, 9)
  }

  function buildConditionalRule(): ConditionalRule | null {
    const validGroups = andGroups
      .map((group) => ({
        ...group,
        conditions: group.conditions.filter((c) => c.field && c.operator)
      }))
      .filter((group) => group.conditions.length > 0)

    if (validGroups.length === 0) return null

    if (logicType === 'AND') {
      // 全てのANDグループの条件をフラット化
      const allConditions = validGroups.flatMap((group) =>
        group.conditions.map((c) => ({
          field: c.field,
          operator: c.operator,
          value: parseValue(c.value, c.operator)
        }))
      )
      return { AND: allConditions }
    } else {
      // OR
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
      // カンマ区切りの文字列を配列に変換
      if (typeof value === 'string') {
        return value.split(',').map((v) => v.trim()).filter((v) => v)
      }
      return value
    }
    // 数値変換を試みる
    if (typeof value === 'string' && !isNaN(Number(value)) && value.trim() !== '') {
      return Number(value)
    }
    return value
  }

  function addAndGroup() {
    setAndGroups([
      ...andGroups,
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

  function removeAndGroup(groupId: string) {
    setAndGroups(andGroups.filter((g) => g.id !== groupId))
  }

  function addCondition(groupId: string) {
    setAndGroups(
      andGroups.map((g) =>
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
    setAndGroups(
      andGroups.map((g) =>
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
    setAndGroups(
      andGroups.map((g) =>
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

  const operators: { value: ConditionalOperator; label: string }[] = [
    { value: '=', label: '等しい (=)' },
    { value: '!=', label: '等しくない (≠)' },
    { value: 'IN', label: 'いずれか (IN)' },
    { value: 'NOT_IN', label: 'いずれでもない (NOT IN)' },
    { value: '>', label: 'より大きい (>)' },
    { value: '>=', label: '以上 (≥)' },
    { value: '<', label: 'より小さい (<)' },
    { value: '<=', label: '以下 (≤)' }
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          条件ルール設定
        </label>
        <button
          type="button"
          onClick={() => setShowJsonPreview(!showJsonPreview)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {showJsonPreview ? 'JSON非表示' : 'JSON表示'}
        </button>
      </div>

      {/* JSON Preview */}
      {showJsonPreview && (
        <div className="bg-gray-100 p-3 rounded border border-gray-300">
          <div className="text-xs font-mono text-gray-700">
            <pre>{JSON.stringify(buildConditionalRule(), null, 2)}</pre>
          </div>
        </div>
      )}

      {/* Logic Type Selector */}
      <div className="bg-blue-50 p-3 rounded border border-blue-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          複数グループの結合方法
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="OR"
              checked={logicType === 'OR'}
              onChange={(e) => setLogicType(e.target.value as 'OR')}
              className="mr-2"
            />
            <span className="text-sm">OR（いずれかのグループに一致）</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="AND"
              checked={logicType === 'AND'}
              onChange={(e) => setLogicType(e.target.value as 'AND')}
              className="mr-2"
            />
            <span className="text-sm">AND（全てのグループに一致）</span>
          </label>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          通常は「OR」を推奨（複数のパターンのいずれかに該当したら表示）
        </p>
      </div>

      {/* AND Groups */}
      <div className="space-y-4">
        {andGroups.map((group, groupIndex) => (
          <div key={group.id} className="border border-gray-300 rounded-lg p-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">
                {logicType === 'OR' ? `パターン ${groupIndex + 1}` : '条件グループ'}
              </h4>
              {andGroups.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAndGroup(group.id)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  削除
                </button>
              )}
            </div>

            {/* Conditions */}
            <div className="space-y-2">
              {group.conditions.map((condition, condIndex) => (
                <div key={condition.id} className="flex gap-2 items-start">
                  {condIndex > 0 && (
                    <div className="text-xs font-semibold text-gray-500 pt-2">AND</div>
                  )}
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    {/* Field */}
                    <select
                      value={condition.field}
                      onChange={(e) =>
                        updateCondition(group.id, condition.id, 'field', e.target.value)
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value="">-- フィールド選択 --</option>
                      {availableFields.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      value={condition.operator}
                      onChange={(e) =>
                        updateCondition(
                          group.id,
                          condition.id,
                          'operator',
                          e.target.value as ConditionalOperator
                        )
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      {operators.map((op) => (
                        <option key={op.value} value={op.value}>
                          {op.label}
                        </option>
                      ))}
                    </select>

                    {/* Value */}
                    <input
                      type="text"
                      value={
                        Array.isArray(condition.value)
                          ? condition.value.join(',')
                          : String(condition.value ?? '')
                      }
                      onChange={(e) =>
                        updateCondition(group.id, condition.id, 'value', e.target.value)
                      }
                      placeholder={
                        condition.operator === 'IN' || condition.operator === 'NOT_IN'
                          ? 'カンマ区切り (例: a,b,c)'
                          : '値を入力'
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                  </div>

                  {/* Remove Condition */}
                  {group.conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCondition(group.id, condition.id)}
                      className="text-red-600 hover:text-red-800 text-sm mt-1"
                      title="条件を削除"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add Condition */}
            <button
              type="button"
              onClick={() => addCondition(group.id)}
              className="mt-3 text-xs text-blue-600 hover:text-blue-800"
            >
              + AND条件を追加
            </button>
          </div>
        ))}
      </div>

      {/* Add AND Group (only for OR logic) */}
      {logicType === 'OR' && (
        <button
          type="button"
          onClick={addAndGroup}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg py-3 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600"
        >
          + 新しいパターンを追加
        </button>
      )}

      {/* Help Text */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
        <p className="text-xs text-gray-700">
          <strong>💡 使い方：</strong>
        </p>
        <ul className="text-xs text-gray-600 mt-1 space-y-1 list-disc list-inside">
          <li>フィールド名は、選択したカテゴリのID（例: category_1, category_2）です</li>
          <li>「いずれか (IN)」を使う場合、値をカンマ区切りで入力（例: studio,on_location）</li>
          <li>「OR」モードでは、複数のパターンのどれか1つに一致すれば表示されます</li>
          <li>各パターン内の条件は「AND」で結合されます（全て満たす必要がある）</li>
        </ul>
      </div>
    </div>
  )
}
