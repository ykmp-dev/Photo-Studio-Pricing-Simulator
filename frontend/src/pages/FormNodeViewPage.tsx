import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getFormWithBlocks,
  saveFormBlocks,
  publishFormSchema,
  unpublishFormSchema
} from '../services/formBuilderService'
import { getProductCategories } from '../services/categoryService'
import type { FormSchemaWithBlocks, FormBlock, BlockType } from '../types/formBuilder'
import FormBuilderCanvas from '../components/admin/FormBuilderCanvas'
import { getErrorMessage } from '../utils/errorMessages'
import { createLogger } from '../utils/logger'

const logger = createLogger('FormNodeViewPage')

export default function FormNodeViewPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormSchemaWithBlocks | null>(null)
  const [localBlocks, setLocalBlocks] = useState<FormBlock[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [productCategories, setProductCategories] = useState<Array<{ id: number; display_name: string; items?: any[] }>>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    logger.info('Component mounted', { formId })
    loadFormAndCategories()
  }, [formId])

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

      logger.info('Product categories loaded', { count: categoriesData.length })
      setProductCategories(categoriesData)

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
    setLocalBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId))
    setHasChanges(true)
    logger.stateChange('hasChanges', false, true)
    logger.info('Block deleted from local state', { blockId, remainingBlocks: localBlocks.length - 1 })
  }

  // ローカルステートに追加（DBには保存しない）
  const handleBlockAdd = (blockType: BlockType) => {
    logger.userAction('Block add', { blockType })

    if (!form) {
      logger.warn('Cannot add block: form is null')
      return
    }

    const newBlock: FormBlock = {
      id: Date.now(), // 一時ID（保存時にサーバーが割り当て）
      form_schema_id: form.id,
      block_type: blockType,
      content: null,
      sort_order: localBlocks.length,
      metadata: {},
      show_condition: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    logger.info('Adding new block to local state', {
      blockType,
      tempId: newBlock.id,
      sortOrder: newBlock.sort_order
    })

    setLocalBlocks(prev => [...prev, newBlock])
    setHasChanges(true)
    logger.stateChange('hasChanges', false, true)
    logger.info('Block added to local state', { totalBlocks: localBlocks.length + 1 })
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

      // トランザクション関数で一括保存
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

  // 公開（保存 + published_blocksにコピー）
  const handlePublish = async () => {
    logger.functionStart('handlePublish')
    logger.userAction('Publish clicked')

    if (!form) {
      logger.error('Form is null, cannot publish')
      return
    }

    if (localBlocks.length === 0) {
      logger.validationError('localBlocks', 'No blocks to publish', localBlocks.length)
      alert('公開するブロックがありません。少なくとも1つのブロックを追加してください。')
      return
    }

    const message = hasChanges
      ? 'このフォームを保存して公開しますか？エンドユーザーに表示されます。'
      : 'このフォームを公開しますか？エンドユーザーに表示されます。'

    logger.info('User confirming publish action', { hasChanges })
    if (!confirm(message)) {
      logger.info('User cancelled publish action')
      return
    }

    logger.info('Starting publish process', {
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
        logger.info('Saving changes before publish')
        logger.apiRequest('RPC', 'save_form_blocks', {
          formId: form.id,
          blocksCount: localBlocks.length
        })

        await saveFormBlocks(form.id, localBlocks)

        logger.apiResponse('RPC', 'save_form_blocks', 'Success')
        logger.info('Changes saved successfully')
      }

      // 公開（form_blocks → published_blocks にコピー）
      logger.apiRequest('PATCH', `forms/${form.id}/publish`, { status: 'published' })
      await publishFormSchema(form.id)
      logger.apiResponse('PATCH', `forms/${form.id}/publish`, 'Success')

      logger.info('Form published successfully', {
        formId: form.id,
        formName: form.name
      })
      alert('フォームを公開しました。エンドユーザーに表示されます。')

      logger.info('Reloading form data')
      await loadFormAndCategories()

      logger.functionEnd('handlePublish', 'Success')
    } catch (err) {
      logger.apiError('PATCH', 'publish', err)
      const errorMsg = getErrorMessage(err)
      alert(`公開に失敗しました: ${errorMsg}\n\n詳細はコンソールログを確認してください。`)
      logger.functionEnd('handlePublish', 'Failed')
    } finally {
      logger.info('Setting saving state to false')
      setSaving(false)
    }
  }

  // 非公開に戻す（published_blocksを削除、status='draft'に）
  const handleUnpublish = async () => {
    logger.functionStart('handleUnpublish')
    logger.userAction('Unpublish clicked')

    if (!form) {
      logger.error('Form is null, cannot unpublish')
      return
    }

    logger.info('User confirming unpublish action')
    if (!confirm('このフォームを非公開にしますか？エンドユーザーに表示されなくなります。')) {
      logger.info('User cancelled unpublish action')
      return
    }

    logger.info('Starting unpublish process', {
      formId: form.id,
      formName: form.name
    })

    try {
      logger.info('Setting saving state to true')
      setSaving(true)

      // 非公開
      logger.apiRequest('PATCH', `forms/${form.id}/unpublish`, { status: 'draft' })
      await unpublishFormSchema(form.id)
      logger.apiResponse('PATCH', `forms/${form.id}/unpublish`, 'Success')

      logger.info('Form unpublished successfully', {
        formId: form.id,
        formName: form.name
      })
      alert('フォームを非公開にしました。')

      logger.info('Reloading form data')
      await loadFormAndCategories()

      logger.functionEnd('handleUnpublish', 'Success')
    } catch (err) {
      logger.apiError('PATCH', 'unpublish', err)
      const errorMsg = getErrorMessage(err)
      alert(`非公開に失敗しました: ${errorMsg}\n\n詳細はコンソールログを確認してください。`)
      logger.functionEnd('handleUnpublish', 'Failed')
    } finally {
      logger.info('Setting saving state to false')
      setSaving(false)
    }
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
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                ← 戻る
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{form.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>ノードビュー</span>
                  {form.status === 'published' && (
                    <>
                      <span className="text-green-600 font-semibold">● 公開中</span>
                      {form.published_at && (
                        <span className="text-gray-600">
                          最終公開: {new Date(form.published_at).toLocaleString('ja-JP')}
                        </span>
                      )}
                    </>
                  )}
                  {form.status === 'draft' && <span className="text-yellow-600 font-semibold">● 下書き</span>}
                  {form.updated_at && (
                    <span className="text-gray-600">
                      最終更新: {new Date(form.updated_at).toLocaleString('ja-JP')}
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
                onClick={handlePublish}
                disabled={saving || localBlocks.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '処理中...' : (form.status === 'published' && hasChanges ? '変更を公開' : '公開')}
              </button>
              {form.status === 'published' && (
                <button
                  onClick={handleUnpublish}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? '処理中...' : '非公開に戻す'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
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
    </div>
  )
}
