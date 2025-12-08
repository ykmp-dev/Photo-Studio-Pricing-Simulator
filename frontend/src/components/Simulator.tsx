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

  // カラフルなカード枠線用の色をサイクル
  const getCardClass = (index: number) => {
    const classes = ['card-blue', 'card-pink', 'card-green']
    return classes[index % classes.length]
  }

  return (
    <div className="min-h-screen bg-ivory-500">
      <Header />

      {/* Hero Section */}
      <section className="relative py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="diamond-icon mx-auto mb-6"></div>
          <h1 className="section-title text-gray-800 mb-4">
            WEB仮予約フォーム
          </h1>
          <div className="accent-line"></div>
          <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-2xl mx-auto">
            ご希望の撮影メニューをお選びください。
          </p>
        </div>
      </section>

      {/* Campaign Section */}
      {activeCampaigns.length > 0 && (
        <section className="py-12 bg03-pattern">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="diamond-icon mx-auto mb-6"></div>
            <h2 className="section-subtitle text-center text-gray-800 mb-8">
              イベント・キャンペーン
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCampaigns.map((campaign, index) => (
                <div
                  key={campaign.id}
                  className={`${getCardClass(index)} hover:shadow-xl transition-all duration-300`}
                >
                  <h3 className="text-lg font-bold text-navy-700 mb-3">
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    期間: {campaign.start_date} 〜 {campaign.end_date}
                  </p>
                  <p className="text-xl font-bold text-blue-600 mt-3">
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
      <section className="py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Selection */}
          {categories.length > 0 && (
            <div className="mb-10">
              <div className="diamond-icon mx-auto mb-6"></div>
              <h2 className="section-subtitle text-center text-gray-800 mb-6">撮影メニュー</h2>
              <div className="flex flex-wrap justify-center gap-4">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category)
                      setSelectedPlan(null)
                    }}
                    className={`px-8 py-4 rounded-md-japanese font-semibold transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-blue-500 border-2 border-blue-500 hover:bg-blue-50 shadow-md'
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
            <h2 className="section-subtitle text-center mb-6">料金のご案内</h2>
            <div className="space-y-4">
              {filteredPlans.map((plan, index) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-xl ${
                    selectedPlan?.id === plan.id
                      ? getCardClass(index) + ' scale-[1.02]'
                      : 'card'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-bold text-navy-700 mb-2">
                        {plan.name}
                      </h3>
                      {plan.description && (
                        <p className="text-gray-600 leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500 mb-1">料金</div>
                      <p className="text-3xl md:text-4xl font-bold text-blue-600">
                        {formatPrice(plan.base_price)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">（税込）</p>
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
                        <h3 className="text-xl font-bold text-navy-700 mb-4 pb-2 border-b-2 border-blue-300">
                          {categoryLabels[category] || category}
                        </h3>
                        <div className="space-y-3">
                          {categoryOptions.map((option) => {
                            const isSelected = selectedOptions.some((o) => o.id === option.id)
                            return (
                              <label
                                key={option.id}
                                className={`cursor-pointer transition-all duration-300 flex items-start hover:shadow-lg ${
                                  isSelected
                                    ? 'card-blue'
                                    : 'card'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleOptionToggle(option)}
                                  className="w-6 h-6 text-blue-600 rounded-sm-japanese focus:ring-blue-500 mt-1"
                                />
                                <div className="ml-4 flex-1">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                      <span className="font-bold text-lg text-navy-700 block mb-1">
                                        {option.name}
                                      </span>
                                      {option.description && (
                                        <p className="text-sm text-gray-600">
                                          {option.description}
                                        </p>
                                      )}
                                    </div>
                                    <span className="text-2xl font-bold text-blue-600 whitespace-nowrap">
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
        <div className="sticky bottom-0 bg-white border-t-4 border-blue-500 shadow-2xl z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-ivory-100 rounded-md-japanese p-6 md:p-8 border-2 border-gray-200">
              <h2 className="text-2xl md:text-3xl font-bold text-navy-700 mb-6 text-center">
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
                <div className="flex justify-between text-gray-700 pb-2 border-b border-gray-300">
                  <span>小計</span>
                  <span className="font-semibold">{formatPrice(priceCalculation.subtotal)}</span>
                </div>
                {priceCalculation.discount > 0 && (
                  <div className="flex justify-between text-red-600 font-semibold pb-2 border-b border-gray-300">
                    <span>割引</span>
                    <span>-{formatPrice(priceCalculation.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700 pb-2 border-b border-gray-300">
                  <span>消費税（10%）</span>
                  <span className="font-semibold">{formatPrice(priceCalculation.tax)}</span>
                </div>
              </div>

              <div className="pt-6 border-t-2 border-blue-500 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-2xl md:text-3xl font-bold text-navy-700">合計金額</span>
                  <span className="text-4xl md:text-5xl font-bold text-blue-600">
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
