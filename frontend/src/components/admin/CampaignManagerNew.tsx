import { useState, useEffect } from 'react'
import {
  getCampaigns,
  getCampaignWithAssociations,
  createCampaignWithAssociations,
  updateCampaign,
  deleteCampaign,
  updateCampaignAssociations,
} from '../../services/campaignService'
import {
  getProductCategories,
  getItems,
} from '../../services/categoryService'
import type { Campaign } from '../../types/campaign'
import type { ProductCategory, Item } from '../../types/category'
import { getErrorMessage, getSuccessMessage } from '../../utils/errorMessages'

interface CampaignManagerProps {
  shopId: number
  onHasChanges?: (hasChanges: boolean) => void
}

export default function CampaignManager({ shopId, onHasChanges }: CampaignManagerProps) {
  // 本番データ（データベースから読み込んだ状態）
  const [publishedCampaigns, setPublishedCampaigns] = useState<Campaign[]>([])

  // 下書きデータ（編集中の状態）
  const [draftCampaigns, setDraftCampaigns] = useState<Campaign[]>([])

  // 商品カテゴリとアイテム（フラット表示用）
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  const [allItems, setAllItems] = useState<Map<number, Item[]>>(new Map())

  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  // 変更フラグ（下書きと本番の差分があるか）
  const [hasChanges, setHasChanges] = useState(false)

  // フォーム値
  const [formName, setFormName] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [formDiscountValue, setFormDiscountValue] = useState(0)
  const [formIsActive, setFormIsActive] = useState(true)

  // 選択された関連（商品カテゴリとアイテムのみ）
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([])

  // トグル状態（商品カテゴリの展開/折りたたみ）
  const [expandedProduct, setExpandedProduct] = useState<Set<number>>(new Set())

  // 変更通知
  useEffect(() => {
    onHasChanges?.(hasChanges)
  }, [hasChanges, onHasChanges])

  useEffect(() => {
    loadData()
  }, [shopId])

  const loadData = async () => {
    try {
      const [campaignsData, productCategoriesData] = await Promise.all([
        getCampaigns(shopId),
        getProductCategories(shopId),
      ])

      setPublishedCampaigns(campaignsData)
      setDraftCampaigns(campaignsData)
      setProductCategories(productCategoriesData)

      // 各商品カテゴリのアイテムを読み込み
      const itemsMap = new Map<number, Item[]>()
      for (const category of productCategoriesData) {
        const items = await getItems(shopId, category.id)
        itemsMap.set(category.id, items)
      }
      setAllItems(itemsMap)

      setHasChanges(false)
    } catch (err) {
      console.error('データの読み込みに失敗しました:', err)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormStartDate('')
    setFormEndDate('')
    setFormDiscountType('percentage')
    setFormDiscountValue(0)
    setFormIsActive(true)
    setSelectedProductIds([])
    setSelectedItemIds([])
    setEditingCampaignId(null)
    setShowForm(false)
  }

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault()

    // 下書きに新規キャンペーンを追加
    const newId = -Math.floor(Math.random() * 1000000) // 負の値でテンポラリIDを作成
    const now = new Date().toISOString()

    const newCampaign: Campaign = {
      id: newId,
      shop_id: shopId,
      name: formName,
      start_date: formStartDate,
      end_date: formEndDate,
      discount_type: formDiscountType,
      discount_value: formDiscountValue,
      is_active: formIsActive,
      created_at: now,
      updated_at: now,
      // 関連情報を一時的に保存（実際のDB型とは異なるが、下書き用）
      associations: {
        shooting_category_ids: [], // 撮影カテゴリは使用しない
        product_category_ids: selectedProductIds,
        item_ids: selectedItemIds,
      } as any,
    }

    setDraftCampaigns([...draftCampaigns, newCampaign])
    setHasChanges(true)
    resetForm()
  }

  const handleUpdateCampaign = () => {
    if (!editingCampaignId) return

    // 下書き内のキャンペーンを更新
    const updatedCampaigns = draftCampaigns.map((campaign) => {
      if (campaign.id === editingCampaignId) {
        return {
          ...campaign,
          name: formName,
          start_date: formStartDate,
          end_date: formEndDate,
          discount_type: formDiscountType,
          discount_value: formDiscountValue,
          is_active: formIsActive,
          updated_at: new Date().toISOString(),
          associations: {
            shooting_category_ids: [], // 撮影カテゴリは使用しない
            product_category_ids: selectedProductIds,
            item_ids: selectedItemIds,
          } as any,
        }
      }
      return campaign
    })

    setDraftCampaigns(updatedCampaigns)
    setHasChanges(true)
    resetForm()
  }

  const handleEditCampaign = async (campaignId: number) => {
    try {
      // 下書きから探す
      let campaign = draftCampaigns.find((c) => c.id === campaignId)

      // 下書きになければ、DBから取得して下書きに追加
      if (!campaign) {
        campaign = await getCampaignWithAssociations(campaignId)
        if (!campaign) return
      }

      setEditingCampaignId(campaignId)
      setFormName(campaign.name)
      setFormStartDate(campaign.start_date)
      setFormEndDate(campaign.end_date)
      setFormDiscountType(campaign.discount_type)
      setFormDiscountValue(campaign.discount_value)
      setFormIsActive(campaign.is_active)
      setSelectedProductIds((campaign as any).associations?.product_category_ids || [])
      setSelectedItemIds((campaign as any).associations?.item_ids || [])
      setShowForm(true)
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleDeleteCampaign = (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？\n（「更新」ボタンを押すまで削除は確定されません）`)) return

    // 下書きから削除
    const updatedCampaigns = draftCampaigns.filter((c) => c.id !== id)
    setDraftCampaigns(updatedCampaigns)
    setHasChanges(true)
  }

  // 下書きを本番に反映（データベースに保存）
  const handlePublish = async () => {
    if (!confirm('変更を保存しますか？')) return

    try {
      // 削除されたキャンペーンを処理
      const deletedCampaigns = publishedCampaigns.filter(
        (pub) => !draftCampaigns.find((draft) => draft.id === pub.id)
      )
      for (const campaign of deletedCampaigns) {
        await deleteCampaign(campaign.id)
      }

      // 新規・更新されたキャンペーンを処理
      for (const draft of draftCampaigns) {
        const isNew = draft.id < 0

        if (isNew) {
          // 新規作成
          await createCampaignWithAssociations(
            {
              shop_id: shopId,
              name: draft.name,
              start_date: draft.start_date,
              end_date: draft.end_date,
              discount_type: draft.discount_type,
              discount_value: draft.discount_value,
              is_active: draft.is_active,
            },
            {
              shooting_category_ids: [], // 撮影カテゴリは使用しない
              product_category_ids: (draft as any).associations?.product_category_ids || [],
              item_ids: (draft as any).associations?.item_ids || [],
            }
          )
        } else {
          // 既存キャンペーンの更新
          await updateCampaign(draft.id, {
            name: draft.name,
            start_date: draft.start_date,
            end_date: draft.end_date,
            discount_type: draft.discount_type,
            discount_value: draft.discount_value,
            is_active: draft.is_active,
          })
          await updateCampaignAssociations(
            draft.id,
            {
              shooting_category_ids: [], // 撮影カテゴリは使用しない
              product_category_ids: (draft as any).associations?.product_category_ids || [],
              item_ids: (draft as any).associations?.item_ids || [],
            }
          )
        }
      }

      await loadData()
      alert(getSuccessMessage('update', 'キャンペーン'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  // 下書きを破棄して本番データに戻す
  const handleDiscard = () => {
    if (!confirm('編集中の変更を破棄しますか？')) return
    setDraftCampaigns([...publishedCampaigns])
    setHasChanges(false)
    resetForm()
  }

  const toggleProduct = (id: number) => {
    const newExpanded = new Set(expandedProduct)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedProduct(newExpanded)
  }

  const handleToggleProduct = (id: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleToggleItem = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  // キャンペーンごとのステータスを取得
  const getCampaignStatus = (campaignId: number) => {
    const draftCampaign = draftCampaigns.find((c) => c.id === campaignId)
    const publishedCampaign = publishedCampaigns.find((c) => c.id === campaignId)

    if (!draftCampaign && !publishedCampaign) {
      return { status: 'none', badge: null }
    }

    if (draftCampaign && !publishedCampaign) {
      return { status: 'draft', badge: '下書き' }
    }

    if (draftCampaign && publishedCampaign && JSON.stringify(draftCampaign) !== JSON.stringify(publishedCampaign)) {
      return { status: 'modified', badge: '編集中' }
    }

    return { status: 'published', badge: null }
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">キャンペーン管理</h2>
          <p className="text-sm text-gray-600 mt-1">
            キャンペーンの割引設定を管理できます
          </p>
        </div>

        {/* 更新・破棄ボタン */}
        {hasChanges ? (
          <div className="flex gap-3">
            <button
              onClick={handleDiscard}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
            >
              変更を破棄
            </button>
            <button
              onClick={handlePublish}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
            >
              更新（本番に反映）
            </button>
          </div>
        ) : (
          !showForm && (
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              + 新規キャンペーン作成
            </button>
          )
        )}
      </div>

      {/* 変更通知バナー */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800">
            ⚠️ 未保存の変更があります。「更新」ボタンを押すまで変更は保存されません。
          </p>
        </div>
      )}

      {/* フォーム */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingCampaignId ? 'キャンペーン編集' : '新規キャンペーン作成'}
          </h3>

          <form onSubmit={handleCreateCampaign} className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  キャンペーン名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="七五三早割キャンペーン"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  割引タイプ
                </label>
                <select
                  value={formDiscountType}
                  onChange={(e) => setFormDiscountType(e.target.value as 'percentage' | 'fixed')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="percentage">パーセント（%）</option>
                  <option value="fixed">固定金額（円）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  割引値 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formDiscountValue}
                  onChange={(e) => setFormDiscountValue(Number(e.target.value))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={formDiscountType === 'percentage' ? '10' : '1000'}
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">このキャンペーンを有効にする</span>
                </label>
              </div>
            </div>

            {/* 適用対象選択 */}
            <div className="border-t pt-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3">割引を適用する商品を選択</h4>
              <p className="text-sm text-gray-600 mb-4">
                チェックした商品カテゴリまたはアイテムに{formDiscountType === 'percentage' ? `${formDiscountValue}%` : `${formDiscountValue}円`}の割引が適用されます
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                {productCategories.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>商品カテゴリが登録されていません</p>
                    <p className="text-xs mt-1">先に「カテゴリ・アイテム管理」タブで商品カテゴリを作成してください</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {productCategories.map((product) => {
                      const items = allItems.get(product.id) || []
                      return (
                        <div key={product.id} className="border border-gray-200 rounded-lg p-3 bg-white">
                          {/* 商品カテゴリ */}
                          <div className="flex items-center gap-2 mb-2">
                            {items.length > 0 && (
                              <button
                                type="button"
                                onClick={() => toggleProduct(product.id)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                {expandedProduct.has(product.id) ? '▼' : '▶'}
                              </button>
                            )}
                            <label className="flex items-center gap-2 font-medium text-gray-800">
                              <input
                                type="checkbox"
                                checked={selectedProductIds.includes(product.id)}
                                onChange={() => handleToggleProduct(product.id)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              {product.display_name}
                            </label>
                            <span className="text-xs text-gray-500">({items.length}個のアイテム)</span>
                          </div>

                          {/* アイテム */}
                          {expandedProduct.has(product.id) && items.length > 0 && (
                            <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-3">
                              {items.map((item) => (
                                <label
                                  key={item.id}
                                  className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 p-1 rounded"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedItemIds.includes(item.id)}
                                    onChange={() => handleToggleItem(item.id)}
                                    className="w-3.5 h-3.5 text-blue-600 rounded"
                                  />
                                  <span className="flex-1">{item.name}</span>
                                  <span className="text-gray-600">¥{item.price.toLocaleString()}</span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex gap-2 pt-4 border-t">
              {editingCampaignId ? (
                <>
                  <button
                    type="button"
                    onClick={handleUpdateCampaign}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    更新
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
                  >
                    作成
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium"
                  >
                    キャンセル
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      )}

      {/* キャンペーン一覧 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">キャンペーン一覧</h3>

        {draftCampaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>キャンペーンがまだありません</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              最初のキャンペーンを作成
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {draftCampaigns.map((campaign) => {
              const campaignStatus = getCampaignStatus(campaign.id)
              return (
                <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">{campaign.name}</h4>
                        {campaign.is_active ? (
                          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
                            有効
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                            無効
                          </span>
                        )}
                        {campaignStatus.badge && (
                          <span
                            className={`text-xs px-2 py-1 rounded font-medium ${
                              campaignStatus.status === 'draft'
                                ? 'bg-yellow-100 text-yellow-700'
                                : campaignStatus.status === 'modified'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {campaignStatus.badge}
                          </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        期間: {new Date(campaign.start_date).toLocaleDateString('ja-JP')} 〜{' '}
                        {new Date(campaign.end_date).toLocaleDateString('ja-JP')}
                      </p>
                      <p>
                        割引:{' '}
                        {campaign.discount_type === 'percentage'
                          ? `${campaign.discount_value}%オフ`
                          : `${campaign.discount_value.toLocaleString()}円引き`}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditCampaign(campaign.id)}
                      className="text-blue-600 hover:text-blue-700 px-3 py-1 text-sm font-medium"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                      className="text-red-600 hover:text-red-700 px-3 py-1 text-sm font-medium"
                    >
                      削除
                    </button>
                  </div>
                </div>
              </div>
            )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
