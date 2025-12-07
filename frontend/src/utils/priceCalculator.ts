import { Plan, Option, Campaign, PriceCalculation } from '../types'

export function calculatePrice(
  plan: Plan | null,
  selectedOptions: Option[],
  campaigns: Campaign[]
): PriceCalculation {
  if (!plan) {
    return {
      subtotal: 0,
      discount: 0,
      tax: 0,
      total: 0,
    }
  }

  // Calculate base price + options
  let subtotal = plan.base_price
  selectedOptions.forEach((option) => {
    subtotal += option.price
  })

  // Find applicable campaign
  const now = new Date()
  const applicableCampaign = campaigns.find((campaign) => {
    if (!campaign.is_active) return false

    const startDate = new Date(campaign.start_date)
    const endDate = new Date(campaign.end_date)

    if (now < startDate || now > endDate) return false

    // Check if campaign applies to this plan
    if (campaign.plan_ids && !campaign.plan_ids.includes(plan.id)) return false

    return true
  })

  // Apply discount
  let discount = 0
  if (applicableCampaign) {
    if (applicableCampaign.discount_type === 'percentage') {
      discount = Math.floor(subtotal * (applicableCampaign.discount_value / 100))
    } else {
      discount = applicableCampaign.discount_value
    }
  }

  const discountedPrice = subtotal - discount
  const tax = Math.floor(discountedPrice * 0.1)
  const total = discountedPrice + tax

  return {
    subtotal,
    discount,
    tax,
    total,
    appliedCampaign: applicableCampaign,
  }
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(price)
}
