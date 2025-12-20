import type {
  ConditionalRule,
  ConditionItem,
  NestedAndCondition,
  FormValues,
  ConditionalOperator
} from '../types/formV3'

/**
 * 条件ルールを評価する
 * @param rule 条件ルール（AND/OR対応）
 * @param formValues フォームの値
 * @returns 条件を満たす場合true、満たさない場合false
 */
export function evaluateConditionalRule(
  rule: ConditionalRule,
  formValues: FormValues
): boolean {
  // AND条件が存在する場合、ANDを優先
  if (rule.AND !== undefined) {
    return evaluateAndConditions(rule.AND, formValues)
  }

  // OR条件の評価
  if (rule.OR !== undefined) {
    return evaluateOrConditions(rule.OR, formValues)
  }

  // 条件が何もない場合はfalse
  return false
}

/**
 * AND条件を評価（すべての条件が満たされる必要がある）
 */
function evaluateAndConditions(
  conditions: (ConditionItem | NestedAndCondition)[],
  formValues: FormValues
): boolean {
  // 空の配列の場合はtrue（すべての条件が満たされている）
  if (conditions.length === 0) {
    return true
  }

  return conditions.every((condition) => {
    // ネストされたAND条件の場合
    if ('AND' in condition) {
      return evaluateAndConditions(condition.AND, formValues)
    }

    // 単一条件の場合
    return evaluateConditionItem(condition, formValues)
  })
}

/**
 * OR条件を評価（いずれかの条件が満たされればよい）
 */
function evaluateOrConditions(
  conditions: (ConditionItem | NestedAndCondition)[],
  formValues: FormValues
): boolean {
  // 空の配列の場合はfalse（いずれかの条件も満たされていない）
  if (conditions.length === 0) {
    return false
  }

  return conditions.some((condition) => {
    // ネストされたAND条件の場合
    if ('AND' in condition) {
      return evaluateAndConditions(condition.AND, formValues)
    }

    // 単一条件の場合
    return evaluateConditionItem(condition, formValues)
  })
}

/**
 * 単一条件を評価
 */
function evaluateConditionItem(
  condition: ConditionItem,
  formValues: FormValues
): boolean {
  const fieldValue = formValues[condition.field]
  const targetValue = condition.value

  // フィールドが存在しない場合はfalse
  if (fieldValue === undefined) {
    return false
  }

  return evaluateOperator(
    fieldValue,
    condition.operator,
    targetValue
  )
}

/**
 * 演算子に基づいて値を比較
 */
function evaluateOperator(
  fieldValue: string | number | boolean | number[] | null | undefined,
  operator: ConditionalOperator,
  targetValue: string | number | boolean | string[] | number[]
): boolean {
  switch (operator) {
    case '=':
      return fieldValue === targetValue

    case '!=':
      return fieldValue !== targetValue

    case 'IN':
      if (!Array.isArray(targetValue)) {
        return false
      }
      return (targetValue as (string | number)[]).includes(fieldValue as string | number)

    case 'NOT_IN':
      if (!Array.isArray(targetValue)) {
        return false
      }
      return !(targetValue as (string | number)[]).includes(fieldValue as string | number)

    case '>':
      if (typeof fieldValue !== 'number' || typeof targetValue !== 'number') {
        return false
      }
      return fieldValue > targetValue

    case '>=':
      if (typeof fieldValue !== 'number' || typeof targetValue !== 'number') {
        return false
      }
      return fieldValue >= targetValue

    case '<':
      if (typeof fieldValue !== 'number' || typeof targetValue !== 'number') {
        return false
      }
      return fieldValue < targetValue

    case '<=':
      if (typeof fieldValue !== 'number' || typeof targetValue !== 'number') {
        return false
      }
      return fieldValue <= targetValue

    default:
      // 未知の演算子の場合はfalse
      return false
  }
}
