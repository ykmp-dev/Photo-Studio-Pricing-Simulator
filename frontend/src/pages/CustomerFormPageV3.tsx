import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getFormBuilderDataByShootingCategory } from '../services/formBuilderService'
import { convertFormBuilderToCustomerForm } from '../utils/formBuilderConverter'
import { filterVisibleCategories, hasTriggerSections } from '../utils/sectionLogic'
import { calculateTotalPrice } from '../utils/formHelpers'
import { formatPrice } from '../utils/priceCalculator'
import type { ProductCategoryV3, FormValues } from '../types/formV3'
import type { ShootingCategory, Item } from '../types/category'
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

  const [productCategories, setProductCategories] = useState<ProductCategoryV3[]>([])
  const [allItems, setAllItems] = useState<Item[]>([])

  const [formValues, setFormValues] = useState<FormValues>({})
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([])

  const [loading, setLoading] = useState(false)

  // 撮影カテゴリ一覧を取得
  useEffect(() => {
    loadShootingCategories()
  }, [shopId])

  // 撮影カテゴリ変更時、商品カテゴリとアイテムを取得
  useEffect(() => {
    if (selectedShootingCategoryId) {
      loadFormData(selectedShootingCategoryId)
    }
  }, [selectedShootingCategoryId])

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
        return
      }

      // FormBuilderDataをお客様向けフォーム用のデータに変換
      const { categories, items } = convertFormBuilderToCustomerForm(formBuilderRecord.form_data)

      setProductCategories(categories)
      setAllItems(items)

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
    setFormValues({})
    setSelectedItemIds([])
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

      {/* Main Content Section */}
      <section className="py-6 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 撮影カテゴリ選択 */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <label className="block text-base font-semibold text-gray-800 mb-2">
              撮影メニューをお選びください
            </label>
            <select
              value={selectedShootingCategoryId || ''}
              onChange={(e) => setSelectedShootingCategoryId(parseInt(e.target.value))}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-md text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
            >
              <option value="">選択してください</option>
              {shootingCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.display_name}
                </option>
              ))}
            </select>
          </div>

          {/* フォームコンテンツ */}
          {loading && (
            <div className="text-center py-12">
              <div className="text-gray-600">読み込み中...</div>
            </div>
          )}

          {!loading && selectedShootingCategoryId && productCategories.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800">
                この撮影カテゴリのフォームはまだ作成されていません。
              </p>
              <p className="text-sm text-yellow-600 mt-2">
                管理画面のフォームビルダーで先にフォームを作成してください。
              </p>
            </div>
          )}

          {!loading && selectedShootingCategoryId && productCategories.length > 0 && (
            <>
              {/* Triggerセクション */}
              {hasTrigger && (
                <div className="mb-8">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">基本情報</h2>
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
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">オプション</h2>
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
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">追加オプション</h2>
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
      </section>

      {/* Price Summary - Sticky Bottom */}
      {selectedItemIds.length > 0 && (
        <div className="sticky bottom-0 bg-white border-t-2 border-blue-300 shadow-xl z-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="border-t-2 border-blue-400 pt-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-800">合計</span>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(totalPrice)}
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
                やり直す
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
