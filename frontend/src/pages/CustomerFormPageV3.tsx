import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getFormBuilderDataByShootingCategory } from '../services/formBuilderService'
import { convertFormBuilderToCustomerForm } from '../utils/formBuilderConverter'
import { filterVisibleCategories, hasTriggerSections } from '../utils/sectionLogic'
import { calculateTotalPrice } from '../utils/formHelpers'
import { formatPrice } from '../utils/priceCalculator'
import type { ProductCategoryV3, FormValues } from '../types/formV3'
import type { ShootingCategory, Item } from '../types/category'
import type { Campaign } from '../types/campaign'
import ProductCategorySection from '../components/customer/ProductCategorySection'
import Header from '../components/Header'
import Footer from '../components/Footer'

/**
 * v3仕様書: 顧客向けフォームページ
 * パターンA: Triggerあり（コース選択 → 条件評価 → 商品選択）
 * パターンB: Triggerなし（すぐに全商品選択）
 */
export default function CustomerFormPageV3() {
  const { shopId: shopIdParam } = useParams<{ shopId: string }>()
  // URLパラメータがない場合は環境変数から取得
  const shopId = shopIdParam || import.meta.env.VITE_SHOP_ID

  const [shootingCategories, setShootingCategories] = useState<ShootingCategory[]>([])
  const [selectedShootingCategoryId, setSelectedShootingCategoryId] = useState<number | null>(null)

  // キャンペーン
  const [campaigns, setCampaigns] = useState<Campaign[]>([])

  const [productCategories, setProductCategories] = useState<ProductCategoryV3[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])
  const [formMetadata, setFormMetadata] = useState<{
    heading_trigger?: string
    heading_conditional?: string
    heading_common_final?: string
  } | null>(null)

  const [formValues, setFormValues] = useState<FormValues>({})
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([])

  const [loading, setLoading] = useState(false)

  // フォームコンテンツへの参照（自動スクロール用）
  const formContentRef = useRef<HTMLDivElement>(null)

  // 撮影カテゴリ一覧を取得
  useEffect(() => {
    loadShootingCategories()
    loadCampaigns()
  }, [shopId])

  // 撮影カテゴリ変更時、商品カテゴリとアイテムを取得
  useEffect(() => {
    if (selectedShootingCategoryId) {
      loadFormData(selectedShootingCategoryId)
    }
  }, [selectedShootingCategoryId])

  // フォームデータ読み込み後、自動スクロール（ヘッダー分のオフセットを考慮）
  useEffect(() => {
    if (!loading && selectedShootingCategoryId && productCategories.length > 0 && formContentRef.current) {
      // 少し遅延させてからスクロール（レンダリング完了を待つ）
      setTimeout(() => {
        const element = formContentRef.current
        if (!element) return

        // ヘッダーの高さ（Header.tsxの高さ: 64px程度）を考慮
        const headerOffset = 80
        const elementPosition = element.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }, 100)
    }
  }, [loading, selectedShootingCategoryId, productCategories])

  const loadShootingCategories = async () => {
    if (!shopId) return

    try {
      const { data, error } = await supabase
        .from('shooting_categories')
        .select('*')
        .eq('shop_id', parseInt(shopId))
        .eq('is_active', true)
        .order('sort_order')

      if (error) throw error
      setShootingCategories(data || [])
    } catch (err) {
      console.error('撮影カテゴリの読み込みエラー:', err)
    }
  }

  const loadCampaigns = async () => {
    if (!shopId) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('shop_id', parseInt(shopId))
        .eq('is_active', true)
        .lte('start_date', today)
        .gte('end_date', today)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (err) {
      console.error('キャンペーンの読み込みエラー:', err)
    }
  }

  const loadFormData = async (shootingCategoryId: number) => {
    try {
      setLoading(true)

      if (!shopId) return

      // FormBuilderDataを取得
      const formBuilderRecord = await getFormBuilderDataByShootingCategory(
        parseInt(shopId),
        shootingCategoryId
      )

      if (!formBuilderRecord) {
        // FormBuilderデータが存在しない場合は空に
        setProductCategories([])
        setAllItems([])
        setFormMetadata(null)
        return
      }

      // FormBuilderDataをお客様向けフォーム用のデータに変換
      const { categories, items } = convertFormBuilderToCustomerForm(formBuilderRecord.form_data)

      setProductCategories(categories)
      setAllItems(items)
      setFormMetadata(formBuilderRecord.form_data.metadata || null)

      // フォームをリセット
      setFormValues({})
      setSelectedItemIds([])
    } catch (err) {
      console.error('フォームデータの読み込みエラー:', err)
    } finally {
      setLoading(false)
    }
  }

  // フィールド値変更時
  const handleFieldChange = (fieldName: string, value: string | number | boolean | number[] | null) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldName]: value
    }))
  }

  // アイテム選択変更時
  const handleItemSelectionChange = (itemId: number, isSelected: boolean) => {
    setSelectedItemIds((prev) => {
      if (isSelected) {
        return [...prev, itemId]
      } else {
        return prev.filter((id) => id !== itemId)
      }
    })
  }

  // 表示すべきカテゴリをフィルタリング
  const visibleCategories = filterVisibleCategories(productCategories, formValues)

  // デバッグ用ログ
  useEffect(() => {
    console.log('=== FormBuilder Debug ===')
    console.log('formValues:', formValues)
    console.log('productCategories:', productCategories)
    console.log('visibleCategories:', visibleCategories)

    // 条件ルールの詳細をログ出力
    productCategories
      .filter((cat) => cat.form_section === 'conditional' && cat.conditional_rule)
      .forEach((cat) => {
        console.log(`[条件] ${cat.display_name}:`, cat.conditional_rule)
      })
  }, [formValues, productCategories, visibleCategories])

  // Triggerセクションの存在確認
  const hasTrigger = hasTriggerSections(productCategories)

  // Conditionalセクションの存在確認
  const hasConditionalSections = productCategories.some(
    (cat) => cat.is_active && cat.form_section === 'conditional'
  )

  // Conditionalセクションが表示されているか確認
  const hasVisibleConditional = visibleCategories.some(
    (cat) => cat.form_section === 'conditional'
  )

  // Common Finalの表示条件:
  // - Conditionalセクションが存在しない場合: Triggerで選択後すぐ表示
  // - Conditionalセクションが存在する場合: Conditionalが表示された後に表示
  const shouldShowCommonFinal = !hasConditionalSections || hasVisibleConditional

  // 合計金額を計算
  const totalPrice = calculateTotalPrice(selectedItemIds, allItems)

  // リセット処理
  const handleReset = () => {
    setSelectedShootingCategoryId(null)
    setProductCategories([])
    setAllItems([])
    setFormMetadata(null)
    setFormValues({})
    setSelectedItemIds([])
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background-100 to-background-400">
      <Header />

      {/* Hero Section */}
      <section className="relative py-12 md:py-16 bg-gradient-to-br from-brand-50 via-white to-secondary-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* アイコン */}
          <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 shadow-brand-lg flex items-center justify-center animate-fade-in">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent mb-4 font-yugothic animate-slide-up">
            料金シミュレーション
          </h1>
          <div className="w-24 h-1 mx-auto bg-gradient-to-r from-brand-400 to-secondary-400 rounded-full mb-6"></div>
          <p className="text-base md:text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto animate-slide-up">
            ご希望の撮影メニューをお選びください。
          </p>
        </div>
      </section>

      {/* Campaign Section */}
      {campaigns.length > 0 && (
        <section className="py-6 bg-gradient-to-r from-secondary-50 via-secondary-100 to-secondary-50 border-y border-secondary-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-secondary-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <p className="text-center text-sm font-bold text-secondary-800">
                現在実施中のキャンペーン
              </p>
            </div>
            <div className="space-y-3">
              {campaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="flex items-center justify-between bg-white px-5 py-4 rounded-xl border-2 border-secondary-300 shadow-soft hover:shadow-medium transition-shadow duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-secondary-400 to-secondary-600 shadow-soft">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-neutral-800">
                        {campaign.name}
                      </h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {campaign.start_date} 〜 {campaign.end_date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold text-secondary-600">
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
      <section className="py-8 bg-transparent">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 撮影カテゴリ選択 */}
          <div className="bg-white rounded-2xl shadow-medium border border-brand-100 p-8 mb-8 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-brand-700 mb-2 font-yugothic">
                撮影カテゴリを選択
              </h2>
              <div className="w-16 h-1 mx-auto bg-gradient-to-r from-brand-400 to-secondary-400 rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              {shootingCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedShootingCategoryId(category.id)}
                  className={`group relative overflow-hidden rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    selectedShootingCategoryId === category.id
                      ? 'border-brand-500 ring-4 ring-brand-200 shadow-brand-lg'
                      : 'border-neutral-200 hover:border-brand-300 shadow-soft hover:shadow-medium'
                  }`}
                >
                  {/* 画像部分 */}
                  <div className="aspect-[4/3] bg-gradient-to-br from-neutral-100 to-neutral-200 overflow-hidden">
                    {category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.display_name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* テキストラベル */}
                  <div className="py-4 px-3 bg-white">
                    <p className={`text-sm font-bold text-center transition-colors ${
                      selectedShootingCategoryId === category.id
                        ? 'text-brand-700'
                        : 'text-neutral-800 group-hover:text-brand-600'
                    }`}>
                      {category.display_name}
                    </p>
                  </div>
                  {/* 選択インジケーター */}
                  {selectedShootingCategoryId === category.id && (
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center shadow-brand">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* フォームコンテンツ */}
          <div ref={formContentRef}>
            {loading && (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mb-4 animate-pulse">
                  <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-neutral-600 font-medium">読み込み中...</div>
              </div>
            )}

            {!loading && selectedShootingCategoryId && productCategories.length === 0 && (
            <div className="bg-gradient-to-r from-secondary-50 to-secondary-100 border-2 border-secondary-200 rounded-xl p-8 text-center shadow-soft">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-secondary-200 mb-4">
                <svg className="w-8 h-8 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-secondary-800 font-semibold mb-2">
                この撮影カテゴリのフォームはまだ作成されていません
              </p>
              <p className="text-sm text-secondary-600">
                管理画面のフォームビルダーで先にフォームを作成してください。
              </p>
            </div>
          )}

          {!loading && selectedShootingCategoryId && productCategories.length > 0 && (
            <>
              {/* Triggerセクション */}
              {hasTrigger && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {formMetadata?.heading_trigger || '基本情報'}
                  </h2>
                  {visibleCategories
                    .filter((cat) => cat.form_section === 'trigger')
                    .map((category) => (
                      <ProductCategorySection
                        key={category.id}
                        category={category}
                        items={allItems.filter((item) => item.product_category_id === category.id)}
                        selectedItemIds={selectedItemIds}
                        onFieldChange={handleFieldChange}
                        onItemSelectionChange={handleItemSelectionChange}
                      />
                    ))}
                </div>
              )}

              {/* Conditionalセクション */}
              {visibleCategories.some((cat) => cat.form_section === 'conditional') && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    {formMetadata?.heading_conditional || 'オプション'}
                  </h2>
                  {visibleCategories
                    .filter((cat) => cat.form_section === 'conditional')
                    .map((category) => (
                      <ProductCategorySection
                        key={category.id}
                        category={category}
                        items={allItems.filter((item) => item.product_category_id === category.id)}
                        selectedItemIds={selectedItemIds}
                        onFieldChange={handleFieldChange}
                        onItemSelectionChange={handleItemSelectionChange}
                      />
                    ))}
                </div>
              )}

              {/* Common Finalセクション */}
              {shouldShowCommonFinal &&
                visibleCategories.some((cat) => cat.form_section === 'common_final') && (
                  <div className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                      {formMetadata?.heading_common_final || '追加オプション'}
                    </h2>
                    {visibleCategories
                      .filter((cat) => cat.form_section === 'common_final')
                      .map((category) => (
                        <ProductCategorySection
                          key={category.id}
                          category={category}
                          items={allItems.filter((item) => item.product_category_id === category.id)}
                          selectedItemIds={selectedItemIds}
                          onFieldChange={handleFieldChange}
                          onItemSelectionChange={handleItemSelectionChange}
                        />
                      ))}
                  </div>
                )}
            </>
          )}
          </div>
        </div>
      </section>

      {/* Price Summary - Sticky Bottom */}
      {selectedItemIds.length > 0 && (
        <div className="sticky bottom-0 bg-gradient-to-r from-white via-brand-50 to-white border-t-2 border-brand-200 shadow-large z-50 animate-slide-up">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="bg-gradient-to-r from-brand-50 to-secondary-50 rounded-xl p-4 mb-4 border border-brand-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-brand-800">合計金額</span>
                <div className="text-right">
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
                    {formatPrice(totalPrice)}
                  </div>
                  <div className="text-xs text-neutral-500 mt-1">（税込）</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleReset}
                className="px-5 py-3.5 border-2 border-neutral-300 text-neutral-700 font-bold rounded-xl hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-300 shadow-soft hover:shadow-medium transform hover:scale-105"
              >
                やり直す
              </button>
              <button className="px-5 py-3.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded-xl hover:from-brand-600 hover:to-brand-700 transition-all duration-300 shadow-brand hover:shadow-brand-lg transform hover:scale-105">
                ご予約はこちら
              </button>
            </div>

            <p className="text-xs text-center text-neutral-500 mt-4 leading-relaxed">
              ※撮影する家族の人数や衣装、キャンペーン適用などで金額が異なる場合がございます。
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
