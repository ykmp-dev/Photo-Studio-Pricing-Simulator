import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getFormWithBlocks,
  saveFormBlocks,
  publishFormSchema,
  createFormBlock,
  updateFormBlock,
  deleteFormBlock,
  updateBlocksOrder,
} from '../services/formBuilderService'
import { getProductCategories, getItems } from '../services/categoryService'
import type { FormSchemaWithBlocks, FormBlock, BlockType, ShowCondition, ChoiceOption } from '../types/formBuilder'
import FormBuilderCanvas from '../components/admin/FormBuilderCanvas'
import { getErrorMessage, getSuccessMessage } from '../utils/errorMessages'
import { createLogger } from '../utils/logger'

const logger = createLogger('FormBlockEditorPage')

type ViewMode = 'list' | 'node' | 'tree'

export default function FormBlockEditorPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormSchemaWithBlocks | null>(null)
  const [localBlocks, setLocalBlocks] = useState<FormBlock[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [productCategories, setProductCategories] = useState<Array<{ id: number; display_name: string; items?: any[] }>>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('node')

  // ブロック作成・編集用の状態（リストビュー用）
  const [editingBlockId, setEditingBlockId] = useState<number | null>(null)
  const [blockType, setBlockType] = useState<BlockType>('text')
  const [blockContent, setBlockContent] = useState('')
  const [blockProductCategoryId, setBlockProductCategoryId] = useState<number | null>(null)
  const [blockShowCondition, setBlockShowCondition] = useState<ShowCondition | null>(null)
  const [conditionEnabled, setConditionEnabled] = useState(false)
  const [blockChoiceOptions, setBlockChoiceOptions] = useState<ChoiceOption[]>([])
  const [blockChoiceDisplay, setBlockChoiceDisplay] = useState<'radio' | 'select' | 'auto'>('auto')
  const [blockChoiceInputMode, setBlockChoiceInputMode] = useState<'manual' | 'category'>('manual')
  const [blockChoiceCategoryId, setBlockChoiceCategoryId] = useState<number | null>(null)

  useEffect(() => {
    logger.info('Component mounted', { formId })
    loadFormAndCategories()
  }, [formId])

  // 未保存の変更がある場合、ページ離脱時に警告
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault()
        e.returnValue = ''
        return ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasChanges])

  const loadFormAndCategories = async () => {
    logger.functionStart('loadFormAndCategories', { formId })

    if (!formId) {
      logger.warn('No formId provided')
      return
    }

    try {
      logger.info('Setting loading state to true')
      setLoading(true)

      logger.apiRequest('GET', `forms/${formId}`)
      logger.apiRequest('GET', 'product-categories')

      const [formData, categoriesData] = await Promise.all([
        getFormWithBlocks(parseInt(formId)),
        getProductCategories(1), // TODO: shopIdを動的に取得
      ])

      logger.apiResponse('GET', `forms/${formId}`, {
        formName: formData?.name,
        blocksCount: formData?.blocks.length
      })
      logger.apiResponse('GET', 'product-categories', { count: categoriesData.length })

      if (formData) {
        logger.info('Form data loaded successfully', {
          formId: formData.id,
          formName: formData.name,
          blocksCount: formData.blocks.length,
          status: formData.status
        })
        setForm(formData)
        setLocalBlocks(formData.blocks)
        setHasChanges(false)
      } else {
        logger.warn(`Form with ID ${formId} not found`)
        alert(`フォーム（ID: ${formId}）が見つかりませんでした。削除された可能性があります。`)
        logger.info('Navigating to /admin')
        navigate('/admin')
        return
      }

      // 各商品カテゴリのアイテムを取得
      const productCategoriesWithItems = await Promise.all(
        categoriesData.map(async (category) => {
          const items = await getItems(1, category.id) // TODO: shopIdを動的に取得
          return {
            ...category,
            items,
          }
        })
      )

      logger.info('Product categories loaded', { count: productCategoriesWithItems.length })
      setProductCategories(productCategoriesWithItems)

      logger.functionEnd('loadFormAndCategories', 'Success')
    } catch (err) {
      logger.apiError('GET', `forms/${formId}`, err)
      const errorMsg = getErrorMessage(err)
      alert(`データの読み込みに失敗しました: ${errorMsg}`)
      logger.functionEnd('loadFormAndCategories', 'Failed')
    } finally {
      logger.info('Setting loading state to false')
      setLoading(false)
    }
  }

  // ローカルステートのみ更新（DBには保存しない）
  const handleBlockUpdate = (blockId: number, updates: Partial<FormBlock>) => {
    logger.userAction('Block update', { blockId, updates })
    setLocalBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    )
    setHasChanges(true)
    logger.stateChange('hasChanges', false, true)
    logger.info('Block updated in local state', { blockId, updatesApplied: Object.keys(updates) })
  }

  // ローカルステートから削除（DBには保存しない）
  const handleBlockDelete = (blockId: number) => {
    logger.userAction('Block delete', { blockId })
    const blockToDelete = localBlocks.find(b => b.id === blockId)
    logger.info('Deleting block from local state', {
      blockId,
      blockType: blockToDelete?.block_type,
      content: blockToDelete?.content
    })

    // 削除されたブロックを参照しているshow_conditionをクリーンアップ
    setLocalBlocks(prevBlocks => {
      return prevBlocks
        .filter(block => block.id !== blockId)  // 削除対象のブロックを除外
        .map(block => {
          // このブロックが削除されたブロックを参照していたらクリア
          if (block.show_condition?.block_id === blockId) {
            logger.info('Clearing show_condition reference', {
              blockId: block.id,
              referencedDeletedBlock: blockId
            })
            return { ...block, show_condition: null }
          }
          return block
        })
    })

    setHasChanges(true)
    logger.stateChange('hasChanges', false, true)
    logger.info('Block deleted from local state', { blockId, remainingBlocks: localBlocks.length - 1 })
  }

  // ローカルステートに追加し、すぐにDBに保存してIDを取得
  const handleBlockAdd = async (blockType: BlockType) => {
    logger.userAction('Block add', { blockType })

    if (!form) {
      logger.warn('Cannot add block: form is null')
      return
    }

    try {
      // 新しいブロックをデータベースに直接作成してIDを取得
      logger.apiRequest('POST', 'form_blocks')
      const newBlock = await createFormBlock({
        form_schema_id: form.id,
        block_type: blockType,
        sort_order: localBlocks.length,
        metadata: {},
        show_condition: null,
      })

      logger.apiResponse('POST', 'form_blocks', { blockId: newBlock.id })
      logger.info('New block created with database ID', {
        blockType,
        blockId: newBlock.id,
        sortOrder: newBlock.sort_order
      })

      setLocalBlocks(prev => [...prev, newBlock])
      setHasChanges(false) // すでにDBに保存済み
      logger.info('Block added to local state', { totalBlocks: localBlocks.length + 1 })
    } catch (err) {
      logger.apiError('POST', 'form_blocks', err)
      alert('ブロックの追加に失敗しました')
    }
  }

  const handleBlocksReorder = (blocks: FormBlock[]) => {
    logger.userAction('Blocks reorder', { count: blocks.length })
    setLocalBlocks(blocks)
    setHasChanges(true)
    logger.stateChange('hasChanges', false, true)
    logger.info('Blocks reordered', { newOrder: blocks.map(b => b.id) })
  }

  // 保存（トランザクションでform_blocksに保存、下書き状態のまま）
  const handleSave = async () => {
    logger.functionStart('handleSave')
    logger.userAction('Save clicked')

    if (!form) {
      logger.error('Form is null, cannot save')
      return
    }

    if (localBlocks.length === 0) {
      logger.validationError('localBlocks', 'No blocks to save', localBlocks.length)
      alert('保存するブロックがありません。少なくとも1つのブロックを追加してください。')
      return
    }

    logger.info('Starting save process', {
      formId: form.id,
      formName: form.name,
      existingBlocksCount: form.blocks.length,
      localBlocksCount: localBlocks.length
    })

    try {
      logger.info('Setting saving state to true')
      setSaving(true)

      logger.apiRequest('RPC', 'save_form_blocks', {
        formId: form.id,
        blocksCount: localBlocks.length
      })

      await saveFormBlocks(form.id, localBlocks)

      logger.apiResponse('RPC', 'save_form_blocks', 'Success')
      logger.info('Form saved successfully')
      alert('保存しました')

      logger.info('Reloading form data')
      await loadFormAndCategories()

      logger.functionEnd('handleSave', 'Success')
    } catch (err) {
      logger.apiError('RPC', 'save_form_blocks', err)
      const errorMsg = getErrorMessage(err)
      alert(`保存に失敗しました: ${errorMsg}\n\n詳細はコンソールログを確認してください。`)
      logger.functionEnd('handleSave', 'Failed')
    } finally {
      logger.info('Setting saving state to false')
      setSaving(false)
    }
  }

  // 更新（保存 + published_blocksにコピー）
  const handleUpdate = async () => {
    logger.functionStart('handleUpdate')
    logger.userAction('Update clicked')

    if (!form) {
      logger.error('Form is null, cannot update')
      return
    }

    if (localBlocks.length === 0) {
      logger.validationError('localBlocks', 'No blocks to update', localBlocks.length)
      alert('更新するブロックがありません。少なくとも1つのブロックを追加してください。')
      return
    }

    const message = hasChanges
      ? 'このフォームを保存してお客様ページに反映しますか？\n\n※お客様には更新後のフォームが表示されます。'
      : '現在の内容をお客様ページに反映しますか？'

    logger.info('User confirming update action', { hasChanges })
    if (!confirm(message)) {
      logger.info('User cancelled update action')
      return
    }

    logger.info('Starting update process', {
      formId: form.id,
      formName: form.name,
      hasChanges,
      localBlocksCount: localBlocks.length
    })

    try {
      logger.info('Setting saving state to true')
      setSaving(true)

      // 未保存の変更がある場合は先に保存
      if (hasChanges) {
        logger.info('Saving changes before update')
        logger.apiRequest('RPC', 'save_form_blocks', {
          formId: form.id,
          blocksCount: localBlocks.length
        })

        await saveFormBlocks(form.id, localBlocks)

        logger.apiResponse('RPC', 'save_form_blocks', 'Success')
        logger.info('Changes saved successfully')
      }

      // 更新（form_blocks → published_blocks にコピー）
      logger.apiRequest('PATCH', `forms/${form.id}/publish`)
      await publishFormSchema(form.id)
      logger.apiResponse('PATCH', `forms/${form.id}/publish`, 'Success')

      logger.info('Form updated successfully', {
        formId: form.id,
        formName: form.name
      })
      alert('フォームを更新しました。お客様ページに反映されます。')

      logger.info('Reloading form data')
      await loadFormAndCategories()

      logger.functionEnd('handleUpdate', 'Success')
    } catch (err) {
      logger.apiError('PATCH', 'update', err)
      const errorMsg = getErrorMessage(err)
      alert(`更新に失敗しました: ${errorMsg}\n\n詳細はコンソールログを確認してください。`)
      logger.functionEnd('handleUpdate', 'Failed')
    } finally {
      logger.info('Setting saving state to false')
      setSaving(false)
    }
  }

  // リストビュー用: ブロック作成
  const handleCreateBlockInList = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form) {
      alert('フォームを選択してください')
      return
    }
    try {
      const maxSortOrder = localBlocks.reduce((max, block) =>
        Math.max(max, block.sort_order), -1)

      let metadata: any = {}
      if (blockType === 'category_reference' && blockProductCategoryId) {
        metadata = { product_category_id: blockProductCategoryId }
      } else if (blockType === 'choice') {
        if (blockChoiceInputMode === 'category' && blockChoiceCategoryId) {
          metadata = {
            auto_sync_category_id: blockChoiceCategoryId,
            choice_display: blockChoiceDisplay,
          }
        } else {
          metadata = {
            choice_options: blockChoiceOptions,
            choice_display: blockChoiceDisplay,
          }
        }
      }

      await createFormBlock({
        form_schema_id: form.id,
        block_type: blockType,
        content: blockContent || undefined,
        metadata,
        show_condition: conditionEnabled ? blockShowCondition : null,
        sort_order: maxSortOrder + 1,
      })
      resetBlockForm()
      await loadFormAndCategories()
      alert(getSuccessMessage('create', 'ブロック'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  // リストビュー用: ブロック更新
  const handleUpdateBlockInList = async (id: number) => {
    try {
      let metadata: any = {}
      if (blockType === 'category_reference' && blockProductCategoryId) {
        metadata = { product_category_id: blockProductCategoryId }
      } else if (blockType === 'choice') {
        if (blockChoiceInputMode === 'category' && blockChoiceCategoryId) {
          metadata = {
            auto_sync_category_id: blockChoiceCategoryId,
            choice_display: blockChoiceDisplay,
          }
        } else {
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
      await loadFormAndCategories()
      alert(getSuccessMessage('update', 'ブロック'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  // リストビュー用: ブロック削除
  const handleDeleteBlockInList = async (id: number) => {
    if (!confirm('このブロックを削除しますか？')) return
    try {
      await deleteFormBlock(id)
      await loadFormAndCategories()
      alert(getSuccessMessage('delete', 'ブロック'))
    } catch (err) {
      console.error(err)
      alert(getErrorMessage(err))
    }
  }

  // リストビュー用: ブロック移動
  const handleMoveBlockUp = async (index: number) => {
    if (index === 0) return

    const newBlocks = [...localBlocks]
    ;[newBlocks[index - 1], newBlocks[index]] = [newBlocks[index], newBlocks[index - 1]]

    setLocalBlocks(newBlocks)

    try {
      await updateBlocksOrder(newBlocks.map((b) => b.id))
    } catch (err) {
      console.error(err)
      alert('並び順の更新に失敗しました')
      await loadFormAndCategories()
    }
  }

  const handleMoveBlockDown = async (index: number) => {
    if (index === localBlocks.length - 1) return

    const newBlocks = [...localBlocks]
    ;[newBlocks[index], newBlocks[index + 1]] = [newBlocks[index + 1], newBlocks[index]]

    setLocalBlocks(newBlocks)

    try {
      await updateBlocksOrder(newBlocks.map((b) => b.id))
    } catch (err) {
      console.error(err)
      alert('並び順の更新に失敗しました')
      await loadFormAndCategories()
    }
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

  const getBlockTypeLabel = (type: BlockType): string => {
    const labels: Record<BlockType, string> = {
      text: 'テキスト',
      heading: '見出し',
      list: 'リスト',
      category_reference: 'カテゴリ参照',
      yes_no: 'Yes/No質問',
      choice: '選択肢質問',
    }
    return labels[type]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">フォームが見つかりません</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin#form-builder')}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                ← 一覧に戻る
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{form.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  {/* ビューモード切り替え */}
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('node')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        viewMode === 'node'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      📊 ノードビュー
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        viewMode === 'list'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      📋 リストビュー
                    </button>
                  </div>
                  {form.published_at && (
                    <span className="text-gray-600">
                      最終反映: {new Date(form.published_at).toLocaleString('ja-JP')}
                    </span>
                  )}
                  {form.updated_at && (
                    <span className="text-gray-600">
                      最終保存: {new Date(form.updated_at).toLocaleString('ja-JP')}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                ブロック数: <span className="font-semibold">{localBlocks.length}</span>
                {hasChanges && <span className="ml-2 text-orange-600 font-semibold">● 未保存の変更</span>}
              </div>
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '保存中...' : (hasChanges ? '保存' : '保存済み')}
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving || localBlocks.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '更新中...' : '更新'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      {viewMode === 'node' ? (
        /* ノードビュー */
        <main className="w-full h-[calc(100vh-88px)]">
          <FormBuilderCanvas
            blocks={localBlocks}
            productCategories={productCategories}
            onBlockUpdate={handleBlockUpdate}
            onBlockDelete={handleBlockDelete}
            onBlockAdd={handleBlockAdd}
            onBlocksReorder={handleBlocksReorder}
            fullScreen={true}
          />
        </main>
      ) : (
        /* リストビュー */
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 gap-6">
            {/* ブロック作成フォーム */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-700 mb-4">ブロック追加</h3>
              <form onSubmit={handleCreateBlockInList} className="space-y-3">
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
                    <option value="choice">選択肢質問</option>
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
                    内容
                  </label>
                  <textarea
                    value={blockContent}
                    onChange={(e) => setBlockContent(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                    rows={4}
                    placeholder="テキストを入力"
                  />
                </div>

                <div className="flex gap-2">
                  {editingBlockId ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUpdateBlockInList(editingBlockId)}
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
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="font-medium text-gray-700 mb-4">ブロック一覧</h3>

              {localBlocks.length === 0 ? (
                <p className="text-sm text-gray-500">ブロックがまだありません</p>
              ) : (
                <div className="space-y-2">
                  {localBlocks.map((block, index) => {
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
                              disabled={index === localBlocks.length - 1}
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
                              onClick={() => handleDeleteBlockInList(block.id)}
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
        </main>
      )}
    </div>
  )
}
