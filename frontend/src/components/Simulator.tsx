import { useState, useMemo } from 'react'
import { Plan, Option, Campaign } from '../types'
import { calculatePrice, formatPrice } from '../utils/priceCalculator'
import Header from './Header'
import Footer from './Footer'

interface SimulatorProps {
  plans: Plan[]
  options: Option[]
  campaigns: Campaign[]
}

export default function Simulator({ plans, options, campaigns }: SimulatorProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Option[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(plans.map((p) => p.category).filter(Boolean)))
    return cats
  }, [plans])

  // Filter plans by category
  const filteredPlans = useMemo(() => {
    if (!selectedCategory) return plans
    return plans.filter((p) => p.category === selectedCategory)
  }, [plans, selectedCategory])

  // Group options by category
  const groupedOptions = useMemo(() => {
    return {
      hair: options.filter((o) => o.category === 'hair'),
      makeup: options.filter((o) => o.category === 'makeup'),
      dressing: options.filter((o) => o.category === 'dressing'),
      photo_item: options.filter((o) => o.category === 'photo_item'),
    }
  }, [options])

  const priceCalculation = useMemo(() => {
    return calculatePrice(selectedPlan, selectedOptions, campaigns)
  }, [selectedPlan, selectedOptions, campaigns])

  const handleOptionToggle = (option: Option) => {
    setSelectedOptions((prev) => {
      const exists = prev.find((o) => o.id === option.id)
      if (exists) {
        return prev.filter((o) => o.id !== option.id)
      } else {
        return [...prev, option]
      }
    })
  }

  const handleReset = () => {
    setSelectedPlan(null)
    setSelectedOptions([])
    setSelectedCategory('')
  }

  const categoryLabels: Record<string, string> = {
    hair: 'ヘアセット',
    makeup: 'メイク',
    dressing: '着付',
    photo_item: 'フォトアイテム',
  }

  // Get active campaigns
  const activeCampaigns = campaigns.filter((c) => c.is_active)

  return (
    <div className="min-h-screen bg-ivory-500">
      <Header />

      {/* Hero Section */}
      <section className="relative py-8 md:py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="diamond-icon mx-auto mb-4"></div>
          <h1 className="section-title text-gray-800 mb-3">
            料金シミュレーション
          </h1>
          <div className="accent-line"></div>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            ご希望の撮影メニューをお選びください。
          </p>
        </div>
      </section>

      {/* Campaign Section */}
      {activeCampaigns.length > 0 && (
        <section className="py-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-y border-orange-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-2">
              {activeCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-orange-300 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🎉</span>
                    <div>
                      <h3 className="text-sm font-bold text-gray-800">
                        {campaign.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {campaign.start_date} 〜 {campaign.end_date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-orange-600">
                      {campaign.discount_type === 'percentage'
                        ? `${campaign.discount_value}% OFF`
                        : `${formatPrice(campaign.discount_value)} 引き`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Section */}
      <section className="py-6 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Category Selection */}
            {categories.length > 0 && (
              <div className="mb-6">
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  撮影メニューをお選びください
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setSelectedPlan(null)
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                >
                  <option value="">選択してください</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Plan Selection */}
            {selectedCategory && filteredPlans.length > 0 && (
              <div className="mb-6">
                <label className="block text-base font-semibold text-gray-800 mb-2">
                  撮影コースをお選びください
                </label>
                <select
                  value={selectedPlan?.id || ''}
                  onChange={(e) => {
                    const plan = filteredPlans.find(p => p.id === Number(e.target.value))
                    setSelectedPlan(plan || null)
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                >
                  <option value="">選択してください</option>
                  {filteredPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - {formatPrice(plan.base_price)}
                    </option>
                  ))}
                </select>

                {/* Selected Plan Details */}
                {selectedPlan && selectedPlan.description && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                    <p className="text-sm text-gray-700">{selectedPlan.description}</p>
                  </div>
                )}
              </div>
            )}

            {/* Options Selection */}
            {selectedPlan && (
              <div className="mb-6">
                <label className="block text-base font-semibold text-gray-800 mb-3">
                  オプション（複数選択可）
                </label>
                <div className="space-y-4">
                  {Object.entries(groupedOptions).map(
                    ([category, categoryOptions]) =>
                      categoryOptions.length > 0 && (
                        <div key={category}>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2 pb-1 border-b border-gray-300">
                            {categoryLabels[category] || category}
                          </h3>
                          <div className="space-y-2">
                            {categoryOptions.map((option) => {
                              const isSelected = selectedOptions.some((o) => o.id === option.id)
                              return (
                                <label
                                  key={option.id}
                                  className="flex items-center justify-between p-3 border border-gray-200 rounded-md hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center flex-1">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleOptionToggle(option)}
                                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mr-3"
                                    />
                                    <div className="flex-1">
                                      <span className="font-medium text-gray-800 block">
                                        {option.name}
                                      </span>
                                      {option.description && (
                                        <span className="text-xs text-gray-500">
                                          {option.description}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-base font-semibold text-blue-600 ml-4">
                                    {formatPrice(option.price)}
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Price Summary - Sticky Bottom */}
      {selectedPlan && (
        <div className="sticky bottom-0 bg-white border-t-2 border-blue-300 shadow-xl z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {priceCalculation.appliedCampaign && (
              <div className="mb-3 text-center">
                <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                  ✨ {priceCalculation.appliedCampaign.name}
                </span>
              </div>
            )}

            <div className="border-t-2 border-blue-400 pt-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">合計</span>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(priceCalculation.total)}
                  </div>
                  <div className="text-xs text-gray-500">（税込）</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleReset} className="px-4 py-3 border-2 border-gray-400 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors">
                リセット
              </button>
              <button className="px-4 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
                ご予約はこちら
              </button>
            </div>

            <p className="text-xs text-center text-gray-500 mt-3">
              ※撮影する家族の人数や衣装、キャンペーン適用などで金額が異なる場合がございます。
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
