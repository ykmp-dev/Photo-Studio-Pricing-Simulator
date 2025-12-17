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
    loadFormAndCategories()
  }, [formId])

  const loadFormAndCategories = async () => {
    if (!formId) return

    try {
      setLoading(true)
      const [formData, categoriesData] = await Promise.all([
        getFormWithBlocks(parseInt(formId)),
        getProductCategories(1), // TODO: shopIdを動的に取得
      ])

      if (formData) {
        setForm(formData)
        setLocalBlocks(formData.blocks)
        setHasChanges(false)
      }
      setProductCategories(categoriesData)
    } catch (err) {
      console.error('Failed to load form or categories:', err)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  // ローカルステートのみ更新（DBには保存しない）
  const handleBlockUpdate = (blockId: number, updates: Partial<FormBlock>) => {
    setLocalBlocks(prevBlocks =>
      prevBlocks.map(block =>
        block.id === blockId ? { ...block, ...updates } : block
      )
    )
    setHasChanges(true)
  }

  // ローカルステートから削除（DBには保存しない）
  const handleBlockDelete = (blockId: number) => {
    setLocalBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockId))
    setHasChanges(true)
  }

  // ローカルステートに追加（DBには保存しない）
  const handleBlockAdd = (blockType: BlockType) => {
    if (!form) return

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

    setLocalBlocks(prev => [...prev, newBlock])
    setHasChanges(true)
  }

  const handleBlocksReorder = (blocks: FormBlock[]) => {
    setLocalBlocks(blocks)
    setHasChanges(true)
  }

  // 下書き保存（DBに保存、statusはdraftのまま）
  const handleSaveDraft = async () => {
    if (!form) return

    try {
      setSaving(true)

      // すべてのブロックをDBに保存
      // 既存のブロックを全削除して再作成（簡略化）
      await Promise.all(form.blocks.map(b => deleteFormBlock(b.id)))

      for (const block of localBlocks) {
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

      // ステータスはdraftのまま
      await updateFormSchema(form.id, { status: 'draft' })

      alert('下書きを保存しました')
      await loadFormAndCategories()
    } catch (err) {
      console.error('Failed to save draft:', err)
      alert('下書き保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  // 公開（DBに保存 + statusをpublishedに変更）
  const handlePublish = async () => {
    if (!form) return
    if (!confirm('このフォームを公開しますか？エンドユーザーに表示されます。')) return

    try {
      setSaving(true)

      // すべてのブロックをDBに保存
      await Promise.all(form.blocks.map(b => deleteFormBlock(b.id)))

      for (const block of localBlocks) {
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

      // 公開
      await publishFormSchema(form.id)

      alert('フォームを公開しました')
      await loadFormAndCategories()
    } catch (err) {
      console.error('Failed to publish:', err)
      alert('公開に失敗しました')
    } finally {
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
