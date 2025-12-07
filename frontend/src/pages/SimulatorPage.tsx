import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Simulator from '../components/Simulator'
import { Plan, Option, Campaign } from '../types'
import { supabase } from '../lib/supabase'

export default function SimulatorPage() {
  const [searchParams] = useSearchParams()
  const shopId = searchParams.get('shop') || import.meta.env.VITE_DEFAULT_SHOP_ID || '1'

  const [plans, setPlans] = useState<Plan[]>([])
  const [options, setOptions] = useState<Option[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [shopId])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (plansError) throw plansError

      // Fetch options
      const { data: optionsData, error: optionsError } = await supabase
        .from('options')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (optionsError) throw optionsError

      // Fetch active campaigns with plan associations
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_plan_associations (
            plan_id
          )
        `)
        .eq('shop_id', shopId)
        .eq('is_active', true)

      if (campaignsError) throw campaignsError

      // Process campaigns to include plan_ids
      const processedCampaigns = campaignsData?.map((campaign: any) => ({
        ...campaign,
        plan_ids: campaign.campaign_plan_associations?.map((assoc: any) => assoc.plan_id) || [],
      })) || []

      setPlans(plansData || [])
      setOptions(optionsData || [])
      setCampaigns(processedCampaigns)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('データの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="card max-w-md">
          <p className="text-red-600">{error}</p>
          <button onClick={fetchData} className="btn-primary mt-4">
            再試行
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Simulator plans={plans} options={options} campaigns={campaigns} />
    </div>
  )
}
