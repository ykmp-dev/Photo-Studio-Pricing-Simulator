import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFormWithBlocks, updateFormBlock, deleteFormBlock, createFormBlock } from '../services/formBuilderService'
import { getProductCategories } from '../services/categoryService'
import type { FormSchemaWithBlocks, FormBlock, BlockType } from '../types/formBuilder'
import FormBuilderCanvas from '../components/admin/FormBuilderCanvas'

export default function FormNodeViewPage() {
  const { formId } = useParams<{ formId: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormSchemaWithBlocks | null>(null)
  const [productCategories, setProductCategories] = useState<Array<{ id: number; display_name: string; items?: any[] }>>([])
  const [loading, setLoading] = useState(false)

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
      }
      setProductCategories(categoriesData)
    } catch (err) {
      console.error('Failed to load form or categories:', err)
      alert('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleBlockUpdate = async (blockId: number, updates: Partial<FormBlock>) => {
    try {
      await updateFormBlock(blockId, updates)
      await loadFormAndCategories()
    } catch (err) {
      console.error('Failed to update block:', err)
      alert('ブロックの更新に失敗しました')
    }
  }

  const handleBlockDelete = async (blockId: number) => {
    if (!confirm('このブロックを削除しますか？')) return

    try {
      await deleteFormBlock(blockId)
      await loadFormAndCategories()
    } catch (err) {
      console.error('Failed to delete block:', err)
      alert('ブロックの削除に失敗しました')
    }
  }

  const handleBlockAdd = async (blockType: BlockType) => {
    if (!form) return

    try {
      await createFormBlock({
        form_schema_id: form.id,
        block_type: blockType,
        content: '',
        sort_order: form.blocks.length,
        metadata: {},
      })
      await loadFormAndCategories()
    } catch (err) {
      console.error('Failed to create block:', err)
      alert('ブロックの追加に失敗しました')
    }
  }

  const handleBlocksReorder = async (blocks: FormBlock[]) => {
    // TODO: Implement reordering API
    console.log('Reordering blocks:', blocks)
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
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-800 font-medium transition-colors"
              >
                ← 戻る
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{form.name}</h1>
                <p className="text-sm text-gray-500 mt-1">ノードビュー</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                ブロック数: <span className="font-semibold">{form.blocks.length}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="w-full h-[calc(100vh-88px)]">
        <FormBuilderCanvas
          blocks={form.blocks}
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
