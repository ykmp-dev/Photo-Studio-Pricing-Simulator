import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Campaign, Plan } from '../../types'

interface CampaignManagerProps {
  shopId: number
}

export default function CampaignManager({ shopId }: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    plan_ids: [] as number[],
  })

  useEffect(() => {
    fetchData()
  }, [shopId])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_plan_associations (
            plan_id
          )
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })

      if (campaignsError) throw campaignsError

      // Process campaigns
      const processedCampaigns = campaignsData?.map((campaign: any) => ({
        ...campaign,
        plan_ids: campaign.campaign_plan_associations?.map((assoc: any) => assoc.plan_id) || [],
      })) || []

      setCampaigns(processedCampaigns)

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)

      if (plansError) throw plansError
      setPlans(plansData || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const campaignData = {
        shop_id: shopId,
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
      }

      let campaignId: number

      if (editingCampaign) {
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id)

        if (error) throw error
        campaignId = editingCampaign.id

        // Delete existing associations
        await supabase
          .from('campaign_plan_associations')
          .delete()
          .eq('campaign_id', campaignId)
      } else {
        const { data, error } = await supabase
          .from('campaigns')
          .insert([campaignData])
          .select()

        if (error) throw error
        campaignId = data[0].id
      }

      // Insert plan associations
      if (formData.plan_ids.length > 0) {
        const associations = formData.plan_ids.map((plan_id) => ({
          campaign_id: campaignId,
          plan_id,
        }))

        const { error } = await supabase
          .from('campaign_plan_associations')
          .insert(associations)

        if (error) throw error
      }

      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving campaign:', error)
      alert('保存に失敗しました')
    }
  }

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setFormData({
      name: campaign.name,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      discount_type: campaign.discount_type,
      discount_value: campaign.discount_value.toString(),
      plan_ids: campaign.plan_ids || [],
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('本当に削除しますか?')) return

    try {
      const { error } = await supabase.from('campaigns').delete().eq('id', id)

      if (error) throw error
      fetchData()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      alert('削除に失敗しました')
    }
  }

  const togglePlan = (planId: number) => {
    setFormData((prev) => ({
      ...prev,
      plan_ids: prev.plan_ids.includes(planId)
        ? prev.plan_ids.filter((id) => id !== planId)
        : [...prev.plan_ids, planId],
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      discount_type: 'percentage',
      discount_value: '',
      plan_ids: [],
    })
    setEditingCampaign(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-center py-8">読み込み中...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">キャンペーン管理</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'キャンセル' : '+ 新規キャンペーン'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCampaign ? 'キャンペーン編集' : '新規キャンペーン作成'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                キャンペーン名
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了日
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  割引タイプ
                </label>
                <select
                  className="input-field"
                  value={formData.discount_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_type: e.target.value as any,
                    })
                  }
                >
                  <option value="percentage">割合（%）</option>
                  <option value="fixed">固定額（¥）</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  割引値
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  className="input-field"
                  value={formData.discount_value}
                  onChange={(e) =>
                    setFormData({ ...formData, discount_value: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                適用プラン
              </label>
              <div className="space-y-2">
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className="flex items-center p-2 hover:bg-gray-50 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={formData.plan_ids.includes(plan.id)}
                      onChange={() => togglePlan(plan.id)}
                      className="w-4 h-4 text-primary-600 rounded"
                    />
                    <span className="ml-2 text-sm">{plan.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="btn-primary">
                {editingCampaign ? '更新' : '作成'}
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
                キャンペーン名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                期間
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                割引内容
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状態
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {campaign.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {campaign.start_date} 〜 {campaign.end_date}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {campaign.discount_type === 'percentage'
                    ? `${campaign.discount_value}%`
                    : `¥${campaign.discount_value.toLocaleString()}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      campaign.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {campaign.is_active ? '有効' : '無効'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(campaign)}
                    className="text-primary-600 hover:text-primary-900 mr-4"
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(campaign.id)}
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
