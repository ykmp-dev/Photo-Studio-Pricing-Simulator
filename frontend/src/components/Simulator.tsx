import { useState, useMemo } from 'react'
import { Plan, Option, Campaign } from '../types'
import { calculatePrice, formatPrice } from '../utils/priceCalculator'

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
    <div className="min-h-screen bg-ivory-500 japanese-pattern-bg">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-ivory-300 to-ivory-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="section-title text-navy-600 mb-4">
            料金シミュレーター
          </h1>
          <div className="accent-line"></div>
          <p className="text-lg md:text-xl text-navy-500 leading-relaxed max-w-2xl mx-auto">
            撮影プランとオプションを選択して、<br className="hidden sm:inline" />
            お見積もり料金をご確認いただけます
          </p>
        </div>
      </section>

      {/* Campaign Section */}
      {activeCampaigns.length > 0 && (
        <section className="py-12 bg-navy-600 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              開催中のキャンペーン
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {activeCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="bg-white rounded-md-japanese p-6 shadow-lg border-2 border-ivory-500"
                >
                  <h3 className="text-xl font-bold text-navy-600 mb-2">
                    {campaign.name}
                  </h3>
                  <p className="text-navy-500 mb-3">
                    期間: {campaign.start_date} 〜 {campaign.end_date}
                  </p>
                  <p className="text-2xl font-bold text-navy-600">
                    {campaign.discount_type === 'percentage'
                      ? `${campaign.discount_value}% OFF`
                      : `${formatPrice(campaign.discount_value)} 引き`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Section */}
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Selection */}
          {categories.length > 0 && (
            <div className="mb-10">
              <h2 className="section-subtitle text-center mb-6">撮影メニュー</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category)
                      setSelectedPlan(null)
                    }}
                    className={`px-8 py-4 rounded-md-japanese font-semibold transition-all duration-300 shadow-md ${
                      selectedCategory === category
                        ? 'bg-navy-600 text-white shadow-lg scale-105'
                        : 'bg-white text-navy-600 border-2 border-navy-300 hover:border-navy-600 hover:shadow-lg'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Plan Selection */}
          <div className="mb-10">
            <h2 className="section-subtitle text-center mb-6">撮影プラン</h2>
            <div className="space-y-4">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`card-white cursor-pointer transition-all duration-300 ${
                    selectedPlan?.id === plan.id
                      ? 'border-4 border-navy-600 shadow-xl scale-[1.02]'
                      : 'border-2 border-ivory-600 hover:border-navy-400 hover:shadow-lg'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-navy-600 mb-2">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-navy-500 leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-navy-400 mb-1">基本料金</div>
                      <p className="text-3xl md:text-4xl font-bold text-navy-600">
                        {formatPrice(plan.base_price)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Options Selection */}
          {selectedPlan && (
            <div className="mb-10">
              <h2 className="section-subtitle text-center mb-6">オプション</h2>
              <div className="space-y-8">
                {Object.entries(groupedOptions).map(
                  ([category, categoryOptions]) =>
                    categoryOptions.length > 0 && (
                      <div key={category}>
                        <h3 className="text-xl font-bold text-navy-600 mb-4 pb-2 border-b-2 border-navy-200">
                          {categoryLabels[category] || category}
                        </h3>
                        <div className="space-y-3">
                          {categoryOptions.map((option) => {
                            const isSelected = selectedOptions.some((o) => o.id === option.id)
                            return (
                              <label
                                key={option.id}
                                className={`card-white cursor-pointer transition-all duration-300 flex items-start ${
                                  isSelected
                                    ? 'border-3 border-navy-600 bg-navy-50'
                                    : 'border border-ivory-600 hover:border-navy-400 hover:shadow-md'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleOptionToggle(option)}
                                  className="w-6 h-6 text-navy-600 rounded-sm-japanese focus:ring-navy-500 mt-1"
                                />
                                <div className="ml-4 flex-1">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                      <span className="font-bold text-lg text-navy-600 block mb-1">
                                        {option.name}
                                      </span>
                                      {option.description && (
                                        <p className="text-sm text-navy-500">
                                          {option.description}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-2xl font-bold text-navy-600 whitespace-nowrap">
                                      {formatPrice(option.price)}
                                    </span>
                                  </div>
                                </div>
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
      </section>

      {/* Price Summary - Sticky */}
      {selectedPlan && (
        <div className="sticky bottom-0 bg-ivory-200 border-t-4 border-navy-600 shadow-2xl z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-md-japanese p-6 md:p-8 shadow-xl border-2 border-navy-200">
              <h2 className="text-2xl md:text-3xl font-bold text-navy-600 mb-6 text-center">
                お見積もり
              </h2>

              {priceCalculation.appliedCampaign && (
                <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-300 rounded-md-japanese">
                  <p className="text-center font-bold text-orange-800">
                    ✨ キャンペーン適用中: {priceCalculation.appliedCampaign.name}
                  </p>
                </div>
              )}

              <div className="space-y-3 mb-6 text-lg">
                <div className="flex justify-between text-navy-600 pb-2 border-b border-ivory-400">
                  <span>小計</span>
                  <span className="font-semibold">{formatPrice(priceCalculation.subtotal)}</span>
                </div>
                {priceCalculation.discount > 0 && (
                  <div className="flex justify-between text-red-600 font-semibold pb-2 border-b border-ivory-400">
                    <span>割引</span>
                    <span>-{formatPrice(priceCalculation.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-navy-600 pb-2 border-b border-ivory-400">
                  <span>消費税（10%）</span>
                  <span className="font-semibold">{formatPrice(priceCalculation.tax)}</span>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-navy-600 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl md:text-3xl font-bold text-navy-600">合計金額</span>
                  <span className="text-4xl md:text-5xl font-bold text-navy-600">
                    {formatPrice(priceCalculation.total)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={handleReset} className="btn-secondary w-full">
                  リセット
                </button>
                <button className="btn-primary w-full">
                  予約はこちら
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
