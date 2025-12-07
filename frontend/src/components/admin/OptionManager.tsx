import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Option } from '../../types'
import { formatPrice } from '../../utils/priceCalculator'

interface OptionManagerProps {
  shopId: number
}

const categoryLabels: Record<string, string> = {
  hair: 'ヘアセット',
  makeup: 'メイク',
  dressing: '着付',
  photo_item: 'フォトアイテム',
}

export default function OptionManager({ shopId }: OptionManagerProps) {
  const [options, setOptions] = useState<Option[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingOption, setEditingOption] = useState<Option | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: 'hair' as 'hair' | 'makeup' | 'dressing' | 'photo_item',
    description: '',
    sort_order: '0',
  })

  useEffect(() => {
    fetchOptions()
  }, [shopId])

  const fetchOptions = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('options')
        .select('*')
        .eq('shop_id', shopId)
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true })

      if (error) throw error
      setOptions(data || [])
    } catch (error) {
      console.error('Error fetching options:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const optionData = {
        shop_id: shopId,
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description,
        sort_order: parseInt(formData.sort_order),
      }

      if (editingOption) {
        const { error } = await supabase
          .from('options')
          .update(optionData)
          .eq('id', editingOption.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('options').insert([optionData])

        if (error) throw error
      }

      resetForm()
      fetchOptions()
    } catch (error) {
      console.error('Error saving option:', error)
      alert('保存に失敗しました')
    }
  }

  const handleEdit = (option: Option) => {
    setEditingOption(option)
    setFormData({
      name: option.name,
      price: option.price.toString(),
      category: option.category,
      description: option.description || '',
      sort_order: option.sort_order.toString(),
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('本当に削除しますか?')) return

    try {
      const { error } = await supabase.from('options').delete().eq('id', id)

      if (error) throw error
      fetchOptions()
    } catch (error) {
      console.error('Error deleting option:', error)
      alert('削除に失敗しました')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      category: 'hair',
      description: '',
      sort_order: '0',
    })
    setEditingOption(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">オプション管理</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'キャンセル' : '+ 新規オプション'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingOption ? 'オプション編集' : '新規オプション作成'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                オプション名
              </label>
              <input
                type="text"
                required
                className="input-field"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                料金
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                className="input-field"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <select
                className="input-field"
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as any,
                  })
                }
              >
                <option value="hair">ヘアセット</option>
                <option value="makeup">メイク</option>
                <option value="dressing">着付</option>
                <option value="photo_item">フォトアイテム</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                説明
              </label>
              <textarea
                className="input-field"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                表示順
              </label>
              <input
                type="number"
                className="input-field"
                value={formData.sort_order}
                onChange={(e) =>
                  setFormData({ ...formData, sort_order: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                {editingOption ? '更新' : '作成'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                キャンセル
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                オプション名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                料金
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                カテゴリ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {options.map((option) => (
              <tr key={option.id}>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">
                    {option.name}
                  </div>
                  {option.description && (
                    <div className="text-sm text-gray-500">
                      {option.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(option.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {categoryLabels[option.category]}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(option)}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(option.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    削除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
