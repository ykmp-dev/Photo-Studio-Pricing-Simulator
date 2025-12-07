import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plan } from '../../types'
import { formatPrice } from '../../utils/priceCalculator'

interface PlanManagerProps {
  shopId: number
}

export default function PlanManager({ shopId }: PlanManagerProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    base_price: '',
    description: '',
    category: '',
    sort_order: '0',
  })

  useEffect(() => {
    fetchPlans()
  }, [shopId])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('shop_id', shopId)
        .order('sort_order', { ascending: true })

      if (error) throw error
      setPlans(data || [])
    } catch (error) {
      console.error('Error fetching plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const planData = {
        shop_id: shopId,
        name: formData.name,
        base_price: parseFloat(formData.base_price),
        description: formData.description,
        category: formData.category,
        sort_order: parseInt(formData.sort_order),
      }

      if (editingPlan) {
        const { error } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', editingPlan.id)

        if (error) throw error
      } else {
        const { error } = await supabase.from('plans').insert([planData])

        if (error) throw error
      }

      resetForm()
      fetchPlans()
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('保存に失敗しました')
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      base_price: plan.base_price.toString(),
      description: plan.description || '',
      category: plan.category || '',
      sort_order: plan.sort_order.toString(),
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('本当に削除しますか?')) return

    try {
      const { error } = await supabase.from('plans').delete().eq('id', id)

      if (error) throw error
      fetchPlans()
    } catch (error) {
      console.error('Error deleting plan:', error)
      alert('削除に失敗しました')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      base_price: '',
      description: '',
      category: '',
      sort_order: '0',
    })
    setEditingPlan(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">プラン管理</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'キャンセル' : '+ 新規プラン'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingPlan ? 'プラン編集' : '新規プラン作成'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プラン名
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
                基本料金
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                className="input-field"
                value={formData.base_price}
                onChange={(e) =>
                  setFormData({ ...formData, base_price: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                カテゴリ
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="例: 七五三、成人式"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
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
                {editingPlan ? '更新' : '作成'}
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
                プラン名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                料金
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                カテゴリ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                表示順
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map((plan) => (
              <tr key={plan.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {plan.name}
                  </div>
                  {plan.description && (
                    <div className="text-sm text-gray-500">
                      {plan.description}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatPrice(plan.base_price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {plan.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {plan.sort_order}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
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
