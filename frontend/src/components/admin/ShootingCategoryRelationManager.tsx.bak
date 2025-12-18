import { useState, useEffect } from 'react'
import {
  getShootingCategories,
  getProductCategories,
  getShootingProductAssociations,
  createShootingProductAssociation,
  updateShootingProductAssociation,
  deleteShootingProductAssociation,
  updateAssociationsSortOrder,
} from '../../services/categoryService'
import type {
  ShootingCategory,
  ProductCategory,
  ShootingProductAssociation,
} from '../../types/category'
import { getErrorMessage, getSuccessMessage } from '../../utils/errorMessages'

interface ShootingCategoryRelationManagerProps {
  shopId: number
}

interface AssociationWithCategory extends ShootingProductAssociation {
  product_category: ProductCategory
}

export default function ShootingCategoryRelationManager({
  shopId,
}: ShootingCategoryRelationManagerProps) {
  const [shootingCategories, setShootingCategories] = useState<ShootingCategory[]>([])
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  const [selectedShootingId, setSelectedShootingId] = useState<number | null>(null)
  const [associations, setAssociations] = useState<AssociationWithCategory[]>([])
  const [newProductCategoryId, setNewProductCategoryId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCategories()
  }, [shopId])

  useEffect(() => {
    if (selectedShootingId) {
      loadAssociations()
    }
  }, [selectedShootingId])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const [shooting, product] = await Promise.all([
        getShootingCategories(shopId),
        getProductCategories(shopId),
      ])
      setShootingCategories(shooting)
      setProductCategories(product)
    } catch (err) {
      console.error(err)
      alert('カテゴリの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const loadAssociations = async () => {
    if (!selectedShootingId) return

    try {
      const assocs = await getShootingProductAssociations(selectedShootingId)

      // 商品カテゴリ情報を結合
      const assocsWithCategory: AssociationWithCategory[] = assocs
        .map((assoc) => {
          const productCategory = productCategories.find(
            (pc) => pc.id === assoc.product_category_id
          )
          if (!productCategory) return null
          return {
            ...assoc,
            product_category: productCategory,
          }
        })
        .filter((a) => a !== null) as AssociationWithCategory[]

      setAssociations(assocsWithCategory)
    } catch (err) {
      console.error(err)
      alert('関連の読み込みに失敗しました')
    }
  }

  const handleAddAssociation = async () => {
    if (!selectedShootingId || !newProductCategoryId) {
      alert('商品カテゴリを選択してください')
      return
    }

    // 既に追加済みかチェック
    if (associations.some((a) => a.product_category_id === newProductCategoryId)) {
      alert('この商品カテゴリは既に追加されています')
      return
    }

    try {
      await createShootingProductAssociation({
        shooting_category_id: selectedShootingId,
        product_category_id: newProductCategoryId,
        sort_order: associations.length,
        is_required: false,
      })
      setNewProductCategoryId(null)
      await loadAssociations()
      alert(getSuccessMessage('create', '商品カテゴリ'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleToggleRequired = async (assoc: AssociationWithCategory) => {
    try {
      await updateShootingProductAssociation(assoc.id, {
        is_required: !assoc.is_required,
      })
      await loadAssociations()
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return

    const newAssociations = [...associations]
    ;[newAssociations[index - 1], newAssociations[index]] = [
      newAssociations[index],
      newAssociations[index - 1],
    ]

    // UIを即座に更新
    setAssociations(newAssociations)

    // サーバーに保存
    try {
      await updateAssociationsSortOrder(
        newAssociations.map((a, i) => ({ id: a.id, sort_order: i }))
      )
    } catch (err) {
      console.error(err)
      alert('並び順の更新に失敗しました')
      await loadAssociations() // 失敗したら元に戻す
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === associations.length - 1) return

    const newAssociations = [...associations]
    ;[newAssociations[index], newAssociations[index + 1]] = [
      newAssociations[index + 1],
      newAssociations[index],
    ]

    // UIを即座に更新
    setAssociations(newAssociations)

    // サーバーに保存
    try {
      await updateAssociationsSortOrder(
        newAssociations.map((a, i) => ({ id: a.id, sort_order: i }))
      )
    } catch (err) {
      console.error(err)
      alert('並び順の更新に失敗しました')
      await loadAssociations() // 失敗したら元に戻す
    }
  }

  const handleDelete = async (assoc: AssociationWithCategory) => {
    if (!confirm(`「${assoc.product_category.display_name}」を削除しますか？`)) return

    try {
      await deleteShootingProductAssociation(assoc.id)
      await loadAssociations()
      alert(getSuccessMessage('delete', '商品カテゴリ'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  // 未追加の商品カテゴリを取得
  const availableProductCategories = productCategories.filter(
    (pc) => !associations.some((a) => a.product_category_id === pc.id)
  )

  if (loading) {
    return <div className="text-gray-500">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">撮影カテゴリ関連管理</h2>
        <p className="text-sm text-gray-600 mt-1">
          撮影カテゴリごとに表示する商品カテゴリを設定
        </p>
      </div>

      {/* 撮影カテゴリ選択 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          撮影カテゴリを選択 <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedShootingId || ''}
          onChange={(e) => setSelectedShootingId(e.target.value ? Number(e.target.value) : null)}
          className="w-full max-w-md border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">選択してください</option>
          {shootingCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.display_name}
            </option>
          ))}
        </select>
      </div>

      {/* 関連商品カテゴリ管理 */}
      {selectedShootingId && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            表示される商品カテゴリ（順序制御）
          </h3>

          {/* 関連リスト */}
          {associations.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
              <p className="text-gray-500">商品カテゴリが設定されていません</p>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              {associations.map((assoc, index) => (
                <div
                  key={assoc.id}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  {/* 順序番号 */}
                  <span className="text-sm font-semibold text-gray-500 w-8">
                    {index + 1}.
                  </span>

                  {/* カテゴリ名 */}
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">
                      {assoc.product_category.display_name}
                    </span>
                  </div>

                  {/* 必須チェックボックス */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assoc.is_required}
                      onChange={() => handleToggleRequired(assoc)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">必須</span>
                  </label>

                  {/* 並び替えボタン */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded disabled:text-gray-300 disabled:cursor-not-allowed"
                      title="上へ"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === associations.length - 1}
                      className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded disabled:text-gray-300 disabled:cursor-not-allowed"
                      title="下へ"
                    >
                      ↓
                    </button>
                  </div>

                  {/* 削除ボタン */}
                  <button
                    onClick={() => handleDelete(assoc)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 商品カテゴリ追加 */}
          {availableProductCategories.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                商品カテゴリを追加
              </label>
              <div className="flex gap-2">
                <select
                  value={newProductCategoryId || ''}
                  onChange={(e) =>
                    setNewProductCategoryId(e.target.value ? Number(e.target.value) : null)
                  }
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">選択してください</option>
                  {availableProductCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.display_name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddAssociation}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  追加
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
