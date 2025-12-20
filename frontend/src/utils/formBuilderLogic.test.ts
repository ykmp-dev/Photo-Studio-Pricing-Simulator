/**
 * フォームビルダーロジックのテスト（TDD）
 */
import { describe, it, expect } from 'vitest'
import {
  initFormBuilder,
  addTriggerStep,
  addConditionalStep,
  addCommonFinalStep,
  removeStep,
  validateFormBuilder,
  convertToProductCategories
} from './formBuilderLogic'
import type { FormBuilderCategory } from '../types/formBuilderV3'

describe('FormBuilder Logic', () => {
  const mockTriggerCategory: FormBuilderCategory = {
    id: 1,
    name: 'shooting_location',
    displayName: '撮影場所',
    productType: 'plan',
    items: [
      { id: 1, name: 'スタジオ撮影', price: 50000 },
      { id: 2, name: 'ロケーション撮影', price: 80000 }
    ]
  }

  const mockConditionalCategory: FormBuilderCategory = {
    id: 2,
    name: 'hair_makeup',
    displayName: 'ヘアメイク',
    productType: 'option_multi',
    items: [
      { id: 3, name: '基本ヘアセット', price: 10000 },
      { id: 4, name: 'フルメイク', price: 15000 }
    ]
  }

  const mockCommonFinalCategory: FormBuilderCategory = {
    id: 3,
    name: 'album',
    displayName: 'アルバム',
    productType: 'option_multi',
    items: [
      { id: 5, name: 'プレミアムアルバム', price: 5000 }
    ]
  }

  describe('initFormBuilder', () => {
    it('should initialize FormBuilderData with shooting category', () => {
      const result = initFormBuilder(1, '七五三')

      expect(result).toEqual({
        shootingCategoryId: 1,
        shootingCategoryName: '七五三',
        steps: []
      })
    })
  })

  describe('addTriggerStep', () => {
    it('should add a trigger step to FormBuilderData', () => {
      const formData = initFormBuilder(1, '七五三')
      const result = addTriggerStep(formData, mockTriggerCategory)

      expect(result.steps).toHaveLength(1)
      expect(result.steps[0].type).toBe('trigger')
      expect(result.steps[0].category).toEqual(mockTriggerCategory)
      expect(result.steps[0].condition).toBeUndefined()
    })

    it('should allow multiple trigger steps', () => {
      const formData = initFormBuilder(1, '七五三')
      const result1 = addTriggerStep(formData, mockTriggerCategory)
      const result2 = addTriggerStep(result1, { ...mockTriggerCategory, id: 99, displayName: '曜日' })

      expect(result2.steps).toHaveLength(2)
      expect(result2.steps.every(s => s.type === 'trigger')).toBe(true)
    })
  })

  describe('addConditionalStep', () => {
    it('should add a conditional step with condition', () => {
      const formData = initFormBuilder(1, '七五三')
      const withTrigger = addTriggerStep(formData, mockTriggerCategory)

      const result = addConditionalStep(withTrigger, mockConditionalCategory, {
        fieldId: 1,
        fieldName: '撮影場所',
        value: 'スタジオ撮影'
      })

      expect(result.steps).toHaveLength(2)
      expect(result.steps[1].type).toBe('conditional')
      expect(result.steps[1].condition).toEqual({
        fieldId: 1,
        fieldName: '撮影場所',
        value: 'スタジオ撮影'
      })
    })

    it('should throw error if no trigger steps exist', () => {
      const formData = initFormBuilder(1, '七五三')

      expect(() => {
        addConditionalStep(formData, mockConditionalCategory, {
          fieldId: 1,
          fieldName: '撮影場所',
          value: 'スタジオ撮影'
        })
      }).toThrow('分岐設定を追加するには、最初に選ぶ項目が必要です')
    })
  })

  describe('addCommonFinalStep', () => {
    it('should add a common_final step', () => {
      const formData = initFormBuilder(1, '七五三')
      const result = addCommonFinalStep(formData, mockCommonFinalCategory)

      expect(result.steps).toHaveLength(1)
      expect(result.steps[0].type).toBe('common_final')
      expect(result.steps[0].condition).toBeUndefined()
    })
  })

  describe('removeStep', () => {
    it('should remove a step by index', () => {
      const formData = initFormBuilder(1, '七五三')
      const withSteps = addTriggerStep(
        addTriggerStep(formData, mockTriggerCategory),
        { ...mockTriggerCategory, id: 99 }
      )

      const result = removeStep(withSteps, 0)

      expect(result.steps).toHaveLength(1)
      expect(result.steps[0].category.id).toBe(99)
    })
  })

  describe('validateFormBuilder', () => {
    it('should return valid for properly configured form', () => {
      const formData = initFormBuilder(1, '七五三')
      const withTrigger = addTriggerStep(formData, mockTriggerCategory)

      const result = validateFormBuilder(withTrigger)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should return error if no trigger steps', () => {
      const formData = initFormBuilder(1, '七五三')

      const result = validateFormBuilder(formData)

      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('最初に選ぶ項目を追加してください')
    })

    it('should return error if category has no items', () => {
      const formData = initFormBuilder(1, '七五三')
      const emptyCategory: FormBuilderCategory = {
        ...mockTriggerCategory,
        items: []
      }
      const withTrigger = addTriggerStep(formData, emptyCategory)

      const result = validateFormBuilder(withTrigger)

      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('convertToProductCategories', () => {
    it('should convert FormBuilderData to product categories and items', () => {
      const formData = initFormBuilder(1, '七五三')
      const withTrigger = addTriggerStep(formData, mockTriggerCategory)

      const result = convertToProductCategories(withTrigger)

      expect(result.categories).toHaveLength(1)
      expect(result.categories[0].form_section).toBe('trigger')
      expect(result.categories[0].product_type).toBe('plan')
      expect(result.items).toHaveLength(2)
    })

    it('should set conditional_rule for conditional steps', () => {
      const formData = initFormBuilder(1, '七五三')
      const withTrigger = addTriggerStep(formData, mockTriggerCategory)
      const withConditional = addConditionalStep(withTrigger, mockConditionalCategory, {
        fieldId: 1,
        fieldName: '撮影場所',
        value: 'スタジオ撮影'
      })

      const result = convertToProductCategories(withConditional)

      const conditionalCategory = result.categories.find(c => c.form_section === 'conditional')
      expect(conditionalCategory).toBeDefined()
      expect(conditionalCategory?.conditional_rule).toEqual({
        AND: [{
          field: 'category_1',
          operator: '=',
          value: 'スタジオ撮影'
        }]
      })
    })
  })
})
