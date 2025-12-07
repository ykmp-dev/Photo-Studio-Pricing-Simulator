import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateUser, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Apply authentication middleware to all admin routes
router.use(authenticateUser)

// ============================================
// Plans Management
// ============================================

// GET /api/admin/plans?shop=:shopId
router.get('/plans', async (req: AuthRequest, res) => {
  try {
    const shopId = req.query.shop

    if (!shopId) {
      return res.status(400).json({ error: 'shop parameter is required' })
    }

    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('shop_id', shopId)
      .order('sort_order', { ascending: true })

    if (error) throw error

    res.json(data || [])
  } catch (error: any) {
    console.error('Error fetching plans:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch plans' })
  }
})

// POST /api/admin/plans
router.post('/plans', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('plans')
      .insert([req.body])
      .select()

    if (error) throw error

    res.status(201).json(data[0])
  } catch (error: any) {
    console.error('Error creating plan:', error)
    res.status(500).json({ error: error.message || 'Failed to create plan' })
  }
})

// PUT /api/admin/plans/:id
router.put('/plans/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('plans')
      .update(req.body)
      .eq('id', id)
      .select()

    if (error) throw error

    res.json(data[0])
  } catch (error: any) {
    console.error('Error updating plan:', error)
    res.status(500).json({ error: error.message || 'Failed to update plan' })
  }
})

// DELETE /api/admin/plans/:id
router.delete('/plans/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('plans')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error: any) {
    console.error('Error deleting plan:', error)
    res.status(500).json({ error: error.message || 'Failed to delete plan' })
  }
})

// ============================================
// Options Management
// ============================================

// GET /api/admin/options?shop=:shopId
router.get('/options', async (req: AuthRequest, res) => {
  try {
    const shopId = req.query.shop

    if (!shopId) {
      return res.status(400).json({ error: 'shop parameter is required' })
    }

    const { data, error } = await supabaseAdmin
      .from('options')
      .select('*')
      .eq('shop_id', shopId)
      .order('category', { ascending: true })
      .order('sort_order', { ascending: true })

    if (error) throw error

    res.json(data || [])
  } catch (error: any) {
    console.error('Error fetching options:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch options' })
  }
})

// POST /api/admin/options
router.post('/options', async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('options')
      .insert([req.body])
      .select()

    if (error) throw error

    res.status(201).json(data[0])
  } catch (error: any) {
    console.error('Error creating option:', error)
    res.status(500).json({ error: error.message || 'Failed to create option' })
  }
})

// PUT /api/admin/options/:id
router.put('/options/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseAdmin
      .from('options')
      .update(req.body)
      .eq('id', id)
      .select()

    if (error) throw error

    res.json(data[0])
  } catch (error: any) {
    console.error('Error updating option:', error)
    res.status(500).json({ error: error.message || 'Failed to update option' })
  }
})

// DELETE /api/admin/options/:id
router.delete('/options/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('options')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error: any) {
    console.error('Error deleting option:', error)
    res.status(500).json({ error: error.message || 'Failed to delete option' })
  }
})

// ============================================
// Campaigns Management
// ============================================

// GET /api/admin/campaigns?shop=:shopId
router.get('/campaigns', async (req: AuthRequest, res) => {
  try {
    const shopId = req.query.shop

    if (!shopId) {
      return res.status(400).json({ error: 'shop parameter is required' })
    }

    const { data, error } = await supabaseAdmin
      .from('campaigns')
      .select(`
        *,
        campaign_plan_associations (
          plan_id
        )
      `)
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Process campaigns to include plan_ids
    const processedCampaigns = data?.map((campaign: any) => ({
      ...campaign,
      plan_ids: campaign.campaign_plan_associations?.map((assoc: any) => assoc.plan_id) || [],
    })) || []

    res.json(processedCampaigns)
  } catch (error: any) {
    console.error('Error fetching campaigns:', error)
    res.status(500).json({ error: error.message || 'Failed to fetch campaigns' })
  }
})

// POST /api/admin/campaigns
router.post('/campaigns', async (req: AuthRequest, res) => {
  try {
    const { plan_ids, ...campaignData } = req.body

    // Insert campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .insert([campaignData])
      .select()

    if (campaignError) throw campaignError

    const campaignId = campaign[0].id

    // Insert plan associations
    if (plan_ids && plan_ids.length > 0) {
      const associations = plan_ids.map((plan_id: number) => ({
        campaign_id: campaignId,
        plan_id,
      }))

      const { error: assocError } = await supabaseAdmin
        .from('campaign_plan_associations')
        .insert(associations)

      if (assocError) throw assocError
    }

    res.status(201).json({ ...campaign[0], plan_ids })
  } catch (error: any) {
    console.error('Error creating campaign:', error)
    res.status(500).json({ error: error.message || 'Failed to create campaign' })
  }
})

// PUT /api/admin/campaigns/:id
router.put('/campaigns/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params
    const { plan_ids, ...campaignData } = req.body

    // Update campaign
    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from('campaigns')
      .update(campaignData)
      .eq('id', id)
      .select()

    if (campaignError) throw campaignError

    // Delete existing associations
    await supabaseAdmin
      .from('campaign_plan_associations')
      .delete()
      .eq('campaign_id', id)

    // Insert new associations
    if (plan_ids && plan_ids.length > 0) {
      const associations = plan_ids.map((plan_id: number) => ({
        campaign_id: parseInt(id),
        plan_id,
      }))

      const { error: assocError } = await supabaseAdmin
        .from('campaign_plan_associations')
        .insert(associations)

      if (assocError) throw assocError
    }

    res.json({ ...campaign[0], plan_ids })
  } catch (error: any) {
    console.error('Error updating campaign:', error)
    res.status(500).json({ error: error.message || 'Failed to update campaign' })
  }
})

// DELETE /api/admin/campaigns/:id
router.delete('/campaigns/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params

    const { error } = await supabaseAdmin
      .from('campaigns')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.status(204).send()
  } catch (error: any) {
    console.error('Error deleting campaign:', error)
    res.status(500).json({ error: error.message || 'Failed to delete campaign' })
  }
})

export default router
