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
import { getShootingCategories, getProductCategories } from '../../services/categoryService'
import type { FormSchema, FormBlock, BlockType, FormSchemaWithBlocks, ShowCondition } from '../../types/formBuilder'
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
      await createFormBlock({
        form_schema_id: selectedFormId,
        block_type: blockType,
        content: blockContent || undefined,
        metadata: blockType === 'category_reference' && blockProductCategoryId
          ? { product_category_id: blockProductCategoryId }
          : {},
        show_condition: conditionEnabled ? blockShowCondition : null,
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
      await updateFormBlock(id, {
        block_type: blockType,
        content: blockContent || undefined,
        metadata: blockType === 'category_reference' && blockProductCategoryId
          ? { product_category_id: blockProductCategoryId }
          : {},
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
    setEditingBlockId(block.id)
  }

  const getBlockTypeLabel = (type: BlockType): string => {
    const labels: Record<BlockType, string> = {
      text: 'テキスト',
      heading: '見出し',
      list: 'リスト', // 非推奨だが、既存データのため残す
      category_reference: 'カテゴリ参照',
      yes_no: 'Yes/No質問',
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
                    <div className="flex gap-1">
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
                  {!form.is_active && (
                    <span className="inline-block text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                      非アクティブ
                    </span>
                  )}
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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedForm.name} のブロック管理
              </h3>

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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        内容 {blockType !== 'category_reference' && <span className="text-red-500">*</span>}
                      </label>
                      <textarea
                        value={blockContent}
                        onChange={(e) => setBlockContent(e.target.value)}
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        rows={blockType === 'yes_no' ? 2 : 6}
                        placeholder={
                          blockType === 'heading'
                            ? '## 見出しテキスト'
                            : blockType === 'category_reference'
                            ? '説明テキスト（任意）'
                            : blockType === 'yes_no'
                            ? 'ご家族の支度はありますか？'
                            : 'テキストを入力'
                        }
                        required={blockType !== 'category_reference'}
                      />
                    </div>

                    {/* 条件設定 (Yes/Noブロック以外で設定可能) */}
                    {blockType !== 'yes_no' && selectedForm && selectedForm.blocks.some(b => b.block_type === 'yes_no') && (
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
                                    setBlockShowCondition({
                                      type: 'yes_no',
                                      block_id: blockId,
                                      value: blockShowCondition?.value || 'yes'
                                    })
                                  }
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                                required={conditionEnabled}
                              >
                                <option value="">選択してください</option>
                                {selectedForm.blocks
                                  .filter(b => b.block_type === 'yes_no')
                                  .map(b => (
                                    <option key={b.id} value={b.id}>
                                      {b.content || `ブロック ${b.id}`}
                                    </option>
                                  ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">表示条件</label>
                              <select
                                value={blockShowCondition?.value || 'yes'}
                                onChange={(e) => {
                                  if (blockShowCondition) {
                                    setBlockShowCondition({
                                      ...blockShowCondition,
                                      value: e.target.value as 'yes' | 'no'
                                    })
                                  }
                                }}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="yes">「はい」の場合に表示</option>
                                <option value="no">「いいえ」の場合に表示</option>
                              </select>
                            </div>
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
                      {selectedForm.blocks.map((block, index) => (
                        <div key={block.id} className="border border-gray-200 rounded p-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <span className="inline-block text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded mb-1">
                                {getBlockTypeLabel(block.block_type)}
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
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
