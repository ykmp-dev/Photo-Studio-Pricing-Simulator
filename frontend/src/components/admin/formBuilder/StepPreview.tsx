import type { FormBuilderData } from '../../../types/formBuilderV3'
import { validateFormBuilder } from '../../../utils/formBuilderLogic'
import { formSectionLabels, productTypeLabels } from '../../../utils/labelConverter'

interface StepPreviewProps {
  formData: FormBuilderData
  onBack: () => void
}

/**
 * Step 4: プレビュー
 * 作成したフォームの全体像を確認
 */
export default function StepPreview({ formData, onBack }: StepPreviewProps) {
  const validation = validateFormBuilder(formData)
  const triggerSteps = formData.steps.filter((s) => s.type === 'trigger')
  const conditionalSteps = formData.steps.filter((s) => s.type === 'conditional')
  const commonFinalSteps = formData.steps.filter((s) => s.type === 'common_final')

  return (
    <div className="space-y-6">
      {/* バリデーション結果 */}
      {!validation.isValid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-base font-semibold text-red-800 mb-2">⚠️ 修正が必要な項目</h3>
          <ul className="list-disc list-inside space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">{error}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.isValid && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <div>
              <h3 className="text-base font-semibold text-green-800">フォームの作成が完了しました！</h3>
              <p className="text-sm text-green-700 mt-1">
                「下書き保存」または「保存して閉じる」ボタンで保存してください
              </p>
            </div>
          </div>
        </div>
      )}

      {/* フォーム概要 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          📋 {formData.shootingCategoryName} のフォーム
        </h2>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">総項目数:</span>
            <span className="text-gray-900">{formData.steps.length}個</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">最初に選ぶ項目:</span>
            <span className="text-gray-900">{triggerSteps.length}個</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">分岐設定:</span>
            <span className="text-gray-900">{conditionalSteps.length}個</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">いつも表示:</span>
            <span className="text-gray-900">{commonFinalSteps.length}個</span>
          </div>
        </div>
      </div>

      {/* 詳細表示 */}
      <div className="space-y-4">
        {formData.steps.map((step, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              {/* アイコン */}
              <div className="text-2xl">
                {step.type === 'trigger' && '📸'}
                {step.type === 'conditional' && '👗'}
                {step.type === 'common_final' && '📚'}
              </div>

              {/* コンテンツ */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800">{step.category.displayName}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {formSectionLabels[step.type]}
                  </span>
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {productTypeLabels[step.category.productType]}
                </p>

                {step.category.description && (
                  <p className="text-sm text-gray-500 mb-2 italic">{step.category.description}</p>
                )}

                {/* 条件 */}
                {step.type === 'conditional' && step.condition && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded px-3 py-2 mb-2">
                    <p className="text-xs text-yellow-800">
                      <strong>表示条件:</strong> {step.condition.value}を選んだ時
                    </p>
                  </div>
                )}

                {/* 選択肢 */}
                <div className="mt-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">選択肢:</p>
                  <div className="space-y-1">
                    {step.category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded text-sm">
                        <span className="text-gray-800">{item.name}</span>
                        <span className="font-medium text-blue-600">¥{item.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {formData.steps.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <p>まだ項目が追加されていません</p>
            <p className="text-sm mt-1">「← 戻る」ボタンで項目を追加してください</p>
          </div>
        )}
      </div>

      {/* ナビゲーション */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium"
        >
          ← 戻る
        </button>
      </div>
    </div>
  )
}
