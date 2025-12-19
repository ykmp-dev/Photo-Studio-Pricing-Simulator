import { useState } from 'react'
import type { ShootingCategory } from '../../../types/category'
import type { FormBuilderData, WizardStep } from '../../../types/formBuilderV3'
import { initFormBuilder } from '../../../utils/formBuilderLogic'

interface FormBuilderWizardProps {
  shopId: number
  shootingCategories: ShootingCategory[]
  onSave: (formData: FormBuilderData) => void
  onCancel: () => void
}

/**
 * フォームビルダーウィザード
 * TDD方式で実装された、非エンジニア向けの超シンプルなフォーム作成UI
 */
export default function FormBuilderWizard({
  shootingCategories,
  onCancel
}: FormBuilderWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>('select_shooting')
  const [formData, setFormData] = useState<FormBuilderData | null>(null)

  const handleSelectShootingCategory = (category: ShootingCategory) => {
    const newFormData = initFormBuilder(category.id, category.display_name)
    setFormData(newFormData)
    setCurrentStep('add_trigger')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">📋 フォームを作成</h1>
          <p className="text-sm text-gray-600 mt-1">
            お客様向けの見積もりフォームを簡単に作成できます
          </p>
        </div>

        {/* ステップインジケーター */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <StepIndicator step={1} label="撮影メニュー選択" active={currentStep === 'select_shooting'} />
            <div className="h-px flex-1 bg-gray-300 mx-2"></div>
            <StepIndicator step={2} label="最初に選ぶ項目" active={currentStep === 'add_trigger'} />
            <div className="h-px flex-1 bg-gray-300 mx-2"></div>
            <StepIndicator step={3} label="条件付き項目" active={currentStep === 'add_conditional'} />
            <div className="h-px flex-1 bg-gray-300 mx-2"></div>
            <StepIndicator step={4} label="いつも表示" active={currentStep === 'add_common_final'} />
            <div className="h-px flex-1 bg-gray-300 mx-2"></div>
            <StepIndicator step={5} label="プレビュー" active={currentStep === 'preview'} />
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="bg-white rounded-lg shadow p-6">
          {currentStep === 'select_shooting' && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                どの撮影メニューのフォームを作りますか？
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {shootingCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleSelectShootingCategory(category)}
                    className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
                  >
                    <div className="text-3xl mb-2">📸</div>
                    <div className="font-semibold text-gray-800">
                      {category.display_name}
                    </div>
                    {category.description && (
                      <div className="text-xs text-gray-500 mt-1">
                        {category.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={onCancel}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {currentStep === 'add_trigger' && formData && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                📸 最初に選ぶ項目を追加
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                撮影コース、撮影場所など、お客様が最初に選ぶ項目を設定します
              </p>
              {/* ここにStepTriggerコンポーネントを配置 */}
              <div className="text-center text-gray-500">
                実装中...
              </div>
            </div>
          )}
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
