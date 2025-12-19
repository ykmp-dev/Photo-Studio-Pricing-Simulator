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
import type { ConditionalRule } from '../../types/formV3'
import { getErrorMessage } from '../../utils/errorMessages'
import SimpleConditionBuilder from './SimpleConditionBuilder'
import { formSectionLabels, productTypeLabels } from '../../utils/labelConverter'

interface CategoryManagerProps {
  shopId: number
  onHasChanges?: (hasChanges: boolean) => void
}

type View = 'shooting' | 'product' | 'items'

// 下書きアイテム型（新規作成の場合、idはマイナス値を使用）
type DraftItem = Item | Omit<Item, 'id' | 'created_at' | 'updated_at'> & { id: number }

export default function CategoryManager({ shopId, onHasChanges }: CategoryManagerProps) {
  const [view, setView] = useState<View>('shooting')

  // 本番データ（データベースから読み込んだ状態）
  const [publishedShooting, setPublishedShooting] = useState<ShootingCategory[]>([])
  const [publishedProduct, setPublishedProduct] = useState<ProductCategory[]>([])
  const [publishedItems, setPublishedItems] = useState<Item[]>([])

  // 下書きデータ（編集中の状態）
  const [draftShooting, setDraftShooting] = useState<ShootingCategory[]>([])
  const [draftProduct, setDraftProduct] = useState<ProductCategory[]>([])
  const [draftItems, setDraftItems] = useState<DraftItem[]>([])

  // 変更フラグ
  const [hasChanges, setHasChanges] = useState(false)

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

  // v3フォーム値
  const [formSection, setFormSection] = useState<'trigger' | 'conditional' | 'common_final' | ''>('')
  const [formProductType, setFormProductType] = useState<'plan' | 'option_single' | 'option_multi' | ''>('')
  const [formConditionalRule, setFormConditionalRule] = useState<ConditionalRule | null>(null)

  // 変更通知
  useEffect(() => {
    onHasChanges?.(hasChanges)
  }, [hasChanges, onHasChanges])

  // データ読み込み
  useEffect(() => {
    loadData()
  }, [shopId])

  useEffect(() => {
    if (view === 'items') {
      loadAllData()
    }
  }, [view])

  useEffect(() => {
    if (selectedProduct && view === 'items') {
      loadItems()
    }
  }, [selectedProduct, view])

  const loadAllData = async () => {
    try {
      const [shooting, product] = await Promise.all([
        getShootingCategories(shopId),
        getProductCategories(shopId),
      ])
      setPublishedShooting(shooting)
      setPublishedProduct(product)
      setDraftShooting(shooting)
      setDraftProduct(product)
    } catch (err) {
      console.error('データの読み込みに失敗しました:', err)
    }
  }

  const loadData = async () => {
    try {
      if (view === 'shooting') {
        const shooting = await getShootingCategories(shopId)
        setPublishedShooting(shooting)
        setDraftShooting(shooting)
      }
      if (view === 'product') {
        const product = await getProductCategories(shopId)
        setPublishedProduct(product)
        setDraftProduct(product)
      }
    } catch (err) {
      console.error('データの読み込みに失敗しました:', err)
    }
  }

  const loadItems = async () => {
    if (!selectedProduct) return
    try {
      const itemsData = await getItems(shopId, selectedProduct)
      setPublishedItems(itemsData)
      setDraftItems(itemsData)
    } catch (err) {
      console.error('アイテムの読み込みに失敗しました:', err)
    }
  }

  const handleCreateShooting = (e: React.FormEvent) => {
    e.preventDefault()
    const newId = -Math.floor(Math.random() * 1000000) // 負の値でテンポラリIDを作成
    const now = new Date().toISOString()
    const newCategory: ShootingCategory = {
      id: newId,
      shop_id: shopId,
      name: formName,
      display_name: formDisplayName,
      description: formDescription || null,
      sort_order: draftShooting.length,
      is_active: true,
      created_at: now,
      updated_at: now,
    }
    setDraftShooting([...draftShooting, newCategory])
    setHasChanges(true)
    resetForm()
  }

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault()

    const newId = -Math.floor(Math.random() * 1000000)
    const now = new Date().toISOString()
    const newCategory: ProductCategory = {
      id: newId,
      shop_id: shopId,
      name: formName,
      display_name: formDisplayName,
      description: formDescription || null,
      sort_order: draftProduct.length,
      is_active: true,
      created_at: now,
      updated_at: now,

      // v3フィールド
      form_section: formSection || null,
      product_type: formProductType || null,
      conditional_rule: formConditionalRule,
    }
    setDraftProduct([...draftProduct, newCategory])
    setHasChanges(true)
    resetForm()
  }

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedProduct) {
      alert('商品カテゴリを選択してください')
      return
    }
    const newId = -Math.floor(Math.random() * 1000000)
    const now = new Date().toISOString()
    const newItem: DraftItem = {
      id: newId,
      shop_id: shopId,
      product_category_id: selectedProduct,
      name: formDisplayName,
      price: formPrice,
      description: formDescription || null,
      sort_order: draftItems.length,
      is_active: true,
      is_required: false,
      auto_select: formAutoSelect,
      created_at: now,
      updated_at: now,
    }
    setDraftItems([...draftItems, newItem])
    setHasChanges(true)
    resetForm()
  }

  const handleUpdateShooting = (id: number) => {
    setDraftShooting(
      draftShooting.map((cat) =>
        cat.id === id
          ? {
              ...cat,
              name: formName,
              display_name: formDisplayName,
              description: formDescription || null,
              updated_at: new Date().toISOString(),
            }
          : cat
      )
    )
    setHasChanges(true)
    resetForm()
  }

  const handleUpdateProduct = (id: number) => {
    setDraftProduct(
      draftProduct.map((cat) =>
        cat.id === id
          ? {
              ...cat,
              name: formName,
              display_name: formDisplayName,
              description: formDescription || null,
              updated_at: new Date().toISOString(),

              // v3フィールド
              form_section: formSection || null,
              product_type: formProductType || null,
              conditional_rule: formConditionalRule,
            }
          : cat
      )
    )
    setHasChanges(true)
    resetForm()
  }

  const handleUpdateItem = (id: number) => {
    setDraftItems(
      draftItems.map((item) =>
        item.id === id
          ? {
              ...item,
              name: formDisplayName,
              price: formPrice,
              description: formDescription || null,
              auto_select: formAutoSelect,
              updated_at: new Date().toISOString(),
            }
          : item
      )
    )
    setHasChanges(true)
    resetForm()
  }

  const handleDeleteShooting = (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？\n※この変更は「更新」ボタンを押すまでデータベースに反映されません`)) return
    setDraftShooting(draftShooting.filter((cat) => cat.id !== id))
    setHasChanges(true)
  }

  const handleDeleteProduct = (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？\n※この変更は「更新」ボタンを押すまでデータベースに反映されません`)) return
    setDraftProduct(draftProduct.filter((cat) => cat.id !== id))
    setHasChanges(true)
  }

  const handleDeleteItem = (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？\n※この変更は「更新」ボタンを押すまでデータベースに反映されません`)) return
    setDraftItems(draftItems.filter((item) => item.id !== id))
    setHasChanges(true)
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

    // v3フィールドリセット
    setFormSection('')
    setFormProductType('')
    setFormConditionalRule(null)
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

    // v3フィールド
    setFormSection(category.form_section || '')
    setFormProductType(category.product_type || '')
    setFormConditionalRule(category.conditional_rule || null)
  }

  const startEditItem = (item: DraftItem) => {
    setFormDisplayName(item.name)
    setFormPrice(item.price)
    setFormDescription(item.description || '')
    setFormAutoSelect(item.auto_select)
    setEditingItemId(item.id)
  }

  // 下書きを本番に反映（データベースに保存）
  const handlePublish = async () => {
    if (!confirm('変更を保存しますか？')) return

    try {
      // 撮影カテゴリの同期
      for (const draft of draftShooting) {
        const published = publishedShooting.find((p) => p.id === draft.id)
        if (!published) {
          // 新規作成
          await createShootingCategory({
            shop_id: draft.shop_id,
            name: draft.name,
            display_name: draft.display_name,
            description: draft.description || undefined,
          })
        } else if (JSON.stringify(published) !== JSON.stringify(draft)) {
          // 更新
          await updateShootingCategory(draft.id, {
            name: draft.name,
            display_name: draft.display_name,
            description: draft.description || undefined,
          })
        }
      }

      // 削除された撮影カテゴリ
      for (const published of publishedShooting) {
        if (!draftShooting.find((d) => d.id === published.id)) {
          await deleteShootingCategory(published.id)
        }
      }

      // 商品カテゴリの同期
      for (const draft of draftProduct) {
        const published = publishedProduct.find((p) => p.id === draft.id)
        if (!published) {
          await createProductCategory({
            shop_id: draft.shop_id,
            name: draft.name,
            display_name: draft.display_name,
            description: draft.description || undefined,
          })
        } else if (JSON.stringify(published) !== JSON.stringify(draft)) {
          await updateProductCategory(draft.id, {
            name: draft.name,
            display_name: draft.display_name,
            description: draft.description || undefined,
          })
        }
      }

      // 削除された商品カテゴリ
      for (const published of publishedProduct) {
        if (!draftProduct.find((d) => d.id === published.id)) {
          await deleteProductCategory(published.id)
        }
      }

      // アイテムの同期
      for (const draft of draftItems) {
        const published = publishedItems.find((p) => p.id === draft.id)
        if (!published) {
          await createItem({
            shop_id: draft.shop_id,
            product_category_id: draft.product_category_id,
            name: draft.name,
            price: draft.price,
            description: draft.description || undefined,
            is_required: draft.is_required,
            auto_select: draft.auto_select,
          })
        } else if (JSON.stringify(published) !== JSON.stringify(draft)) {
          await updateItem(draft.id, {
            name: draft.name,
            price: draft.price,
            description: draft.description || undefined,
            is_required: draft.is_required,
            auto_select: draft.auto_select,
          })
        }
      }

      // 削除されたアイテム
      for (const published of publishedItems) {
        if (!draftItems.find((d) => d.id === published.id)) {
          await deleteItem(published.id)
        }
      }

      // 再読み込み
      await loadData()
      if (selectedProduct) {
        await loadItems()
      }
      setHasChanges(false)
      alert('変更を保存しました')
    } catch (err) {
      console.error('保存に失敗しました:', err)
      alert(getErrorMessage(err))
    }
  }

  // 下書きを破棄して本番データに戻す
  const handleDiscard = () => {
    if (!confirm('編集中の変更を破棄しますか？')) return
    setDraftShooting(publishedShooting)
    setDraftProduct(publishedProduct)
    setDraftItems(publishedItems)
    setHasChanges(false)
    resetForm()
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">カテゴリ・アイテム管理</h2>
          <p className="text-sm text-gray-600 mt-1">撮影カテゴリ → 商品カテゴリ → アイテムの3階層を管理</p>
        </div>
        {/* 更新・破棄ボタン */}
        {hasChanges && (
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
              {draftShooting.map((category) => (
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

              {/* v3フィールド */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-base font-bold text-gray-800 mb-4">📋 お客様画面での表示設定</h4>

                <div className="space-y-4">
                  {/* 表示タイミング */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      ① いつ表示しますか？
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                        style={{ borderColor: formSection === 'trigger' ? '#3b82f6' : '#e5e7eb', backgroundColor: formSection === 'trigger' ? '#eff6ff' : 'transparent' }}>
                        <input
                          type="radio"
                          value="trigger"
                          checked={formSection === 'trigger'}
                          onChange={(e) => setFormSection(e.target.value as any)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">最初に表示（必ず選択）</div>
                          <div className="text-xs text-gray-600 mt-1">
                            例: 撮影コース、撮影場所など、お客様が最初に選ぶ項目
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                        style={{ borderColor: formSection === 'conditional' ? '#3b82f6' : '#e5e7eb', backgroundColor: formSection === 'conditional' ? '#eff6ff' : 'transparent' }}>
                        <input
                          type="radio"
                          value="conditional"
                          checked={formSection === 'conditional'}
                          onChange={(e) => setFormSection(e.target.value as any)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">条件によって表示</div>
                          <div className="text-xs text-gray-600 mt-1">
                            例: スタジオ撮影を選んだ時だけ表示するヘアメイク
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                        style={{ borderColor: formSection === 'common_final' ? '#3b82f6' : '#e5e7eb', backgroundColor: formSection === 'common_final' ? '#eff6ff' : 'transparent' }}>
                        <input
                          type="radio"
                          value="common_final"
                          checked={formSection === 'common_final'}
                          onChange={(e) => setFormSection(e.target.value as any)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">最後に表示（追加オプション）</div>
                          <div className="text-xs text-gray-600 mt-1">
                            例: データ納品、アルバム追加など、どのコースでも選べる追加オプション
                          </div>
                        </div>
                      </label>
                      <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                        style={{ borderColor: formSection === '' ? '#3b82f6' : '#e5e7eb', backgroundColor: formSection === '' ? '#eff6ff' : 'transparent' }}>
                        <input
                          type="radio"
                          value=""
                          checked={formSection === ''}
                          onChange={(e) => setFormSection(e.target.value as any)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">フォームに表示しない</div>
                          <div className="text-xs text-gray-600 mt-1">
                            内部管理用など、お客様画面には表示しない
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* 選択方法 */}
                  {formSection && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <label className="block text-sm font-semibold text-gray-800 mb-2">
                        ② お客様はどう選びますか？
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                          style={{ borderColor: formProductType === 'plan' ? '#10b981' : '#e5e7eb', backgroundColor: formProductType === 'plan' ? '#f0fdf4' : 'transparent' }}>
                          <input
                            type="radio"
                            value="plan"
                            checked={formProductType === 'plan'}
                            onChange={(e) => setFormProductType(e.target.value as any)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">◉ 1つだけ選ぶ（丸ボタン）</div>
                            <div className="text-xs text-gray-600 mt-1">
                              コース選択など、複数の選択肢から1つだけ選ぶ場合
                            </div>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                          style={{ borderColor: formProductType === 'option_single' ? '#10b981' : '#e5e7eb', backgroundColor: formProductType === 'option_single' ? '#f0fdf4' : 'transparent' }}>
                          <input
                            type="radio"
                            value="option_single"
                            checked={formProductType === 'option_single'}
                            onChange={(e) => setFormProductType(e.target.value as any)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">▼ 1つだけ選ぶ（プルダウン）</div>
                            <div className="text-xs text-gray-600 mt-1">
                              選択肢が多い場合、省スペースで表示
                            </div>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                          style={{ borderColor: formProductType === 'option_multi' ? '#10b981' : '#e5e7eb', backgroundColor: formProductType === 'option_multi' ? '#f0fdf4' : 'transparent' }}>
                          <input
                            type="radio"
                            value="option_multi"
                            checked={formProductType === 'option_multi'}
                            onChange={(e) => setFormProductType(e.target.value as any)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">☑ 複数選べる（チェックボックス）</div>
                            <div className="text-xs text-gray-600 mt-1">
                              衣装追加、データ納品など、複数選択可能な追加オプション
                            </div>
                          </div>
                        </label>
                        <label className="flex items-start gap-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                          style={{ borderColor: formProductType === '' ? '#10b981' : '#e5e7eb', backgroundColor: formProductType === '' ? '#f0fdf4' : 'transparent' }}>
                          <input
                            type="radio"
                            value=""
                            checked={formProductType === ''}
                            onChange={(e) => setFormProductType(e.target.value as any)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">選択不要</div>
                            <div className="text-xs text-gray-600 mt-1">
                              表示のみ、または別の方法で選択
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* 条件設定（conditionalの場合のみ） */}
                  {formSection === 'conditional' && (
                    <div>
                      <SimpleConditionBuilder
                        value={formConditionalRule}
                        onChange={setFormConditionalRule}
                        availableFields={
                          draftProduct
                            .filter((cat) => cat.form_section === 'trigger')
                            .map((cat) => ({
                              value: `category_${cat.id}`,
                              label: cat.display_name
                            }))
                        }
                      />
                    </div>
                  )}

                  {/* プレビュー */}
                  {formSection && formProductType && (
                    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 text-xl">👁️</div>
                        <div className="flex-1">
                          <div className="font-semibold text-blue-900 mb-1">お客様画面のイメージ</div>
                          <div className="text-sm text-blue-800">
                            {formProductType === 'plan' && '◉ 丸ボタンで1つだけ選択できます'}
                            {formProductType === 'option_single' && '▼ プルダウンで1つだけ選択できます'}
                            {formProductType === 'option_multi' && '☑ チェックボックスで複数選択できます'}
                          </div>
                          <div className="text-xs text-blue-700 mt-2">
                            {formSection === 'trigger' && '※ 画面を開くと最初に表示されます'}
                            {formSection === 'conditional' && '※ 設定した条件に該当する場合のみ表示されます'}
                            {formSection === 'common_final' && '※ 他の選択の後、最後に表示されます'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
              {draftProduct.map((category) => (
                <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {category.form_section && (
                          <span className="text-lg">
                            {category.form_section === 'trigger' && '📸'}
                            {category.form_section === 'conditional' && '👗'}
                            {category.form_section === 'common_final' && '📚'}
                          </span>
                        )}
                        <h4 className="font-semibold text-gray-800">{category.display_name}</h4>
                      </div>
                      {category.form_section && (
                        <p className="text-xs text-gray-600">
                          {formSectionLabels[category.form_section]}
                          {category.product_type && ` / ${productTypeLabels[category.product_type]}`}
                        </p>
                      )}
                      {!category.form_section && (
                        <p className="text-xs text-gray-400">未設定</p>
                      )}
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
              {draftProduct.map((category) => (
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
            ) : draftItems.filter((i) => i.product_category_id === selectedProduct).length === 0 ? (
              <p className="text-gray-500 text-sm">アイテムがまだありません</p>
            ) : (
              <div className="space-y-2">
                {draftItems
                  .filter((i) => i.product_category_id === selectedProduct)
                  .map((item) => (
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
