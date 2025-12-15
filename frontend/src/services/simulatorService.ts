import type { CampaignWithAssociations } from '../types/campaign'
import { getCampaigns, getCampaignWithAssociations } from './campaignService'
import { getAllCategoryStructure } from './categoryService'

/**
 * シミュレーター用の完全なデータを取得
 */
export async function getSimulatorData(shopId: number) {
  // カテゴリ構造とキャンペーンを並行取得
  const [categoryStructure, campaigns] = await Promise.all([
    getAllCategoryStructure(shopId),
    getCampaigns(shopId),
  ])

  // アクティブなキャンペーンの関連付けを取得
  const activeCampaigns = campaigns.filter((c) => c.is_active)
  const campaignsWithAssociations: CampaignWithAssociations[] = await Promise.all(
    activeCampaigns.map((c) => getCampaignWithAssociations(c.id))
  ).then((results) => results.filter((r): r is CampaignWithAssociations => r !== null))

  return {
    categoryStructure,
    campaigns: campaignsWithAssociations,
  }
}

/**
 * 選択されたアイテムに適用可能なキャンペーンを検索
 */
export function findApplicableCampaign(
  selectedItems: { id: number; product_category_id: number; shooting_category_id: number }[],
  campaigns: CampaignWithAssociations[]
): CampaignWithAssociations | undefined {
  const now = new Date()

  return campaigns.find((campaign) => {
    // 有効性チェック
    if (!campaign.is_active) return false

    // 期間チェック
    const startDate = new Date(campaign.start_date)
    const endDate = new Date(campaign.end_date)
    if (now < startDate || now > endDate) return false

    // 選択されたアイテムがキャンペーン対象かチェック
    const hasMatchingItem = selectedItems.some((item) => {
      // アイテム直接指定
      if (campaign.associations.item_ids.includes(item.id)) {
        return true
      }

      // 商品カテゴリ指定
      if (campaign.associations.product_category_ids.includes(item.product_category_id)) {
        return true
      }

      // 撮影カテゴリ指定
      if (campaign.associations.shooting_category_ids.includes(item.shooting_category_id)) {
        return true
      }

      return false
    })

    return hasMatchingItem
  })
}

/**
 * 価格計算（税込表示）
 */
export function calculateSimulatorPrice(
  selectedItems: { id: number; price: number; product_category_id: number; shooting_category_id: number }[],
  campaigns: CampaignWithAssociations[]
) {
  // 小計（税込）- アイテム価格は税込前提
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0)

  // 適用可能なキャンペーン検索
  const appliedCampaign = findApplicableCampaign(selectedItems, campaigns)

  // 割引計算
  let discount = 0
  if (appliedCampaign) {
    if (appliedCampaign.discount_type === 'percentage') {
      discount = Math.floor(subtotal * (appliedCampaign.discount_value / 100))
    } else {
      discount = appliedCampaign.discount_value
    }
  }

  // 合計（税込）
  const total = subtotal - discount

  return {
    subtotal,
    discount,
    total,
    appliedCampaign,
  }
}
