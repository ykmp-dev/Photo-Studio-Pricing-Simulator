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

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          料金シミュレーター
        </h1>
        <p className="text-gray-600">
          撮影プランとオプションを選択して、料金を確認できます
        </p>
      </div>

      {/* Category Selection */}
      {categories.length > 0 && (
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">撮影メニュー</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category)
                  setSelectedPlan(null)
                }}
                className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plan Selection */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">撮影プラン</h2>
        <div className="space-y-3">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedPlan?.id === plan.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  {plan.description && (
                    <p className="text-gray-600 text-sm mt-1">{plan.description}</p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-primary-600">
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
        <div className="card mb-6">
          <h2 className="text-xl font-semibold mb-4">オプション</h2>
          <div className="space-y-6">
            {Object.entries(groupedOptions).map(
              ([category, categoryOptions]) =>
                categoryOptions.length > 0 && (
                  <div key={category}>
                    <h3 className="font-semibold text-gray-700 mb-3">
                      {categoryLabels[category] || category}
                    </h3>
                    <div className="space-y-2">
                      {categoryOptions.map((option) => {
                        const isSelected = selectedOptions.some((o) => o.id === option.id)
                        return (
                          <label
                            key={option.id}
                            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleOptionToggle(option)}
                              className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{option.name}</span>
                                <span className="text-primary-600 font-semibold">
                                  {formatPrice(option.price)}
                                </span>
                              </div>
                              {option.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {option.description}
                                </p>
                              )}
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

      {/* Price Summary */}
      {selectedPlan && (
        <div className="card bg-gradient-to-br from-primary-50 to-white sticky bottom-4 shadow-lg border-2 border-primary-200">
          <h2 className="text-xl font-semibold mb-4">料金</h2>

          {priceCalculation.appliedCampaign && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-semibold text-yellow-800">
                🎉 キャンペーン適用中: {priceCalculation.appliedCampaign.name}
              </p>
            </div>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-700">
              <span>小計</span>
              <span>{formatPrice(priceCalculation.subtotal)}</span>
            </div>
            {priceCalculation.discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>割引</span>
                <span>-{formatPrice(priceCalculation.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700">
              <span>消費税（10%）</span>
              <span>{formatPrice(priceCalculation.tax)}</span>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-gray-300">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-semibold">合計金額</span>
              <span className="text-3xl font-bold text-primary-600">
                {formatPrice(priceCalculation.total)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleReset} className="btn-secondary">
                リセット
              </button>
              <button className="btn-primary">予約はこちら</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
