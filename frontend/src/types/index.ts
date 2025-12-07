export interface Shop {
  id: number
  name: string
  owner_email: string
  created_at: string
}

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
  plan_ids?: number[]
}

export interface Plan {
  id: number
  shop_id: number
  name: string
  base_price: number
  description: string
  category: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Option {
  id: number
  shop_id: number
  name: string
  price: number
  category: 'hair' | 'makeup' | 'dressing' | 'photo_item'
  description: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface PriceCalculation {
  subtotal: number
  discount: number
  tax: number
  total: number
  appliedCampaign?: Campaign
}
