import { evaluateConditionalRule } from './conditionalRuleEngine'
import type { ProductCategoryV3, FormValues } from '../types/formV3'

/**
 * 商品カテゴリを表示すべきかどうかを判定する
 * @param category 商品カテゴリ
 * @param formValues フォームの現在の値
 * @returns 表示する場合true、非表示の場合false
 */
export function shouldShowCategory(
  category: ProductCategoryV3,
  formValues: FormValues
): boolean {
  // 非アクティブなカテゴリは表示しない
  if (!category.is_active) {
    return false
  }

  // form_sectionがtriggerまたはcommon_finalの場合、常に表示
  if (
    category.form_section === 'trigger' ||
    category.form_section === 'common_final' ||
    category.form_section === null
  ) {
    return true
  }

  // form_sectionがconditionalの場合、条件ルールを評価
  if (category.form_section === 'conditional') {
    // 条件ルールが設定されていない場合は表示
    if (!category.conditional_rule) {
      return true
    }

    // 条件ルールを評価
    return evaluateConditionalRule(category.conditional_rule, formValues)
  }

  // 未知のform_sectionの場合は表示しない
  return false
}

/**
 * 表示すべき商品カテゴリのみをフィルタリングする
 * @param categories 全商品カテゴリ
 * @param formValues フォームの現在の値
 * @returns 表示すべきカテゴリの配列
 */
export function filterVisibleCategories(
  categories: ProductCategoryV3[],
  formValues: FormValues
): ProductCategoryV3[] {
  return categories.filter((category) => shouldShowCategory(category, formValues))
}

/**
 * Triggerセクションが存在するかどうかを確認する
 * @param categories 全商品カテゴリ
 * @returns Triggerセクションが1つでもあればtrue
 */
export function hasTriggerSections(categories: ProductCategoryV3[]): boolean {
  return categories.some(
    (category) => category.is_active && category.form_section === 'trigger'
  )
}
