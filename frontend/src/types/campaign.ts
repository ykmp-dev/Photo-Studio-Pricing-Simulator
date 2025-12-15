// キャンペーン関連の型定義

export interface Campaign {
  id: number
  shop_id: number
  name: string
  start_date: string
  end_date: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// キャンペーン×撮影カテゴリ の関連
export interface CampaignShootingAssociation {
  id: number
  campaign_id: number
  shooting_category_id: number
  created_at: string
}

// キャンペーン×商品カテゴリ の関連
export interface CampaignProductAssociation {
  id: number
  campaign_id: number
  product_category_id: number
  created_at: string
}

// キャンペーン×アイテム の関連
export interface CampaignItemAssociation {
  id: number
  campaign_id: number
  item_id: number
  created_at: string
}

// 作成用の型
export interface CreateCampaign {
  shop_id: number
  name: string
  start_date: string
  end_date: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  is_active?: boolean
}

export interface UpdateCampaign {
  name?: string
  start_date?: string
  end_date?: string
  discount_type?: 'percentage' | 'fixed'
  discount_value?: number
  is_active?: boolean
}

// 関連付けデータ
export interface CampaignAssociations {
  shooting_category_ids: number[]
  product_category_ids: number[]
  item_ids: number[]
}

// キャンペーン全体データ（関連含む）
export interface CampaignWithAssociations extends Campaign {
  associations: CampaignAssociations
}
