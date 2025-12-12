import { useState, useEffect } from 'react'
import type { FormFieldWithOptions, FieldType } from '../../types/formBuilder'
import {
  createFieldOption,
  updateFieldOption,
  deleteFieldOption,
  updateOptionsOrder,
} from '../../services/formBuilderService'

interface FieldEditorProps {
  field: FormFieldWithOptions
  isEditing: boolean
  onEdit: () => void
  onCollapse: () => void
  onUpdate: (updates: Partial<FormFieldWithOptions>) => void
  onDelete: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'select', label: 'セレクトボックス' },
  { value: 'radio', label: 'ラジオボタン' },
  { value: 'checkbox', label: 'チェックボックス' },
  { value: 'text', label: 'テキスト入力' },
  { value: 'number', label: '数値入力' },
]

export default function FieldEditor({
  field,
  isEditing,
  onEdit,
  onCollapse,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: FieldEditorProps) {
  const [label, setLabel] = useState(field.label)
  const [name, setName] = useState(field.name)
  const [fieldType, setFieldType] = useState(field.field_type)
  const [required, setRequired] = useState(field.required)
  const [priceValue, setPriceValue] = useState(field.price_value)
  const [metadata, setMetadata] = useState(field.metadata)
  const [options, setOptions] = useState(field.options)

  useEffect(() => {
    setLabel(field.label)
    setName(field.name)
    setFieldType(field.field_type)
    setRequired(field.required)
    setPriceValue(field.price_value)
    setMetadata(field.metadata)
    setOptions(field.options)
  }, [field])

  const handleSave = () => {
    onUpdate({
      label,
      name,
      field_type: fieldType,
      required,
      price_value: priceValue,
      metadata,
    })
    onCollapse()
  }

  const handleAddOption = async () => {
    try {
      const newOption = await createFieldOption({
        field_id: field.id,
        label: '新しい選択肢',
        value: `option_${Date.now()}`,
        price_value: 0,
        sort_order: options.length,
        metadata: {},
      })

      setOptions([...options, newOption])
    } catch (err) {
      alert('選択肢の追加に失敗しました')
      console.error(err)
    }
  }

  const handleUpdateOption = async (
    optionId: number,
    updates: { label?: string; value?: string; price_value?: number }
  ) => {
    try {
      const updated = await updateFieldOption(optionId, updates)
      setOptions(options.map((opt) => (opt.id === optionId ? updated : opt)))
    } catch (err) {
      alert('選択肢の更新に失敗しました')
      console.error(err)
    }
  }

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm('この選択肢を削除しますか？')) return

    try {
      await deleteFieldOption(optionId)
      setOptions(options.filter((opt) => opt.id !== optionId))
    } catch (err) {
      alert('選択肢の削除に失敗しました')
      console.error(err)
    }
  }

  const handleMoveOption = async (optionId: number, direction: 'up' | 'down') => {
    const currentIndex = options.findIndex((opt) => opt.id === optionId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= options.length) return

    const newOptions = [...options]
    const [movedOption] = newOptions.splice(currentIndex, 1)
    newOptions.splice(newIndex, 0, movedOption)

    setOptions(newOptions)

    try {
      await updateOptionsOrder(newOptions.map((opt) => opt.id))
    } catch (err) {
      alert('並び順の更新に失敗しました')
      console.error(err)
    }
  }

  const hasOptions = ['select', 'radio', 'checkbox'].includes(fieldType)

  if (!isEditing) {
    // 折りたたみ表示
    return (
      <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex flex-col gap-1">
              {onMoveUp && (
                <button
                  onClick={onMoveUp}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                  title="上に移動"
                >
                  ▲
                </button>
              )}
              {onMoveDown && (
                <button
                  onClick={onMoveDown}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                  title="下に移動"
                >
                  ▼
                </button>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-800">{field.label}</span>
                {field.required && (
                  <span className="text-red-500 text-sm">必須</span>
                )}
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {FIELD_TYPES.find((t) => t.value === field.field_type)?.label}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                name: {field.name} | 価格: ¥{field.price_value.toLocaleString()}
              </div>
              {hasOptions && options.length > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  選択肢: {options.length}個
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm font-medium"
            >
              編集
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-700 px-3 py-1 text-sm font-medium"
            >
              削除
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 展開表示（編集モード）
  return (
    <div className="border-2 border-blue-400 rounded-lg p-6 bg-blue-50">
      <div className="space-y-4">
        {/* フィールド基本設定 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ラベル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フィールド名（name属性） <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              フィールドタイプ
            </label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value as FieldType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              基本価格
            </label>
            <input
              type="number"
              value={priceValue}
              onChange={(e) => setPriceValue(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">必須フィールド</span>
          </label>
        </div>

        {/* メタデータ（dataVal, dataAge, familyFlg等） */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            メタデータ（条件分岐用）
          </h4>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">dataVal</label>
              <input
                type="text"
                value={metadata.dataVal || ''}
                onChange={(e) =>
                  setMetadata({ ...metadata, dataVal: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="例: plan-basic"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">dataAge</label>
              <input
                type="text"
                value={metadata.dataAge || ''}
                onChange={(e) =>
                  setMetadata({ ...metadata, dataAge: e.target.value })
                }
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                placeholder="例: over12"
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={metadata.familyFlg || false}
                  onChange={(e) =>
                    setMetadata({ ...metadata, familyFlg: e.target.checked })
                  }
                  className="w-3 h-3"
                />
                familyFlg
              </label>
            </div>
          </div>
        </div>

        {/* 選択肢管理 */}
        {hasOptions && (
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">選択肢</h4>
              <button
                onClick={handleAddOption}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-medium"
              >
                + 選択肢追加
              </button>
            </div>

            {options.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-2">
                選択肢を追加してください
              </p>
            ) : (
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div
                    key={option.id}
                    className="flex items-center gap-2 bg-gray-50 p-2 rounded"
                  >
                    <div className="flex flex-col">
                      {index > 0 && (
                        <button
                          onClick={() => handleMoveOption(option.id, 'up')}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ▲
                        </button>
                      )}
                      {index < options.length - 1 && (
                        <button
                          onClick={() => handleMoveOption(option.id, 'down')}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ▼
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) =>
                        handleUpdateOption(option.id, { label: e.target.value })
                      }
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="表示名"
                    />

                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) =>
                        handleUpdateOption(option.id, { value: e.target.value })
                      }
                      className="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="値"
                    />

                    <input
                      type="number"
                      value={option.price_value}
                      onChange={(e) =>
                        handleUpdateOption(option.id, {
                          price_value: Number(e.target.value),
                        })
                      }
                      className="w-24 border border-gray-300 rounded px-2 py-1 text-sm"
                      placeholder="価格"
                    />

                    <button
                      onClick={() => handleDeleteOption(option.id)}
                      className="text-red-600 hover:text-red-700 px-2 text-sm"
                    >
                      削除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* アクションボタン */}
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            保存
          </button>
          <button
            onClick={onCollapse}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
