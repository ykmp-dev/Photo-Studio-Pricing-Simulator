import { useState, useEffect } from 'react'
import type { ShootingCategory } from '../../../types/category'
import type { FormBuilderData, WizardStep } from '../../../types/formBuilderV3'
import { initFormBuilder } from '../../../utils/formBuilderLogic'
import StepTrigger from './StepTrigger'
import StepConditional from './StepConditional'
import StepCommonFinal from './StepCommonFinal'
import StepPreview from './StepPreview'

interface FormBuilderWizardProps {
  shopId: number
  shootingCategories: ShootingCategory[]
  selectedCategory: ShootingCategory
  initialFormData?: FormBuilderData
  onSave: (formData: FormBuilderData) => void
  onCancel: () => void
}

/**
 * フォームビルダーウィザード
 * TDD方式で実装された、非エンジニア向けの超シンプルなフォーム作成UI
 * モーダルポップアップとして表示されます
 */
export default function FormBuilderWizard({
  selectedCategory,
  initialFormData,
  onSave,
  onCancel
}: FormBuilderWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('add_trigger')
  const [formData, setFormData] = useState<FormBuilderData | null>(null)

  // 初期化: 既存データまたは新規データ
  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData)
    } else {
      const newFormData = initFormBuilder(selectedCategory.id, selectedCategory.display_name)
      setFormData(newFormData)
    }
  }, [selectedCategory, initialFormData])

  const handleSaveDraft = () => {
    if (!formData) return
    onSave(formData)
  }

  return (
    <div className="bg-white p-6">
      {/* ヘッダー */}
      <div className="border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              📋 {selectedCategory.display_name} のフォームを作成
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              お客様向けの見積もりフォームを簡単に作成できます
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            title="閉じる"
          >
            ×
          </button>
        </div>
      </div>

      {/* ステップインジケーター */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <StepIndicator step={1} label="最初に選ぶ項目" active={currentStep === 'add_trigger'} />
          <div className="h-px flex-1 bg-gray-300 mx-2"></div>
          <StepIndicator step={2} label="分岐設定" active={currentStep === 'add_conditional'} />
          <div className="h-px flex-1 bg-gray-300 mx-2"></div>
          <StepIndicator step={3} label="いつも表示" active={currentStep === 'add_common_final'} />
          <div className="h-px flex-1 bg-gray-300 mx-2"></div>
          <StepIndicator step={4} label="プレビュー" active={currentStep === 'preview'} />
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="mb-6 min-h-[400px]">
        {currentStep === 'add_trigger' && formData && (
          <StepTrigger
            formData={formData}
            onUpdate={setFormData}
            onNext={() => setCurrentStep('add_conditional')}
          />
        )}

        {currentStep === 'add_conditional' && formData && (
          <StepConditional
            formData={formData}
            onUpdate={setFormData}
            onNext={() => setCurrentStep('add_common_final')}
            onBack={() => setCurrentStep('add_trigger')}
          />
        )}

        {currentStep === 'add_common_final' && formData && (
          <StepCommonFinal
            formData={formData}
            onUpdate={setFormData}
            onNext={() => setCurrentStep('preview')}
            onBack={() => setCurrentStep('add_conditional')}
          />
        )}

        {currentStep === 'preview' && formData && (
          <StepPreview
            formData={formData}
            onBack={() => setCurrentStep('add_common_final')}
          />
        )}
      </div>

      {/* フッター: 下書き保存・キャンセルボタン */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex justify-between items-center">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
          >
            キャンセル
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleSaveDraft}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors"
            >
              下書き保存
            </button>
            <button
              onClick={handleSaveDraft}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
            >
              保存して閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StepIndicator({ step, label, active }: { step: number; label: string; active: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
          active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
        }`}
      >
        {step}
      </div>
      <div className={`text-xs mt-1 ${active ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
        {label}
      </div>
    </div>
  )
}
