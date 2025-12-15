import { useState, useEffect, useMemo } from 'react'
import type { ShootingCategory, ProductCategoryWithItems, Item } from '../types/category'
import type { CampaignWithAssociations } from '../types/campaign'
import type { FormSchemaWithBlocks } from '../types/formBuilder'
import { calculateSimulatorPrice } from '../services/simulatorService'
import { getFormByShootingCategory } from '../services/formBuilderService'
import { getShootingCategories, getProductCategories, getItems } from '../services/categoryService'
import { getCampaigns, getCampaignWithAssociations } from '../services/campaignService'
import { formatPrice } from '../utils/priceCalculator'
import Header from './Header'
import Footer from './Footer'

export default function SimulatorNew() {
  const shopId = 1 // TODO: Get from config or context

  const [shootingCategories, setShootingCategories] = useState<ShootingCategory[]>([])
  const [allProductCategories, setAllProductCategories] = useState<ProductCategoryWithItems[]>([])
  const [campaigns, setCampaigns] = useState<CampaignWithAssociations[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedShootingId, setSelectedShootingId] = useState<number | null>(null)
  const [selectedItems, setSelectedItems] = useState<
    Array<Item & { shooting_category_id: number }>
  >([])
  const [formSchema, setFormSchema] = useState<FormSchemaWithBlocks | null>(null)
  // Yes/No answers: Map<block_id, 'yes' | 'no' | null>
  const [yesNoAnswers, setYesNoAnswers] = useState<Map<number, 'yes' | 'no' | null>>(new Map())
  // Choice answers: Map<block_id, option.value>
  const [choiceAnswers, setChoiceAnswers] = useState<Map<number, string>>(new Map())

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // すべての商品カテゴリとアイテムを取得
      const [shootingCats, productCats, campaignsData] = await Promise.all([
        getShootingCategories(shopId),
        getProductCategories(shopId),
        getCampaigns(shopId),
      ])

      // 各商品カテゴリのアイテムを取得
      const productCategoriesWithItems = await Promise.all(
        productCats.map(async (category) => {
          const items = await getItems(shopId, category.id)
          return {
            ...category,
            items,
          }
        })
      )

      // アクティブなキャンペーンの関連付けを取得
      const activeCampaigns = campaignsData.filter((c) => c.is_active)
      const campaignsWithAssociations: CampaignWithAssociations[] = await Promise.all(
        activeCampaigns.map((c) => getCampaignWithAssociations(c.id))
      ).then((results) => results.filter((r): r is CampaignWithAssociations => r !== null))

      setShootingCategories(shootingCats)
      setAllProductCategories(productCategoriesWithItems)
      setCampaigns(campaignsWithAssociations)
    } catch (err) {
      console.error('データの読み込みに失敗しました:', err)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // 選択された撮影カテゴリ
  const selectedShooting = useMemo(() => {
    return shootingCategories.find((s) => s.id === selectedShootingId) || null
  }, [shootingCategories, selectedShootingId])

  // 撮影カテゴリ選択時にフォームを読み込み
  useEffect(() => {
    if (selectedShootingId) {
      loadForm(selectedShootingId)
      setYesNoAnswers(new Map()) // Yes/No回答をリセット
      setChoiceAnswers(new Map()) // Choice回答をリセット
    } else {
      setFormSchema(null)
      setYesNoAnswers(new Map())
      setChoiceAnswers(new Map()) // Choice回答をリセット
    }
  }, [selectedShootingId])

  const loadForm = async (shootingCategoryId: number) => {
    try {
      const form = await getFormByShootingCategory(shopId, shootingCategoryId)
      setFormSchema(form)
    } catch (err) {
      console.error('フォームの読み込みに失敗しました:', err)
      setFormSchema(null)
    }
  }

  // Choice ブロックで選択された料金の合計
  const choiceTotalPrice = useMemo(() => {
    if (!formSchema) return 0

    let total = 0
    formSchema.blocks.forEach((block) => {
      if (block.block_type === 'choice') {
        const selectedValue = choiceAnswers.get(block.id)
        if (selectedValue) {
          const options = block.metadata?.choice_options || []
          const selectedOption = options.find((opt) => opt.value === selectedValue)
          if (selectedOption) {
            total += selectedOption.price
          }
        }
      }
    })
    return total
  }, [formSchema, choiceAnswers])

  // 価格計算
  const priceCalculation = useMemo(() => {
    const baseCalculation = calculateSimulatorPrice(selectedItems, campaigns)
    // Choice ブロックの料金を加算
    return {
      ...baseCalculation,
      total: baseCalculation.total + choiceTotalPrice,
    }
  }, [selectedItems, campaigns, choiceTotalPrice])

  const handleItemToggle = (item: Item, shootingCategoryId: number) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id)
      if (exists) {
        return prev.filter((i) => i.id !== item.id)
      } else {
        return [...prev, { ...item, shooting_category_id: shootingCategoryId }]
      }
    })
  }

  const handleReset = () => {
    setSelectedShootingId(null)
    setSelectedItems([])
    setYesNoAnswers(new Map())
    setChoiceAnswers(new Map())
  }

  const activeCampaigns = campaigns.filter((c) => c.is_active)

  if (loading) {
    return (
      <div className="min-h-screen bg-ivory-500 flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory-500">
      <Header />

      {/* Hero Section */}
      <section className="relative py-8 md:py-12 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="diamond-icon mx-auto mb-4"></div>
          <h1 className="section-title text-gray-800 mb-3">料金シミュレーション</h1>
          <div className="accent-line"></div>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-2xl mx-auto">
            ご希望の撮影メニューをお選びください。
          </p>
        </div>
      </section>

      {/* Campaign Section */}
      {activeCampaigns.length > 0 && (
        <section className="bg-gradient-to-r from-orange-50 via-yellow-50 to-orange-50 border-y border-orange-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span className="text-sm font-semibold text-gray-700">🎉 現在実施中のキャンペーン</span>
              {activeCampaigns.map((campaign, index) => (
                <div key={campaign.id} className="flex items-center gap-2">
                  {index > 0 && <span className="text-gray-300">|</span>}
                  <span className="text-sm text-gray-800">{campaign.name}</span>
                  <span className="text-sm font-bold text-orange-600">
                    {campaign.discount_type === 'percentage'
                      ? `${campaign.discount_value}% OFF`
                      : `${formatPrice(campaign.discount_value)}引き`}
                  </span>
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
            {/* Shooting Category Selection */}
            <div className="mb-6">
              <label className="block text-base font-semibold text-gray-800 mb-2">
                撮影メニューをお選びください
              </label>
              <select
                value={selectedShootingId || ''}
                onChange={(e) => {
                  setSelectedShootingId(e.target.value ? Number(e.target.value) : null)
                  setSelectedItems([])
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
              >
                <option value="">選択してください</option>
                {shootingCategories.map((shooting) => (
                  <option key={shooting.id} value={shooting.id}>
                    {shooting.display_name}
                  </option>
                ))}
              </select>
              {selectedShooting && selectedShooting.description && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                  <p className="text-sm text-gray-700">{selectedShooting.description}</p>
                </div>
              )}
            </div>

            {/* Form Blocks & Product Categories (Integrated) */}
            {selectedShootingId && formSchema && formSchema.blocks.length > 0 && (
              <div className="mb-6 space-y-4">
                {formSchema.blocks.map((block, index) => {
                  // Check show_condition - 条件が設定されている場合
                  if (block.show_condition) {
                    // yes_no型の条件チェック
                    if (block.show_condition.type === 'yes_no') {
                      const requiredAnswer = yesNoAnswers.get(block.show_condition.block_id)
                      if (requiredAnswer !== block.show_condition.value) {
                        return null
                      }
                    }
                    // choice型の条件チェック
                    else if (block.show_condition.type === 'choice') {
                      const requiredAnswer = choiceAnswers.get(block.show_condition.block_id)
                      if (requiredAnswer !== block.show_condition.value) {
                        return null
                      }
                    }
                    // show_conditionがある場合は、それだけで表示/非表示が決まるので、
                    // プログレッシブディスクロージャーは適用しない
                  } else {
                    // Progressive disclosure: show_conditionがなく、Yes/No/Choiceブロック以外の場合のみ適用
                    if (block.block_type !== 'yes_no' && block.block_type !== 'choice' && block.block_type !== 'heading' && block.block_type !== 'text') {
                      // このブロックより前のYes/No/Choiceブロックで未回答のものがあるか確認
                      const hasUnansweredQuestion = formSchema.blocks
                        .slice(0, index)
                        .some(prevBlock => {
                          if (prevBlock.block_type === 'yes_no') {
                            const answer = yesNoAnswers.get(prevBlock.id)
                            return answer === null || answer === undefined
                          }
                          if (prevBlock.block_type === 'choice') {
                            const answer = choiceAnswers.get(prevBlock.id)
                            return !answer
                          }
                          return false
                        })

                      if (hasUnansweredQuestion) {
                        return null // 前のYes/No/Choice質問に答えていない場合は非表示
                      }
                    }
                  }

                  // Yes/No block
                  if (block.block_type === 'yes_no') {
                    const currentAnswer = yesNoAnswers.get(block.id)
                    return (
                      <div key={block.id} className="border-2 border-blue-400 rounded-lg p-5 bg-blue-50 shadow-sm">
                        <p className="text-gray-800 font-semibold mb-4 text-lg">{block.content}</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setYesNoAnswers(prev => {
                                const newMap = new Map(prev)
                                newMap.set(block.id, 'yes')
                                return newMap
                              })
                            }}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                              currentAnswer === 'yes'
                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                : 'bg-white text-gray-700 hover:bg-blue-100 border-2 border-gray-300'
                            }`}
                          >
                            はい
                          </button>
                          <button
                            onClick={() => {
                              setYesNoAnswers(prev => {
                                const newMap = new Map(prev)
                                newMap.set(block.id, 'no')
                                return newMap
                              })
                            }}
                            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                              currentAnswer === 'no'
                                ? 'bg-blue-600 text-white shadow-md scale-105'
                                : 'bg-white text-gray-700 hover:bg-blue-100 border-2 border-gray-300'
                            }`}
                          >
                            いいえ
                          </button>
                        </div>
                      </div>
                    )
                  }

                  // Choice block
                  if (block.block_type === 'choice') {
                    const options = block.metadata?.choice_options || []
                    if (options.length === 0) {
                      return null
                    }

                    const currentAnswer = choiceAnswers.get(block.id)
                    const displayMode = block.metadata?.choice_display || 'auto'

                    // 表示方式の決定: auto の場合は選択肢数で判定
                    const useRadio = displayMode === 'radio' || (displayMode === 'auto' && options.length <= 3)

                    return (
                      <div key={block.id} className="border-2 border-purple-400 rounded-lg p-5 bg-purple-50 shadow-sm">
                        <p className="text-gray-800 font-semibold mb-4 text-lg">{block.content}</p>

                        {useRadio ? (
                          // ラジオボタン表示（2-3個）
                          <div className="space-y-3">
                            {options.map((option) => {
                              const isSelected = currentAnswer === option.value
                              return (
                                <label
                                  key={option.value}
                                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                                      : 'bg-white text-gray-700 border-gray-300 hover:bg-purple-100'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`choice-${block.id}`}
                                    value={option.value}
                                    checked={isSelected}
                                    onChange={() => {
                                      setChoiceAnswers(prev => {
                                        const newMap = new Map(prev)
                                        newMap.set(block.id, option.value)
                                        return newMap
                                      })
                                    }}
                                    className="mt-1 w-5 h-5 text-purple-600"
                                  />
                                  <div className="ml-3 flex-1">
                                    <div className="font-semibold">
                                      {option.label}
                                      {option.price > 0 && (
                                        <span className="ml-2">
                                          ({formatPrice(option.price)})
                                        </span>
                                      )}
                                    </div>
                                    {option.description && (
                                      <p className={`text-sm mt-1 ${isSelected ? 'text-purple-100' : 'text-gray-600'}`}>
                                        {option.description}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        ) : (
                          // ドロップダウン表示（4個以上）
                          <select
                            value={currentAnswer || ''}
                            onChange={(e) => {
                              const value = e.target.value
                              setChoiceAnswers(prev => {
                                const newMap = new Map(prev)
                                if (value) {
                                  newMap.set(block.id, value)
                                } else {
                                  newMap.delete(block.id)
                                }
                                return newMap
                              })
                            }}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-colors bg-white"
                          >
                            <option value="">選択してください</option>
                            {options.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                                {option.price > 0 && ` (${formatPrice(option.price)})`}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )
                  }

                  // Heading block
                  if (block.block_type === 'heading') {
                    return (
                      <div key={block.id}>
                        <h2 className="text-xl font-bold text-gray-800">
                          {block.content?.replace(/^##\s*/, '')}
                        </h2>
                      </div>
                    )
                  }

                  // Text block
                  if (block.block_type === 'text') {
                    return (
                      <div key={block.id} className="text-gray-700">
                        {block.content}
                      </div>
                    )
                  }

                  // List block
                  if (block.block_type === 'list') {
                    const items = block.content?.split('\n').filter((line) => line.trim()) || []
                    return (
                      <ul key={block.id} className="list-disc list-inside space-y-1 text-gray-700">
                        {items.map((item, index) => (
                          <li key={index}>{item.replace(/^-\s*/, '')}</li>
                        ))}
                      </ul>
                    )
                  }

                  // Category reference block
                  if (block.block_type === 'category_reference') {
                    if (!block.metadata?.product_category_id) {
                      return null
                    }

                    const productCategory = allProductCategories.find(
                      (pc) => pc.id === block.metadata.product_category_id
                    )

                    if (!productCategory) {
                      return null
                    }

                    return (
                      <div key={block.id}>
                        {block.content && (
                          <p className="text-sm text-gray-600 mb-2">{block.content}</p>
                        )}
                        <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                          <h3 className="text-sm font-semibold text-gray-700 mb-3 pb-2 border-b border-gray-300">
                            {productCategory.display_name}
                          </h3>
                          {productCategory.items.length === 0 ? (
                            <p className="text-sm text-gray-500 py-2">
                              このカテゴリにアイテムはありません
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {productCategory.items.map((item) => {
                                const isSelected = selectedItems.some((i) => i.id === item.id)
                                return (
                                  <label
                                    key={item.id}
                                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md transition-colors hover:bg-blue-50 cursor-pointer bg-white"
                                  >
                                    <div className="flex items-center flex-1">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() =>
                                          handleItemToggle(item, selectedShootingId || 0)
                                        }
                                        className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 mr-3"
                                      />
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium text-gray-800">
                                            {item.name}
                                          </span>
                                        </div>
                                        {item.description && (
                                          <span className="text-xs text-gray-500 block mt-1">
                                            {item.description}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-base font-semibold text-blue-600 ml-4">
                                      {formatPrice(item.price)}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Price Summary - Sticky Bottom */}
      {(selectedItems.length > 0 || choiceTotalPrice > 0) && (
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
              <button
                onClick={handleReset}
                className="px-4 py-3 border-2 border-gray-400 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
              >
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
