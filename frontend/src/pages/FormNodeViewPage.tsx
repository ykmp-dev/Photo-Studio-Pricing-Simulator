import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getFormWithBlocks,
  deleteFormBlock,
  createFormBlock,
  updateFormSchema,
  publishFormSchema
} from '../services/formBuilderService'
import { getProductCategories } from '../services/categoryService'
import type { FormSchemaWithBlocks, FormBlock, BlockType, ShowCondition } from '../types/formBuilder'
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

  // 下書き保存（DBに保存、statusはdraftのまま）
  const handleSaveDraft = async () => {
    logger.functionStart('handleSaveDraft')
    logger.userAction('Save draft clicked')

    if (!form) {
      logger.error('Form is null, cannot save draft')
      return
    }

    if (localBlocks.length === 0) {
      logger.validationError('localBlocks', 'No blocks to save', localBlocks.length)
      alert('保存するブロックがありません。少なくとも1つのブロックを追加してください。')
      return
    }

    logger.info('Starting draft save process', {
      formId: form.id,
      formName: form.name,
      existingBlocksCount: form.blocks.length,
      localBlocksCount: localBlocks.length
    })

    try {
      logger.info('Setting saving state to true')
      setSaving(true)

      // すべてのブロックをDBに保存
      // 既存のブロックを全削除して再作成（簡略化）
      logger.apiRequest('DELETE', `form-blocks (bulk)`, {
        formId: form.id,
        count: form.blocks.length
      })
      await Promise.all(form.blocks.map(b => deleteFormBlock(b.id)))
      logger.apiResponse('DELETE', `form-blocks (bulk)`, 'Success')

      logger.apiRequest('POST', `form-blocks (bulk)`, {
        formId: form.id,
        count: localBlocks.length
      })
      for (const [index, block] of localBlocks.entries()) {
        logger.debug(`Creating block ${index + 1}/${localBlocks.length}`, {
          blockType: block.block_type,
          content: block.content?.substring(0, 50)
        })

        const cleanedUpdates: {
          form_schema_id: number
          block_type: BlockType
          content?: string
          sort_order: number
          metadata?: any
          show_condition?: ShowCondition | null
        } = {
          form_schema_id: form.id,
          block_type: block.block_type,
          content: block.content === null ? undefined : block.content,
          sort_order: block.sort_order,
          metadata: block.metadata,
          show_condition: block.show_condition,
        }
        await createFormBlock(cleanedUpdates)
      }
      logger.apiResponse('POST', `form-blocks (bulk)`, 'Success')

      // ステータスはdraftのまま
      logger.apiRequest('PATCH', `forms/${form.id}`, { status: 'draft' })
      await updateFormSchema(form.id, { status: 'draft' })
      logger.apiResponse('PATCH', `forms/${form.id}`, 'Success')

      logger.info('Draft saved successfully')
      alert('下書きを保存しました')

      logger.info('Reloading form data')
      await loadFormAndCategories()

      logger.functionEnd('handleSaveDraft', 'Success')
    } catch (err) {
      logger.apiError('POST/PATCH', 'save-draft', err)
      const errorMsg = getErrorMessage(err)
      alert(`下書き保存に失敗しました: ${errorMsg}\n\n詳細はコンソールログを確認してください。`)
      logger.functionEnd('handleSaveDraft', 'Failed')
    } finally {
      logger.info('Setting saving state to false')
      setSaving(false)
    }
  }

  // 公開（DBに保存 + statusをpublishedに変更）
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

    logger.info('User confirming publish action')
    if (!confirm('このフォームを公開しますか？エンドユーザーに表示されます。')) {
      logger.info('User cancelled publish action')
      return
    }

    logger.info('Starting publish process', {
      formId: form.id,
      formName: form.name,
      existingBlocksCount: form.blocks.length,
      localBlocksCount: localBlocks.length
    })

    try {
      logger.info('Setting saving state to true')
      setSaving(true)

      // すべてのブロックをDBに保存
      logger.apiRequest('DELETE', `form-blocks (bulk)`, {
        formId: form.id,
        count: form.blocks.length
      })
      await Promise.all(form.blocks.map(b => deleteFormBlock(b.id)))
      logger.apiResponse('DELETE', `form-blocks (bulk)`, 'Success')

      logger.apiRequest('POST', `form-blocks (bulk)`, {
        formId: form.id,
        count: localBlocks.length
      })
      for (const [index, block] of localBlocks.entries()) {
        logger.debug(`Creating block ${index + 1}/${localBlocks.length}`, {
          blockType: block.block_type,
          content: block.content?.substring(0, 50)
        })

        const cleanedUpdates: {
          form_schema_id: number
          block_type: BlockType
          content?: string
          sort_order: number
          metadata?: any
          show_condition?: ShowCondition | null
        } = {
          form_schema_id: form.id,
          block_type: block.block_type,
          content: block.content === null ? undefined : block.content,
          sort_order: block.sort_order,
          metadata: block.metadata,
          show_condition: block.show_condition,
        }
        await createFormBlock(cleanedUpdates)
      }
      logger.apiResponse('POST', `form-blocks (bulk)`, 'Success')

      // 公開
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
      logger.apiError('POST/PATCH', 'publish', err)
      const errorMsg = getErrorMessage(err)
      alert(`公開に失敗しました: ${errorMsg}\n\n詳細はコンソールログを確認してください。`)
      logger.functionEnd('handlePublish', 'Failed')
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
                <p className="text-sm text-gray-500 mt-1">
                  ノードビュー
                  {form.status === 'published' && <span className="ml-2 text-green-600 font-semibold">● 公開中</span>}
                  {form.status === 'draft' && <span className="ml-2 text-yellow-600 font-semibold">● 下書き</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                ブロック数: <span className="font-semibold">{localBlocks.length}</span>
                {hasChanges && <span className="ml-2 text-orange-600 font-semibold">● 未保存の変更</span>}
              </div>
              <button
                onClick={handleSaveDraft}
                disabled={!hasChanges || saving}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '保存中...' : '下書き保存'}
              </button>
              <button
                onClick={handlePublish}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? '公開中...' : '公開'}
              </button>
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
