import { Router } from 'express'
import { supabase } from '../lib/supabase.js'

const router = Router()

// GET /api/simulator?shop=:shopId
// Public endpoint to fetch all simulator data for a shop
router.get('/', async (req, res) => {
  try {
    const shopId = req.query.shop || '1'

    // Fetch plans
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (plansError) throw plansError

    // Fetch options
    const { data: options, error: optionsError } = await supabase
      .from('options')
      .select('*')
      .eq('shop_id', shopId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (optionsError) throw optionsError

    // Fetch active campaigns with plan associations
    const { data: campaigns, error: campaignsError } = await supabase
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
    const processedCampaigns = campaigns?.map((campaign: any) => ({
      ...campaign,
      plan_ids: campaign.campaign_plan_associations?.map((assoc: any) => assoc.plan_id) || [],
    })) || []

    res.json({
      plans: plans || [],
      options: options || [],
      campaigns: processedCampaigns,
    })
  } catch (error: any) {
    console.error('Error fetching simulator data:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch data' })
  }
})

export default router
