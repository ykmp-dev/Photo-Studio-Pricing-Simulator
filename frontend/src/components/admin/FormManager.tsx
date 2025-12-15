import { useState, useEffect } from 'react'
import {
  getFormSchemas,
  getFormWithBlocks,
  createFormSchema,
  updateFormSchema,
  deleteFormSchema,
  createFormBlock,
  updateFormBlock,
  deleteFormBlock,
  updateBlocksOrder,
} from '../../services/formBuilderService'
import { getShootingCategories, getProductCategories, getItems } from '../../services/categoryService'
import type { FormSchema, FormBlock, BlockType, FormSchemaWithBlocks, ShowCondition, ChoiceOption } from '../../types/formBuilder'
import type { ShootingCategory } from '../../types/category'
import { getErrorMessage, getSuccessMessage } from '../../utils/errorMessages'

interface FormManagerProps {
  shopId: number
}

export default function FormManager({ shopId }: FormManagerProps) {
  const [forms, setForms] = useState<FormSchema[]>([])
  const [shootingCategories, setShootingCategories] = useState<ShootingCategory[]>([])
  const [productCategories, setProductCategories] = useState<any[]>([])
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null)
  const [selectedForm, setSelectedForm] = useState<FormSchemaWithBlocks | null>(null)
  const [loading, setLoading] = useState(true)

  // フォーム作成・編集用の状態
  const [editingFormId, setEditingFormId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formShootingCategoryId, setFormShootingCategoryId] = useState<number | null>(null)
  const [formIsActive, setFormIsActive] = useState(true)

  // ブロック作成・編集用の状態
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null)
  const [blockType, setBlockType] = useState<BlockType>('text')
  const [blockContent, setBlockContent] = useState('')
  const [blockProductCategoryId, setBlockProductCategoryId] = useState<number | null>(null)
  const [blockShowCondition, setBlockShowCondition] = useState<ShowCondition | null>(null)
  const [conditionEnabled, setConditionEnabled] = useState(false)

  // Choice ブロック専用の状態
  const [blockChoiceOptions, setBlockChoiceOptions] = useState<ChoiceOption[]>([])
  const [blockChoiceDisplay, setBlockChoiceDisplay] = useState<'radio' | 'select' | 'auto'>('auto')
  const [blockChoiceInputMode, setBlockChoiceInputMode] = useState<'manual' | 'category'>('manual')
  const [blockChoiceCategoryId, setBlockChoiceCategoryId] = useState<number | null>(null)

  // プレビューモーダル
  const [showPreview, setShowPreview] = useState(false)
  const [previewYesNoAnswers, setPreviewYesNoAnswers] = useState<Map<number, 'yes' | 'no'>>(new Map())

  useEffect(() => {
    loadData()
  }, [shopId])

  useEffect(() => {
    if (selectedFormId) {
      loadFormWithBlocks(selectedFormId)
    }
  }, [selectedFormId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [formsData, categoriesData, productCategoriesData] = await Promise.all([
        getFormSchemas(shopId),
        getShootingCategories(shopId),
        getProductCategories(shopId),
      ])
      setForms(formsData)
      setShootingCategories(categoriesData)
      setProductCategories(productCategoriesData)
    } catch (err) {
      console.error('データの読み込みに失敗しました:', err)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const loadFormWithBlocks = async (formId: number) => {
    try {
      const form = await getFormWithBlocks(formId)
      setSelectedForm(form)
    } catch (err) {
      console.error('フォームの読み込みに失敗しました:', err)
    }
  }

  const handleCreateForm = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createFormSchema({
        shop_id: shopId,
        name: formName,
        description: formDescription || undefined,
        shooting_category_id: formShootingCategoryId || undefined,
        is_active: formIsActive,
      })
      resetFormForm()
      await loadData()
      alert(getSuccessMessage('create', 'フォーム'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleUpdateForm = async (id: number) => {
    try {
      await updateFormSchema(id, {
        name: formName,
        description: formDescription || undefined,
        shooting_category_id: formShootingCategoryId || undefined,
        is_active: formIsActive,
      })
      resetFormForm()
      await loadData()
      if (selectedFormId === id) {
        await loadFormWithBlocks(id)
      }
      alert(getSuccessMessage('update', 'フォーム'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleDeleteForm = async (id: number, name: string) => {
    if (!confirm(`「${name}」を削除しますか？`)) return
    try {
      await deleteFormSchema(id)
      if (selectedFormId === id) {
        setSelectedFormId(null)
        setSelectedForm(null)
      }
      await loadData()
      alert(getSuccessMessage('delete', 'フォーム'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFormId) {
      alert('フォームを選択してください')
      return
    }
    try {
      // 最下層に追加: 現在の最大sort_order + 1
      const maxSortOrder = selectedForm?.blocks.reduce((max, block) =>
        Math.max(max, block.sort_order), -1) ?? -1

      // メタデータの構築
      let metadata: any = {}
      if (blockType === 'category_reference' && blockProductCategoryId) {
        metadata = { product_category_id: blockProductCategoryId }
      } else if (blockType === 'choice') {
        if (blockChoiceInputMode === 'category' && blockChoiceCategoryId) {
          // カテゴリ連動モード
          metadata = {
            auto_sync_category_id: blockChoiceCategoryId,
            choice_display: blockChoiceDisplay,
          }
        } else {
          // 手動入力モード
          metadata = {
            choice_options: blockChoiceOptions,
            choice_display: blockChoiceDisplay,
          }
        }
      }

      await createFormBlock({
        form_schema_id: selectedFormId,
        block_type: blockType,
        content: blockContent || undefined,
        metadata,
        show_condition: conditionEnabled ? blockShowCondition : null,
        sort_order: maxSortOrder + 1,
      })
      resetBlockForm()
      await loadFormWithBlocks(selectedFormId)
      alert(getSuccessMessage('create', 'ブロック'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleUpdateBlock = async (id: number) => {
    try {
      // メタデータの構築
      let metadata: any = {}
      if (blockType === 'category_reference' && blockProductCategoryId) {
        metadata = { product_category_id: blockProductCategoryId }
      } else if (blockType === 'choice') {
        if (blockChoiceInputMode === 'category' && blockChoiceCategoryId) {
          // カテゴリ連動モード
          metadata = {
            auto_sync_category_id: blockChoiceCategoryId,
            choice_display: blockChoiceDisplay,
          }
        } else {
          // 手動入力モード
          metadata = {
            choice_options: blockChoiceOptions,
            choice_display: blockChoiceDisplay,
          }
        }
      }

      await updateFormBlock(id, {
        block_type: blockType,
        content: blockContent || undefined,
        metadata,
        show_condition: conditionEnabled ? blockShowCondition : null,
      })
      resetBlockForm()
      if (selectedFormId) {
        await loadFormWithBlocks(selectedFormId)
      }
      alert(getSuccessMessage('update', 'ブロック'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleDeleteBlock = async (id: number) => {
    if (!confirm('このブロックを削除しますか？')) return
    try {
      await deleteFormBlock(id)
      if (selectedFormId) {
        await loadFormWithBlocks(selectedFormId)
      }
      alert(getSuccessMessage('delete', 'ブロック'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  const handleMoveBlockUp = async (index: number) => {
    if (!selectedForm || index === 0) return

    const newBlocks = [...selectedForm.blocks]
    ;[newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]]

    // UIを即座に更新
    setSelectedForm({ ...selectedForm, blocks: newBlocks })

    // サーバーに保存
    try {
      await updateBlocksOrder(newBlocks.map((b) => b.id))
    } catch (err) {
      console.error(err)
      alert('並び順の更新に失敗しました')
      if (selectedFormId) {
        await loadFormWithBlocks(selectedFormId) // 失敗したら元に戻す
      }
    }
  }

  const handleMoveBlockDown = async (index: number) => {
    if (!selectedForm || index === selectedForm.blocks.length - 1) return

    const newBlocks = [...selectedForm.blocks]
    ;[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]

    // UIを即座に更新
    setSelectedForm({ ...selectedForm, blocks: newBlocks })

    // サーバーに保存
    try {
      await updateBlocksOrder(newBlocks.map((b) => b.id))
    } catch (err) {
      console.error(err)
      alert('並び順の更新に失敗しました')
      if (selectedFormId) {
        await loadFormWithBlocks(selectedFormId) // 失敗したら元に戻す
      }
    }
  }

  const resetFormForm = () => {
    setFormName('')
    setFormDescription('')
    setFormShootingCategoryId(null)
    setFormIsActive(true)
    setEditingFormId(null)
  }

  const resetBlockForm = () => {
    setBlockType('text')
    setBlockContent('')
    setBlockProductCategoryId(null)
    setBlockShowCondition(null)
    setConditionEnabled(false)
    setBlockChoiceOptions([])
    setBlockChoiceDisplay('auto')
    setBlockChoiceInputMode('manual')
    setBlockChoiceCategoryId(null)
    setEditingBlockId(null)
  }

  const startEditForm = (form: FormSchema) => {
    setFormName(form.name)
    setFormDescription(form.description || '')
    setFormShootingCategoryId(form.shooting_category_id)
    setFormIsActive(form.is_active)
    setEditingFormId(form.id)
  }

  const startEditBlock = (block: FormBlock) => {
    setBlockType(block.block_type)
    setBlockContent(block.content || '')
    setBlockProductCategoryId(block.metadata?.product_category_id || null)
    setBlockShowCondition(block.show_condition || null)
    setConditionEnabled(block.show_condition !== null)
    setBlockChoiceOptions(block.metadata?.choice_options || [])
    setBlockChoiceDisplay(block.metadata?.choice_display || 'auto')
    setBlockChoiceInputMode(block.metadata?.auto_sync_category_id ? 'category' : 'manual')
    setBlockChoiceCategoryId(block.metadata?.auto_sync_category_id || null)
    setEditingBlockId(block.id)
  }

  // カテゴリからChoice選択肢を自動生成
  const handleGenerateChoicesFromCategory = async (categoryId: number) => {
    try {
      const items = await getItems(shopId, categoryId)
      const options: ChoiceOption[] = items.map(item => ({
        value: `item_${item.id}`,
        label: item.name,
        price: item.price,
        description: item.description || undefined,
      }))
      setBlockChoiceOptions(options)
    } catch (err) {
      console.error('アイテムの取得に失敗しました:', err)
      alert('アイテムの取得に失敗しました')
    }
  }

  // プレビューモーダルを開く
  const handleOpenPreview = () => {
    setPreviewYesNoAnswers(new Map())
    setShowPreview(true)
  }

  const getBlockTypeLabel = (type: BlockType): string => {
    const labels: Record<BlockType, string> = {
      text: 'テキスト',
      heading: '見出し',
      list: 'リスト', // 非推奨だが、既存データのため残す
      category_reference: 'カテゴリ参照',
      yes_no: 'Yes/No質問',
      choice: '選択肢質問',
    }
    return labels[type]
  }

  if (loading) {
    return <div className="text-gray-500">読み込み中...</div>
  }

  return (
    <div className="space-y-6">
      {/* ヘッダー */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800">フォームビルダー</h2>
        <p className="text-sm text-gray-600 mt-1">撮影カテゴリごとのフォームを作成・管理</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* フォーム一覧 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">フォーム一覧</h3>

          {/* フォーム作成フォーム */}
          <form onSubmit={handleCreateForm} className="mb-4 space-y-3 pb-4 border-b border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                フォーム名 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                placeholder="七五三撮影フォーム"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">撮影カテゴリ</label>
              <select
                value={formShootingCategoryId || ''}
                onChange={(e) => setFormShootingCategoryId(e.target.value ? Number(e.target.value) : null)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">選択してください</option>
                {shootingCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                rows={2}
              />
            </div>

            <div className="flex gap-2">
              {editingFormId ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpdateForm(editingFormId)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
                  >
                    更新
                  </button>
                  <button
                    type="button"
                    onClick={resetFormForm}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                  >
                    キャンセル
                  </button>
                </>
              ) : (
                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                >
                  作成
                </button>
              )}
            </div>
          </form>

          {/* フォームリスト */}
          <div className="space-y-2">
            {forms.map((form) => {
              const category = shootingCategories.find((c) => c.id === form.shooting_category_id)
              return (
                <div
                  key={form.id}
                  className={`border rounded p-3 cursor-pointer transition-colors ${
                    selectedFormId === form.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedFormId(form.id)}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800 text-sm">{form.name}</h4>
                      {category && (
                        <p className="text-xs text-blue-600 mt-1">📋 {category.display_name}</p>
                      )}
                    </div>
                    <div className="flex gap-1 items-center">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          const newStatus = !form.is_active
                          const action = newStatus ? '公開' : '非公開'
                          if (!confirm(`「${form.name}」を${action}にしますか？`)) return
                          try {
                            await updateFormSchema(form.id, { is_active: newStatus })
                            await loadData()
                            if (selectedFormId === form.id) {
                              await loadFormWithBlocks(selectedFormId)
                            }
                            alert(`フォームを${action}にしました`)
                          } catch (err) {
                            console.error(err)
                            alert(`${action}に失敗しました: ` + getErrorMessage(err))
                          }
                        }}
                        className={`text-xs px-2 py-1 rounded ${
                          form.is_active
                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={form.is_active ? '非公開にする' : '公開する'}
                      >
                        {form.is_active ? '🔒' : '🚀'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          startEditForm(form)
                        }}
                        className="text-blue-600 hover:text-blue-700 text-xs px-2"
                      >
                        編集
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteForm(form.id, form.name)
                        }}
                        className="text-red-600 hover:text-red-700 text-xs px-2"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded ${
                      form.is_active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {form.is_active ? '✅ 公開中' : '⚪ 非公開'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ブロック管理 */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-6">
          {!selectedForm ? (
            <div className="text-center text-gray-500 py-12">
              左側からフォームを選択してください
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {selectedForm.name} のブロック管理
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleOpenPreview}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
                  >
                    👁️ プレビュー
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('フォームの設定を更新しますか？')) return
                      try {
                        // Reload to reflect any unsaved changes
                        await loadData()
                        if (selectedFormId) {
                          await loadFormWithBlocks(selectedFormId)
                        }
                        alert('フォームを更新しました')
                      } catch (err) {
                        console.error(err)
                        alert('更新に失敗しました: ' + getErrorMessage(err))
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    🔄 更新
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* ブロック作成フォーム */}
                <div className="border-r border-gray-200 pr-6">
                  <h4 className="font-medium text-gray-700 mb-3">ブロック追加</h4>
                  <form onSubmit={handleCreateBlock} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ブロックタイプ <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={blockType}
                        onChange={(e) => setBlockType(e.target.value as BlockType)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                      >
                        <option value="text">テキスト</option>
                        <option value="heading">見出し</option>
                        <option value="yes_no">Yes/No質問</option>
                        <option value="choice">選択肢質問 (3+ 選択肢)</option>
                        <option value="category_reference">カテゴリ参照</option>
                      </select>
                    </div>

                    {blockType === 'category_reference' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          商品カテゴリ <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={blockProductCategoryId || ''}
                          onChange={(e) => setBlockProductCategoryId(e.target.value ? Number(e.target.value) : null)}
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          required
                        >
                          <option value="">選択してください</option>
                          {productCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.display_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Choice ブロック専用UI */}
                    {blockType === 'choice' && (
                      <div className="space-y-3 border border-purple-200 rounded-lg p-3 bg-purple-50">
                        <h5 className="font-medium text-purple-900 text-sm">選択肢設定</h5>

                        {/* 選択肢の入力方法 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">選択肢の入力方法</label>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="choiceInputMode"
                                value="manual"
                                checked={blockChoiceInputMode === 'manual'}
                                onChange={(e) => setBlockChoiceInputMode(e.target.value as 'manual' | 'category')}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-sm">手動入力</span>
                            </label>
                            <label className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="choiceInputMode"
                                value="category"
                                checked={blockChoiceInputMode === 'category'}
                                onChange={(e) => setBlockChoiceInputMode(e.target.value as 'manual' | 'category')}
                                className="w-4 h-4 text-purple-600"
                              />
                              <span className="text-sm">商品カテゴリから自動生成</span>
                            </label>
                          </div>
                        </div>

                        {/* カテゴリ連動モードの場合 */}
                        {blockChoiceInputMode === 'category' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              商品カテゴリ <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={blockChoiceCategoryId || ''}
                              onChange={async (e) => {
                                const categoryId = e.target.value ? Number(e.target.value) : null
                                setBlockChoiceCategoryId(categoryId)
                                if (categoryId) {
                                  await handleGenerateChoicesFromCategory(categoryId)
                                }
                              }}
                              className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                              required
                            >
                              <option value="">選択してください</option>
                              {productCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.display_name} ({cat.items?.length || 0}個のアイテム)
                                </option>
                              ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">
                              ※カテゴリのアイテムが更新されると、選択肢も自動的に更新されます
                            </p>
                          </div>
                        )}

                        {/* 表示方式選択 */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">表示方式</label>
                          <select
                            value={blockChoiceDisplay}
                            onChange={(e) => setBlockChoiceDisplay(e.target.value as 'radio' | 'select' | 'auto')}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                          >
                            <option value="auto">自動判定（2-3個: ラジオ、4個以上: ドロップダウン）</option>
                            <option value="radio">ラジオボタン</option>
                            <option value="select">ドロップダウン</option>
                          </select>
                        </div>

                        {/* 選択肢一覧 */}
                        {blockChoiceOptions.length > 0 && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">選択肢一覧</label>
                            <div className="space-y-2">
                              {blockChoiceOptions.map((option, index) => (
                                <div key={index} className="bg-white border border-gray-300 rounded p-2 text-xs">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-800">{option.label}</div>
                                      <div className="text-gray-600 mt-1">
                                        <span className="font-mono bg-gray-100 px-1 rounded">value: {option.value}</span>
                                        <span className="ml-2 font-semibold text-purple-600">
                                          {option.price > 0 ? `+${option.price.toLocaleString()}円` : '0円'}
                                        </span>
                                      </div>
                                      {option.description && (
                                        <div className="text-gray-500 mt-1">{option.description}</div>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBlockChoiceOptions(prev => prev.filter((_, i) => i !== index))
                                      }}
                                      className="text-red-600 hover:text-red-700 ml-2"
                                    >
                                      削除
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 選択肢追加フォーム（手動入力モードのみ） */}
                        {blockChoiceInputMode === 'manual' && (
                        <div className="border-t border-purple-200 pt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">新しい選択肢を追加</label>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="内部値 (例: light_plan)"
                              id="new-choice-value"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                            <input
                              type="text"
                              placeholder="表示テキスト (例: ライトコース)"
                              id="new-choice-label"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                            <input
                              type="number"
                              placeholder="料金（税込、円）"
                              id="new-choice-price"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              min="0"
                              step="1"
                            />
                            <input
                              type="text"
                              placeholder="説明（オプション）"
                              id="new-choice-description"
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const valueInput = document.getElementById('new-choice-value') as HTMLInputElement
                                const labelInput = document.getElementById('new-choice-label') as HTMLInputElement
                                const priceInput = document.getElementById('new-choice-price') as HTMLInputElement
                                const descInput = document.getElementById('new-choice-description') as HTMLInputElement

                                const value = valueInput?.value.trim()
                                const label = labelInput?.value.trim()
                                const price = parseInt(priceInput?.value || '0')
                                const description = descInput?.value.trim()

                                if (!value || !label) {
                                  alert('内部値と表示テキストは必須です')
                                  return
                                }

                                setBlockChoiceOptions(prev => [...prev, {
                                  value,
                                  label,
                                  price: price || 0,
                                  description: description || undefined,
                                }])

                                // フォームをクリア
                                if (valueInput) valueInput.value = ''
                                if (labelInput) labelInput.value = ''
                                if (priceInput) priceInput.value = ''
                                if (descInput) descInput.value = ''
                              }}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm font-medium"
                            >
                              ＋ 選択肢を追加
                            </button>
                          </div>
                        </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        内容 {blockType !== 'category_reference' && blockType !== 'choice' && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        value={blockContent}
                        onChange={(e) => setBlockContent(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        rows={blockType === 'yes_no' || blockType === 'choice' ? 2 : 6}
                        placeholder={
                          blockType === 'heading'
                            ? '## 見出しテキスト'
                            : blockType === 'category_reference'
                            ? '説明テキスト（任意）'
                            : blockType === 'yes_no'
                            ? 'ご家族の支度はありますか？'
                            : blockType === 'choice'
                            ? '撮影プランをお選びください'
                            : 'テキストを入力'
                        }
                        required={blockType !== 'category_reference'}
                      />
                    </div>

                    {/* 条件設定 (Yes/No/Choiceブロック以外で設定可能) */}
                    {blockType !== 'yes_no' && blockType !== 'choice' && selectedForm &&
                     selectedForm.blocks.some(b => b.block_type === 'yes_no' || b.block_type === 'choice') && (
                      <div className="border-t border-gray-200 pt-3">
                        <label className="flex items-center gap-2 mb-2">
                          <input
                            type="checkbox"
                            checked={conditionEnabled}
                            onChange={(e) => {
                              setConditionEnabled(e.target.checked)
                              if (!e.target.checked) {
                                setBlockShowCondition(null)
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-sm font-medium text-gray-700">表示条件を設定</span>
                        </label>

                        {conditionEnabled && (
                          <div className="space-y-2 ml-6">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">条件元ブロック</label>
                              <select
                                value={blockShowCondition?.block_id || ''}
                                onChange={(e) => {
                                  const blockId = e.target.value ? Number(e.target.value) : null
                                  if (blockId) {
                                    const sourceBlock = selectedForm.blocks.find(b => b.id === blockId)
                                    if (sourceBlock) {
                                      setBlockShowCondition({
                                        type: sourceBlock.block_type as 'yes_no' | 'choice',
                                        block_id: blockId,
                                        value: sourceBlock.block_type === 'yes_no'
                                          ? 'yes'
                                          : sourceBlock.metadata?.choice_options?.[0]?.value || ''
                                      })
                                    }
                                  }
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                required={conditionEnabled}
                              >
                                <option value="">選択してください</option>
                                {selectedForm.blocks
                                  .filter(b => b.block_type === 'yes_no' || b.block_type === 'choice')
                                  .map(b => (
                                    <option key={b.id} value={b.id}>
                                      [{b.block_type === 'yes_no' ? 'Yes/No' : '選択肢'}] {b.content || `ブロック ${b.id}`}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            {blockShowCondition && (
                              <div>
                                <label className="block text-xs text-gray-600 mb-1">表示条件</label>
                                {(() => {
                                  const sourceBlock = selectedForm.blocks.find(b => b.id === blockShowCondition.block_id)
                                  if (!sourceBlock) return null

                                  if (sourceBlock.block_type === 'yes_no') {
                                    return (
                                      <select
                                        value={blockShowCondition.value}
                                        onChange={(e) => {
                                          setBlockShowCondition({
                                            ...blockShowCondition,
                                            value: e.target.value
                                          })
                                        }}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                      >
                                        <option value="yes">「はい」の場合に表示</option>
                                        <option value="no">「いいえ」の場合に表示</option>
                                      </select>
                                    )
                                  } else if (sourceBlock.block_type === 'choice') {
                                    const options = sourceBlock.metadata?.choice_options || []
                                    return (
                                      <select
                                        value={blockShowCondition.value}
                                        onChange={(e) => {
                                          setBlockShowCondition({
                                            ...blockShowCondition,
                                            value: e.target.value
                                          })
                                        }}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                      >
                                        {options.map(opt => (
                                          <option key={opt.value} value={opt.value}>
                                            「{opt.label}」の場合に表示
                                          </option>
                                        ))}
                                      </select>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {editingBlockId ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateBlock(editingBlockId)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium"
                          >
                            更新
                          </button>
                          <button
                            type="button"
                            onClick={resetBlockForm}
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                          >
                            キャンセル
                          </button>
                        </>
                      ) : (
                        <button
                          type="submit"
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium"
                        >
                          追加
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* ブロック一覧 */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">ブロック一覧</h4>
                  {selectedForm.blocks.length === 0 ? (
                    <p className="text-sm text-gray-500">ブロックがまだありません</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedForm.blocks.map((block, index) => {
                        // カテゴリ参照ブロックの場合、選択されているカテゴリ名を取得
                        const categoryName = block.block_type === 'category_reference' && block.metadata?.product_category_id
                          ? productCategories.find(cat => cat.id === block.metadata.product_category_id)?.display_name || '不明なカテゴリ'
                          : null

                        return (
                        <div key={block.id} className="border border-gray-200 rounded p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mb-1">
                                {getBlockTypeLabel(block.block_type)}
                                {categoryName && ` : ${categoryName}`}
                              </span>
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {block.content || '(内容なし)'}
                              </p>
                            </div>
                            <div className="flex gap-1 ml-2">
                              <button
                                onClick={() => handleMoveBlockUp(index)}
                                disabled={index === 0}
                                className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded disabled:text-gray-300 disabled:cursor-not-allowed"
                                title="上へ"
                              >
                                ↑
                              </button>
                              <button
                                onClick={() => handleMoveBlockDown(index)}
                                disabled={index === selectedForm.blocks.length - 1}
                                className="px-2 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded disabled:text-gray-300 disabled:cursor-not-allowed"
                                title="下へ"
                              >
                                ↓
                              </button>
                              <button
                                onClick={() => startEditBlock(block)}
                                className="text-blue-600 hover:text-blue-700 text-xs px-2"
                              >
                                編集
                              </button>
                              <button
                                onClick={() => handleDeleteBlock(block.id)}
                                className="text-red-600 hover:text-red-700 text-xs px-2"
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
            </>
          )}
        </div>
      </div>

      {/* プレビューモーダル */}
      {showPreview && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800">
                📋 {selectedForm.name} - プレビュー
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              {selectedForm.description && (
                <p className="text-sm text-gray-600 mb-4">{selectedForm.description}</p>
              )}

              <div className="space-y-4">
                {selectedForm.blocks.map((block) => {
                  // 表示条件のチェック
                  if (block.show_condition) {
                    const requiredAnswer = previewYesNoAnswers.get(block.show_condition.block_id)
                    if (requiredAnswer !== block.show_condition.value) {
                      return null
                    }
                  }

                  // 見出しブロック
                  if (block.block_type === 'heading') {
                    return (
                      <div key={block.id}>
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">
                          {block.content?.replace(/^##\s*/, '')}
                        </h2>
                      </div>
                    )
                  }

                  // テキストブロック
                  if (block.block_type === 'text') {
                    return (
                      <div key={block.id} className="text-gray-700">
                        {block.content}
                      </div>
                    )
                  }

                  // Yes/No質問ブロック
                  if (block.block_type === 'yes_no') {
                    const answer = previewYesNoAnswers.get(block.id)
                    return (
                      <div key={block.id} className="border border-gray-300 rounded-lg p-4">
                        <p className="text-sm font-medium text-gray-800 mb-3">{block.content}</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              const newAnswers = new Map(previewYesNoAnswers)
                              newAnswers.set(block.id, 'yes')
                              setPreviewYesNoAnswers(newAnswers)
                            }}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              answer === 'yes'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            はい
                          </button>
                          <button
                            onClick={() => {
                              const newAnswers = new Map(previewYesNoAnswers)
                              newAnswers.set(block.id, 'no')
                              setPreviewYesNoAnswers(newAnswers)
                            }}
                            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                              answer === 'no'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            いいえ
                          </button>
                        </div>
                      </div>
                    )
                  }

                  // カテゴリ参照ブロック
                  if (block.block_type === 'category_reference') {
                    const productCategory = productCategories.find(
                      (pc) => pc.id === block.metadata?.product_category_id
                    )

                    if (!productCategory) {
                      return (
                        <div key={block.id} className="text-sm text-red-600">
                          カテゴリが見つかりません (ID: {block.metadata?.product_category_id})
                        </div>
                      )
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
                          <p className="text-xs text-gray-500">
                            ※ プレビューでは実際のアイテムは表示されません
                          </p>
                        </div>
                      </div>
                    )
                  }

                  return null
                })}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowPreview(false)}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
