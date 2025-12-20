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
  getAllCategoryStructure,
} from '../../services/categoryService'
import type { Campaign } from '../../types/campaign'
import type { ShootingCategoryWithProducts } from '../../types/category'
import { getErrorMessage, getSuccessMessage } from '../../utils/errorMessages'

interface CampaignManagerProps {
  shopId: number
  onHasChanges?: (hasChanges: boolean) => void
}

export default function CampaignManager({ shopId, onHasChanges }: CampaignManagerProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [categoryStructure, setCategoryStructure] = useState<ShootingCategoryWithProducts[]>([])
  const [editingCampaignId, setEditingCampaignId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // フォーム値
  const [formName, setFormName] = useState('')
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formDiscountType, setFormDiscountType] = useState<'percentage' | 'fixed'>('percentage')
  const [formDiscountValue, setFormDiscountValue] = useState(0)
  const [formIsActive, setFormIsActive] = useState(true)

  // 選択された関連
  const [selectedShootingIds, setSelectedShootingIds] = useState<number[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([])

  // トグル状態
  const [expandedShooting, setExpandedShooting] = useState<Set<number>>(new Set())
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
      const [campaignsData, structureData] = await Promise.all([
        getCampaigns(shopId),
        getAllCategoryStructure(shopId),
      ])
      setCampaigns(campaignsData)
      setCategoryStructure(structureData)
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
    setSelectedShootingIds([])
    setSelectedProductIds([])
    setSelectedItemIds([])
    setEditingCampaignId(null)
    setShowForm(false)
    setHasChanges(false)
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createCampaignWithAssociations(
        {
          shop_id: shopId,
          name: formName,
          start_date: formStartDate,
          end_date: formEndDate,
          discount_type: formDiscountType,
          discount_value: formDiscountValue,
          is_active: formIsActive,
        },
        {
          shooting_category_ids: selectedShootingIds,
          product_category_ids: selectedProductIds,
          item_ids: selectedItemIds,
        }
      )
      resetForm()
      await loadData()
      alert(getSuccessMessage('create', 'キャンペーン'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleUpdateCampaign = async () => {
    if (!editingCampaignId) return
    try {
      await updateCampaign(editingCampaignId, {
        name: formName,
        start_date: formStartDate,
        end_date: formEndDate,
        discount_type: formDiscountType,
        discount_value: formDiscountValue,
        is_active: formIsActive,
      })
      await updateCampaignAssociations(editingCampaignId, {
        shooting_category_ids: selectedShootingIds,
        product_category_ids: selectedProductIds,
        item_ids: selectedItemIds,
      })
      resetForm()
      await loadData()
      alert(getSuccessMessage('update', 'キャンペーン'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleEditCampaign = async (campaignId: number) => {
    try {
      const campaign = await getCampaignWithAssociations(campaignId)
      if (!campaign) return

      setEditingCampaignId(campaignId)
      setFormName(campaign.name)
      setFormStartDate(campaign.start_date)
      setFormEndDate(campaign.end_date)
      setFormDiscountType(campaign.discount_type)
      setFormDiscountValue(campaign.discount_value)
      setFormIsActive(campaign.is_active)
      setSelectedShootingIds(campaign.associations.shooting_category_ids)
      setSelectedProductIds(campaign.associations.product_category_ids)
      setSelectedItemIds(campaign.associations.item_ids)
      setShowForm(true)
      setHasChanges(true)
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleDeleteCampaign = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    try {
      await deleteCampaign(id)
      await loadData()
      alert(getSuccessMessage('delete', 'キャンペーン'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const toggleShooting = (id: number) => {
    const newExpanded = new Set(expandedShooting)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedShooting(newExpanded)
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

  const handleToggleShooting = (id: number) => {
    setSelectedShootingIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
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

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">キャンペーン管理</h2>
        {!showForm && (
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
              setHasChanges(true)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            + 新規キャンペーン作成
          </button>
        )}
      </div>

      {/* 変更通知バナー */}
      {hasChanges && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
          <p className="text-sm text-yellow-800">
            ⚠️ 未保存の変更があります。フォームを送信するか、キャンセルしてください。
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
              <h4 className="text-md font-semibold text-gray-800 mb-3">適用対象を選択</h4>
              <p className="text-sm text-gray-600 mb-4">
                チェックした撮影カテゴリ、商品カテゴリ、アイテムに割引が適用されます
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                {categoryStructure.map((shooting) => (
                  <div key={shooting.id} className="mb-3 last:mb-0">
                    {/* 撮影カテゴリ */}
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        type="button"
                        onClick={() => toggleShooting(shooting.id)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        {expandedShooting.has(shooting.id) ? '▼' : '▶'}
                      </button>
                      <label className="flex items-center gap-2 font-medium text-gray-800">
                        <input
                          type="checkbox"
                          checked={selectedShootingIds.includes(shooting.id)}
                          onChange={() => handleToggleShooting(shooting.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        {shooting.display_name}
                      </label>
                    </div>

                    {/* 商品カテゴリとアイテム */}
                    {expandedShooting.has(shooting.id) && (
                      <div className="ml-6 space-y-2">
                        {shooting.product_categories.map((product) => (
                          <div key={product.id}>
                            {/* 商品カテゴリ */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleProduct(product.id)}
                                className="text-gray-600 hover:text-gray-800"
                              >
                                {expandedProduct.has(product.id) ? '▼' : '▶'}
                              </button>
                              <label className="flex items-center gap-2 text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={selectedProductIds.includes(product.id)}
                                  onChange={() => handleToggleProduct(product.id)}
                                  className="w-4 h-4 text-blue-600 rounded"
                                />
                                {product.display_name}
                              </label>
                            </div>

                            {/* アイテム */}
                            {expandedProduct.has(product.id) && product.items.length > 0 && (
                              <div className="ml-6 mt-2 space-y-1">
                                {product.items.map((item) => (
                                  <label
                                    key={item.id}
                                    className="flex items-center gap-2 text-sm text-gray-600"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedItemIds.includes(item.id)}
                                      onChange={() => handleToggleItem(item.id)}
                                      className="w-3.5 h-3.5 text-blue-600 rounded"
                                    />
                                    {item.name} (¥{item.price.toLocaleString()})
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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

        {campaigns.length === 0 ? (
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
            {campaigns.map((campaign) => (
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
