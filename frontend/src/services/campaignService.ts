import { supabase } from '../lib/supabase'
import type {
  Campaign,
  CampaignShootingAssociation,
  CampaignProductAssociation,
  CampaignItemAssociation,
  CreateCampaign,
  UpdateCampaign,
  CampaignAssociations,
  CampaignWithAssociations,
} from '../types/campaign'

// ==================== Campaign CRUD ====================

export async function getCampaigns(shopId: number): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getCampaign(id: number): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function createCampaign(campaign: CreateCampaign): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .insert(campaign)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateCampaign(id: number, campaign: UpdateCampaign): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .update(campaign)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteCampaign(id: number): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ==================== Campaign Associations ====================

// 撮影カテゴリとの関連
export async function getCampaignShootingAssociations(
  campaignId: number
): Promise<CampaignShootingAssociation[]> {
  const { data, error } = await supabase
    .from('campaign_shooting_associations')
    .select('*')
    .eq('campaign_id', campaignId)

  if (error) throw error
  return data || []
}

// 商品カテゴリとの関連
export async function getCampaignProductAssociations(
  campaignId: number
): Promise<CampaignProductAssociation[]> {
  const { data, error } = await supabase
    .from('campaign_product_associations')
    .select('*')
    .eq('campaign_id', campaignId)

  if (error) throw error
  return data || []
}

// アイテムとの関連
export async function getCampaignItemAssociations(
  campaignId: number
): Promise<CampaignItemAssociation[]> {
  const { data, error } = await supabase
    .from('campaign_item_associations')
    .select('*')
    .eq('campaign_id', campaignId)

  if (error) throw error
  return data || []
}

// ==================== 複合クエリ ====================

/**
 * キャンペーンとその関連データを一括取得
 */
export async function getCampaignWithAssociations(
  campaignId: number
): Promise<CampaignWithAssociations | null> {
  const campaign = await getCampaign(campaignId)
  if (!campaign) return null

  const [shootingAssocs, productAssocs, itemAssocs] = await Promise.all([
    getCampaignShootingAssociations(campaignId),
    getCampaignProductAssociations(campaignId),
    getCampaignItemAssociations(campaignId),
  ])

  return {
    ...campaign,
    associations: {
      shooting_category_ids: shootingAssocs.map((a) => a.shooting_category_id),
      product_category_ids: productAssocs.map((a) => a.product_category_id),
      item_ids: itemAssocs.map((a) => a.item_id),
    },
  }
}

/**
 * キャンペーンの関連付けを一括更新
 */
export async function updateCampaignAssociations(
  campaignId: number,
  associations: CampaignAssociations
): Promise<void> {
  // 既存の関連をすべて削除
  const [deleteShootingResult, deleteProductResult, deleteItemResult] = await Promise.all([
    supabase.from('campaign_shooting_associations').delete().eq('campaign_id', campaignId),
    supabase.from('campaign_product_associations').delete().eq('campaign_id', campaignId),
    supabase.from('campaign_item_associations').delete().eq('campaign_id', campaignId),
  ])

  if (deleteShootingResult.error) throw deleteShootingResult.error
  if (deleteProductResult.error) throw deleteProductResult.error
  if (deleteItemResult.error) throw deleteItemResult.error

  // 新しい関連を作成
  if (associations.shooting_category_ids.length > 0) {
    const shootingAssocs = associations.shooting_category_ids.map((id) => ({
      campaign_id: campaignId,
      shooting_category_id: id,
    }))
    const { error } = await supabase.from('campaign_shooting_associations').insert(shootingAssocs)
    if (error) throw error
  }

  if (associations.product_category_ids.length > 0) {
    const productAssocs = associations.product_category_ids.map((id) => ({
      campaign_id: campaignId,
      product_category_id: id,
    }))
    const { error } = await supabase.from('campaign_product_associations').insert(productAssocs)
    if (error) throw error
  }

  if (associations.item_ids.length > 0) {
    const itemAssocs = associations.item_ids.map((id) => ({
      campaign_id: campaignId,
      item_id: id,
    }))
    const { error } = await supabase.from('campaign_item_associations').insert(itemAssocs)
    if (error) throw error
  }
}

/**
 * キャンペーン作成と関連付けを同時に行う
 */
export async function createCampaignWithAssociations(
  campaign: CreateCampaign,
  associations: CampaignAssociations
): Promise<CampaignWithAssociations> {
  const newCampaign = await createCampaign(campaign)
  await updateCampaignAssociations(newCampaign.id, associations)

  return {
    ...newCampaign,
    associations,
  }
}
