import { useState, useEffect } from 'react'
import {
  getShootingCategories,
  getProductCategories,
  getItems,
  createShootingCategory,
  createProductCategory,
  createItem,
  updateShootingCategory,
  updateProductCategory,
  updateItem,
  deleteShootingCategory,
  deleteProductCategory,
  deleteItem,
} from '../../services/categoryService'
import type { ShootingCategory, ProductCategory, Item } from '../../types/category'
import { getErrorMessage, getSuccessMessage } from '../../utils/errorMessages'

interface CategoryManagerProps {
  shopId: number
}

type View = 'shooting' | 'product' | 'items'

export default function CategoryManager({ shopId }: CategoryManagerProps) {
  const [view, setView] = useState<View>('shooting')
  const [shootingCategories, setShootingCategories] = useState<ShootingCategory[]>([])
  const [productCategories, setProductCategories] = useState<ProductCategory[]>([])
  const [items, setItems] = useState<Item[]>([])

  // 選択中のカテゴリ
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)

  // 編集フォーム用の状態
  const [editingShootingId, setEditingShootingId] = useState<number | null>(null)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [editingItemId, setEditingItemId] = useState<number | null>(null)

  // フォーム値
  const [formName, setFormName] = useState('')
  const [formDisplayName, setFormDisplayName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState(0)
  const [formAutoSelect, setFormAutoSelect] = useState(false)

  useEffect(() => {
    loadData()
  }, [shopId, view])

  useEffect(() => {
    if (selectedProduct) {
      loadItems()
    }
  }, [selectedProduct])

  const loadData = async () => {
    try {
      if (view === 'shooting') {
        const shooting = await getShootingCategories(shopId)
        setShootingCategories(shooting)
      }
      if (view === 'product') {
        const product = await getProductCategories(shopId)
        setProductCategories(product)
      }
    } catch (err) {
      console.error('データの読み込みに失敗しました:', err)
    }
  }

  const loadItems = async () => {
    if (!selectedProduct) return
    try {
      const itemsData = await getItems(shopId, selectedProduct)
      setItems(itemsData)
    } catch (err) {
      console.error('アイテムの読み込みに失敗しました:', err)
    }
  }

  const handleCreateShooting = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createShootingCategory({
        shop_id: shopId,
        name: formName,
        display_name: formDisplayName,
        description: formDescription || undefined,
      })
      resetForm()
      await loadData()
      alert(getSuccessMessage('create', '撮影カテゴリ'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createProductCategory({
        shop_id: shopId,
        name: formName,
        display_name: formDisplayName,
        description: formDescription || undefined,
      })
      resetForm()
      await loadData()
      alert(getSuccessMessage('create', '商品カテゴリ'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) {
      alert('商品カテゴリを選択してください')
      return
    }
    try {
      await createItem({
        shop_id: shopId,
        product_category_id: selectedProduct,
        name: formDisplayName,
        price: formPrice,
        description: formDescription || undefined,
        auto_select: formAutoSelect,
      })
      resetForm()
      await loadItems()
      alert(getSuccessMessage('create', 'アイテム'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleUpdateShooting = async (id: number) => {
    try {
      await updateShootingCategory(id, {
        name: formName,
        display_name: formDisplayName,
        description: formDescription || undefined,
      })
      resetForm()
      await loadData()
      alert(getSuccessMessage('update', '撮影カテゴリ'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleUpdateProduct = async (id: number) => {
    try {
      await updateProductCategory(id, {
        name: formName,
        display_name: formDisplayName,
        description: formDescription || undefined,
      })
      resetForm()
      await loadData()
      alert(getSuccessMessage('update', '商品カテゴリ'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleUpdateItem = async (id: number) => {
    try {
      await updateItem(id, {
        name: formDisplayName,
        price: formPrice,
        description: formDescription || undefined,
        auto_select: formAutoSelect,
      })
      resetForm()
      await loadItems()
      alert(getSuccessMessage('update', 'アイテム'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleDeleteShooting = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    try {
      await deleteShootingCategory(id)
      await loadData()
      alert(getSuccessMessage('delete', '撮影カテゴリ'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleDeleteProduct = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    try {
      await deleteProductCategory(id)
      await loadData()
      alert(getSuccessMessage('delete', '商品カテゴリ'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleDeleteItem = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    try {
      await deleteItem(id)
      await loadItems()
      alert(getSuccessMessage('delete', 'アイテム'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormDisplayName('')
    setFormDescription('')
    setFormPrice(0)
    setFormAutoSelect(false)
    setEditingShootingId(null)
    setEditingProductId(null)
    setEditingItemId(null)
  }

  const startEditShooting = (category: ShootingCategory) => {
    setFormName(category.name)
    setFormDisplayName(category.display_name)
    setFormDescription(category.description || '')
    setEditingShootingId(category.id)
  }

  const startEditProduct = (category: ProductCategory) => {
    setFormName(category.name)
    setFormDisplayName(category.display_name)
    setFormDescription(category.description || '')
    setEditingProductId(category.id)
  }

  const startEditItem = (item: Item) => {
    setFormDisplayName(item.name)
    setFormPrice(item.price)
    setFormDescription(item.description || '')
    setFormAutoSelect(item.auto_select)
    setEditingItemId(item.id)
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">カテゴリ・アイテム管理</h2>
        <p className="text-sm text-gray-600 mt-1">撮影カテゴリ → 商品カテゴリ → アイテムの3階層を管理</p>
      </div>

      {/* タブ */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setView('shooting')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              view === 'shooting'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            撮影カテゴリ管理
          </button>
          <button
            onClick={() => setView('product')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              view === 'product'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            商品カテゴリ管理
          </button>
          <button
            onClick={() => setView('items')}
            className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              view === 'items'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            アイテム管理
          </button>
        </nav>
      </div>

      {/* 撮影カテゴリ管理 */}
      {view === 'shooting' && (
        <div className="grid grid-cols-2 gap-6">
          {/* フォーム */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingShootingId ? '撮影カテゴリ編集' : '撮影カテゴリ作成'}
            </h3>
            <form onSubmit={handleCreateShooting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  キー（name） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="shichigosan"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表示名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="七五三"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                {editingShootingId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateShooting(editingShootingId)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      更新
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                    >
                      キャンセル
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    作成
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* リスト */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">撮影カテゴリ一覧</h3>
            <div className="space-y-2">
              {shootingCategories.map((category) => (
                <div
                  key={category.id}
                  className="border rounded-lg p-4 border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{category.display_name}</h4>
                      <p className="text-sm text-gray-500">キー: {category.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditShooting(category)}
                        className="text-blue-600 hover:text-blue-700 text-sm px-2"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteShooting(category.id, category.display_name)}
                        className="text-red-600 hover:text-red-700 text-sm px-2"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 商品カテゴリ管理 */}
      {view === 'product' && (
        <div className="grid grid-cols-2 gap-6">
          {/* フォーム */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingProductId ? '商品カテゴリ編集' : '商品カテゴリ作成'}
            </h3>
            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  キー（name） <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="hair"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  表示名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="ヘアセット"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                {editingProductId ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleUpdateProduct(editingProductId)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      更新
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                    >
                      キャンセル
                    </button>
                  </>
                ) : (
                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                  >
                    作成
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* リスト */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">商品カテゴリ一覧</h3>
            <div className="space-y-2">
              {productCategories.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{category.display_name}</h4>
                      <p className="text-sm text-gray-500">キー: {category.name}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditProduct(category)}
                        className="text-blue-600 hover:text-blue-700 text-sm px-2"
                      >
                        編集
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(category.id, category.display_name)}
                        className="text-red-600 hover:text-red-700 text-sm px-2"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* アイテム管理 */}
      {view === 'items' && (
        <div className="grid grid-cols-3 gap-6">
          {/* 商品カテゴリ選択 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">商品カテゴリ</h3>
            <div className="space-y-2">
              {productCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedProduct(category.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                    selectedProduct === category.id
                      ? 'bg-blue-50 border-blue-500 text-blue-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {category.display_name}
                </button>
              ))}
            </div>
          </div>

          {/* フォーム */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingItemId ? 'アイテム編集' : 'アイテム作成'}
            </h3>
            {!selectedProduct ? (
              <p className="text-gray-500 text-sm">商品カテゴリを選択してください</p>
            ) : (
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    名前 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formDisplayName}
                    onChange={(e) => setFormDisplayName(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="基本ヘアセット"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    価格（税込・円） <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="5000"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formAutoSelect}
                      onChange={(e) => setFormAutoSelect(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">
                      自動選択（商品カテゴリ選択時に自動で選択）
                    </span>
                  </label>
                </div>
                <div className="flex gap-2">
                  {editingItemId ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateItem(editingItemId)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                      >
                        更新
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
                    >
                      作成
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* アイテム一覧 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">アイテム一覧</h3>
            {!selectedProduct ? (
              <p className="text-gray-500 text-sm">商品カテゴリを選択してください</p>
            ) : items.length === 0 ? (
              <p className="text-gray-500 text-sm">アイテムがまだありません</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-800">{item.name}</h4>
                          {item.auto_select && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              自動選択
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-blue-600">¥{item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditItem(item)}
                          className="text-blue-600 hover:text-blue-700 text-sm px-2"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="text-red-600 hover:text-red-700 text-sm px-2"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                    {item.description && <p className="text-sm text-gray-600">{item.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
