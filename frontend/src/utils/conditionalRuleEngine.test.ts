import { describe, it, expect } from 'vitest'
import { evaluateConditionalRule } from './conditionalRuleEngine'
import type { ConditionalRule } from '../types/formV3'

describe('条件ルール評価エンジン', () => {
  describe('単純なAND条件', () => {
    it('すべての条件が満たされた場合、trueを返す', () => {
      const rule: ConditionalRule = {
        AND: [
          { field: 'plan_type', operator: '=', value: 'studio' },
          { field: 'basic_option', operator: '=', value: 'weekday' }
        ]
      }

      const formValues = {
        plan_type: 'studio',
        basic_option: 'weekday'
      }

      expect(evaluateConditionalRule(rule, formValues)).toBe(true)
    })

    it('いずれかの条件が満たされない場合、falseを返す', () => {
      const rule: ConditionalRule = {
        AND: [
          { field: 'plan_type', operator: '=', value: 'studio' },
          { field: 'basic_option', operator: '=', value: 'weekday' }
        ]
      }

      const formValues = {
        plan_type: 'studio',
        basic_option: 'weekend' // 不一致
      }

      expect(evaluateConditionalRule(rule, formValues)).toBe(false)
    })
  })

  describe('単純なOR条件', () => {
    it('いずれかの条件が満たされた場合、trueを返す', () => {
      const rule: ConditionalRule = {
        OR: [
          { field: 'plan_type', operator: '=', value: 'studio' },
          { field: 'plan_type', operator: '=', value: 'on_location' }
        ]
      }

      const formValues = {
        plan_type: 'on_location'
      }

      expect(evaluateConditionalRule(rule, formValues)).toBe(true)
    })

    it('すべての条件が満たされない場合、falseを返す', () => {
      const rule: ConditionalRule = {
        OR: [
          { field: 'plan_type', operator: '=', value: 'studio' },
          { field: 'plan_type', operator: '=', value: 'on_location' }
        ]
      }

      const formValues = {
        plan_type: 'photo_only' // どちらにも不一致
      }

      expect(evaluateConditionalRule(rule, formValues)).toBe(false)
    })
  })

  describe('IN オペレーター', () => {
    it('値が配列に含まれる場合、trueを返す', () => {
      const rule: ConditionalRule = {
        AND: [
          { field: 'plan_type', operator: 'IN', value: ['studio', 'on_location'] }
        ]
      }

      const formValues = {
        plan_type: 'studio'
      }

      expect(evaluateConditionalRule(rule, formValues)).toBe(true)
    })

    it('値が配列に含まれない場合、falseを返す', () => {
      const rule: ConditionalRule = {
        AND: [
          { field: 'plan_type', operator: 'IN', value: ['studio', 'on_location'] }
        ]
      }

      const formValues = {
        plan_type: 'photo_only'
      }

      expect(evaluateConditionalRule(rule, formValues)).toBe(false)
    })
  })

  describe('AND + OR の複合条件', () => {
    it('v3仕様書の例: (studio AND weekday) OR on_location', () => {
      const rule: ConditionalRule = {
        OR: [
          {
            AND: [
              { field: 'plan_type', operator: '=', value: 'studio' },
              { field: 'basic_option', operator: '=', value: 'weekday' }
            ]
          },
          { field: 'plan_type', operator: '=', value: 'on_location' }
        ]
      }

      // ケース1: studio AND weekday → true
      expect(evaluateConditionalRule(rule, {
        plan_type: 'studio',
        basic_option: 'weekday'
      })).toBe(true)

      // ケース2: studio AND weekend → false (ただしon_locationでもない)
      expect(evaluateConditionalRule(rule, {
        plan_type: 'studio',
        basic_option: 'weekend'
      })).toBe(false)

      // ケース3: on_location → true
      expect(evaluateConditionalRule(rule, {
        plan_type: 'on_location',
        basic_option: 'weekend'
      })).toBe(true)
    })
  })

  describe('boolean値の評価', () => {
    it('true値の比較', () => {
      const rule: ConditionalRule = {
        AND: [
          { field: 'preparation_flag', operator: '=', value: true }
        ]
      }

      expect(evaluateConditionalRule(rule, { preparation_flag: true })).toBe(true)
      expect(evaluateConditionalRule(rule, { preparation_flag: false })).toBe(false)
    })
  })

  describe('数値の比較演算子', () => {
    it('> (より大きい)', () => {
      const rule: ConditionalRule = {
        AND: [
          { field: 'age', operator: '>', value: 20 }
        ]
      }

      expect(evaluateConditionalRule(rule, { age: 25 })).toBe(true)
      expect(evaluateConditionalRule(rule, { age: 20 })).toBe(false)
      expect(evaluateConditionalRule(rule, { age: 15 })).toBe(false)
    })

    it('>= (以上)', () => {
      const rule: ConditionalRule = {
        AND: [
          { field: 'age', operator: '>=', value: 20 }
        ]
      }

      expect(evaluateConditionalRule(rule, { age: 25 })).toBe(true)
      expect(evaluateConditionalRule(rule, { age: 20 })).toBe(true)
      expect(evaluateConditionalRule(rule, { age: 15 })).toBe(false)
    })

    it('< (より小さい)', () => {
      const rule: ConditionalRule = {
        AND: [
          { field: 'age', operator: '<', value: 20 }
        ]
      }

      expect(evaluateConditionalRule(rule, { age: 15 })).toBe(true)
      expect(evaluateConditionalRule(rule, { age: 20 })).toBe(false)
      expect(evaluateConditionalRule(rule, { age: 25 })).toBe(false)
    })
  })

  describe('エッジケース', () => {
    it('フィールドが存在しない場合、falseを返す', () => {
      const rule: ConditionalRule = {
        AND: [
          { field: 'non_existent_field', operator: '=', value: 'test' }
        ]
      }

      expect(evaluateConditionalRule(rule, {})).toBe(false)
    })

    it('空のAND配列の場合、trueを返す（すべての条件が満たされている）', () => {
      const rule: ConditionalRule = {
        AND: []
      }

      expect(evaluateConditionalRule(rule, {})).toBe(true)
    })

    it('空のOR配列の場合、falseを返す（いずれかの条件も満たされていない）', () => {
      const rule: ConditionalRule = {
        OR: []
      }

      expect(evaluateConditionalRule(rule, {})).toBe(false)
    })

    it('ANDとORが両方ある場合、ANDを優先する', () => {
      const rule: ConditionalRule = {
        AND: [
          { field: 'a', operator: '=', value: 1 }
        ],
        OR: [
          { field: 'b', operator: '=', value: 2 }
        ]
      }

      // AND条件のみを評価
      expect(evaluateConditionalRule(rule, { a: 1 })).toBe(true)
      expect(evaluateConditionalRule(rule, { b: 2 })).toBe(false)
    })
  })
})
