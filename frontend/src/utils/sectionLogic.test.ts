import { describe, it, expect } from 'vitest'
import {
  shouldShowCategory,
  filterVisibleCategories,
  hasTriggerSections
} from './sectionLogic'
import type { ProductCategoryV3, FormValues } from '../types/formV3'

describe('セクション表示ロジック', () => {
  const createCategory = (
    id: number,
    formSection: 'trigger' | 'conditional' | 'common_final' | null,
    conditionalRule: any = null
  ): ProductCategoryV3 => ({
    id,
    shop_id: 1,
    name: `category_${id}`,
    display_name: `カテゴリ ${id}`,
    description: null,
    sort_order: id,
    is_active: true,
    form_section: formSection,
    product_type: 'plan',
    conditional_rule: conditionalRule,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  })

  describe('shouldShowCategory - 単一カテゴリの表示判定', () => {
    it('form_section: "trigger" は常に表示', () => {
      const category = createCategory(1, 'trigger')
      expect(shouldShowCategory(category, {})).toBe(true)
    })

    it('form_section: "common_final" は常に表示', () => {
      const category = createCategory(1, 'common_final')
      expect(shouldShowCategory(category, {})).toBe(true)
    })

    it('form_section: null は常に表示', () => {
      const category = createCategory(1, null)
      expect(shouldShowCategory(category, {})).toBe(true)
    })

    it('form_section: "conditional" + 条件ルールなし → 常に表示', () => {
      const category = createCategory(1, 'conditional', null)
      expect(shouldShowCategory(category, {})).toBe(true)
    })

    it('form_section: "conditional" + 条件ルール満たす → 表示', () => {
      const category = createCategory(1, 'conditional', {
        AND: [
          { field: 'plan_type', operator: '=', value: 'studio' }
        ]
      })

      const formValues: FormValues = {
        plan_type: 'studio'
      }

      expect(shouldShowCategory(category, formValues)).toBe(true)
    })

    it('form_section: "conditional" + 条件ルール満たさない → 非表示', () => {
      const category = createCategory(1, 'conditional', {
        AND: [
          { field: 'plan_type', operator: '=', value: 'studio' }
        ]
      })

      const formValues: FormValues = {
        plan_type: 'on_location' // 条件と異なる
      }

      expect(shouldShowCategory(category, formValues)).toBe(false)
    })
  })

  describe('filterVisibleCategories - カテゴリリストのフィルタリング', () => {
    it('v3仕様書のパターンA: Triggerあり + Conditional + Common Final', () => {
      const categories: ProductCategoryV3[] = [
        createCategory(1, 'trigger'), // 撮影コース
        createCategory(2, 'trigger'), // 基本オプション
        createCategory(3, 'conditional', {
          AND: [
            { field: 'plan_type', operator: '=', value: 'studio' },
            { field: 'basic_option', operator: '=', value: 'weekday' }
          ]
        }), // 着物グレード（条件付き）
        createCategory(4, 'common_final') // アルバム
      ]

      const formValues: FormValues = {
        plan_type: 'studio',
        basic_option: 'weekday'
      }

      const visible = filterVisibleCategories(categories, formValues)

      // Trigger(2) + Conditional(1: 条件満たす) + Common Final(1) = 4
      expect(visible).toHaveLength(4)
      expect(visible.map(c => c.id)).toEqual([1, 2, 3, 4])
    })

    it('条件を満たさないConditionalカテゴリは除外される', () => {
      const categories: ProductCategoryV3[] = [
        createCategory(1, 'trigger'),
        createCategory(2, 'conditional', {
          AND: [
            { field: 'plan_type', operator: '=', value: 'studio' }
          ]
        }),
        createCategory(3, 'conditional', {
          AND: [
            { field: 'plan_type', operator: '=', value: 'on_location' }
          ]
        }),
        createCategory(4, 'common_final')
      ]

      const formValues: FormValues = {
        plan_type: 'studio' // studioのみ満たす
      }

      const visible = filterVisibleCategories(categories, formValues)

      // Trigger(1) + Conditional(1: studio) + Common Final(1) = 3
      expect(visible).toHaveLength(3)
      expect(visible.map(c => c.id)).toEqual([1, 2, 4])
    })

    it('is_active: false のカテゴリは除外される', () => {
      const categories: ProductCategoryV3[] = [
        createCategory(1, 'trigger'),
        { ...createCategory(2, 'common_final'), is_active: false }
      ]

      const visible = filterVisibleCategories(categories, {})

      expect(visible).toHaveLength(1)
      expect(visible[0].id).toBe(1)
    })
  })

  describe('hasTriggerSections - Triggerセクションの存在確認', () => {
    it('Triggerセクションが1つでもあればtrue', () => {
      const categories: ProductCategoryV3[] = [
        createCategory(1, 'trigger'),
        createCategory(2, 'common_final')
      ]

      expect(hasTriggerSections(categories)).toBe(true)
    })

    it('Triggerセクションがなければfalse', () => {
      const categories: ProductCategoryV3[] = [
        createCategory(1, 'conditional'),
        createCategory(2, 'common_final')
      ]

      expect(hasTriggerSections(categories)).toBe(false)
    })

    it('空配列の場合false', () => {
      expect(hasTriggerSections([])).toBe(false)
    })

    it('is_active: false のTriggerはカウントしない', () => {
      const categories: ProductCategoryV3[] = [
        { ...createCategory(1, 'trigger'), is_active: false },
        createCategory(2, 'common_final')
      ]

      expect(hasTriggerSections(categories)).toBe(false)
    })
  })
})
