import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { getFormBuilderDataByShootingCategory } from '../services/formBuilderService'
import { convertFormBuilderToCustomerForm } from '../utils/formBuilderConverter'
import { filterVisibleCategories, hasTriggerSections } from '../utils/sectionLogic'
import { calculateTotalPrice } from '../utils/formHelpers'
import type { ProductCategoryV3, FormValues } from '../types/formV3'
import type { ShootingCategory, Item } from '../types/category'
import ProductCategorySection from '../components/customer/ProductCategorySection'

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
  }, [formValues, productCategories, visibleCategories])

  // Triggerセクションの存在確認
  const hasTrigger = hasTriggerSections(productCategories)

  // 合計金額を計算
  const totalPrice = calculateTotalPrice(selectedItemIds, allItems)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">撮影プラン料金シミュレーター</h1>

        {/* 撮影カテゴリ選択 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            撮影カテゴリを選択してください
          </label>
          <select
            value={selectedShootingCategoryId || ''}
            onChange={(e) => setSelectedShootingCategoryId(parseInt(e.target.value))}
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- 選択してください --</option>
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
            {visibleCategories.some((cat) => cat.form_section === 'common_final') && (
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

            {/* 合計金額表示 */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 sticky bottom-0">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">合計金額</div>
                <div className="text-4xl font-bold text-blue-600">
                  ¥{totalPrice.toLocaleString()}
                  <span className="text-lg text-gray-600 ml-2">(税込)</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
