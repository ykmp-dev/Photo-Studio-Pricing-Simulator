/**
 * FormBuilder APIサービスのテスト（TDD）
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveFormBuilderData,
  loadFormBuilderData,
  updateFormBuilderData,
  deleteFormBuilderData,
  getFormBuilderDataByShootingCategory
} from './formBuilderService'
import type { FormBuilderData } from '../types/formBuilderV3'

// Supabaseクライアントのモック
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
      insert: vi.fn(() => Promise.resolve({ data: [], error: null })),
      update: vi.fn(() => Promise.resolve({ data: [], error: null })),
      delete: vi.fn(() => Promise.resolve({ error: null })),
      eq: vi.fn(function(this: any) { return this }),
      single: vi.fn(function(this: any) { return this })
    }))
  }
}))

describe('FormBuilder Service (TDD)', () => {
  const mockFormData: FormBuilderData = {
    shopId: 1,
    shootingCategoryId: 1,
    shootingCategoryName: '七五三',
    steps: [
      {
        type: 'trigger',
        category: {
          id: 1,
          name: 'shooting_course',
          displayName: '撮影コース',
          productType: 'plan',
          items: [
            { id: 1, name: 'スタジオ撮影', price: 50000 },
            { id: 2, name: 'ロケーション撮影', price: 80000 }
          ]
        }
      }
    ]
  }

  describe('saveFormBuilderData', () => {
    it('should save form builder data to database', async () => {
      const result = await saveFormBuilderData(mockFormData)

      expect(result).toBeDefined()
      expect(result.form_data).toEqual(mockFormData)
      expect(result.shop_id).toBe(mockFormData.shopId)
      expect(result.shooting_category_id).toBe(mockFormData.shootingCategoryId)
    })

    it('should throw error if shopId is missing', async () => {
      const invalidData = { ...mockFormData, shopId: 0 }

      await expect(saveFormBuilderData(invalidData)).rejects.toThrow()
    })

    it('should throw error if shootingCategoryId is missing', async () => {
      const invalidData = { ...mockFormData, shootingCategoryId: 0 }

      await expect(saveFormBuilderData(invalidData)).rejects.toThrow()
    })
  })

  describe('loadFormBuilderData', () => {
    it('should load form builder data by id', async () => {
      const result = await loadFormBuilderData(1)

      expect(result).toBeDefined()
      expect(result?.form_data).toBeDefined()
    })

    it('should return null if form not found', async () => {
      const result = await loadFormBuilderData(99999)

      expect(result).toBeNull()
    })
  })

  describe('getFormBuilderDataByShootingCategory', () => {
    it('should get form data by shopId and shootingCategoryId', async () => {
      const result = await getFormBuilderDataByShootingCategory(1, 1)

      expect(result).toBeDefined()
    })

    it('should return null if no form exists for the shooting category', async () => {
      const result = await getFormBuilderDataByShootingCategory(1, 99999)

      expect(result).toBeNull()
    })
  })

  describe('updateFormBuilderData', () => {
    it('should update existing form builder data', async () => {
      const updatedData = {
        ...mockFormData,
        shootingCategoryName: '成人式'
      }

      const result = await updateFormBuilderData(1, updatedData)

      expect(result).toBeDefined()
      expect(result.form_data.shootingCategoryName).toBe('成人式')
    })

    it('should throw error if id not found', async () => {
      await expect(updateFormBuilderData(99999, mockFormData)).rejects.toThrow()
    })
  })

  describe('deleteFormBuilderData', () => {
    it('should delete form builder data', async () => {
      await expect(deleteFormBuilderData(1)).resolves.not.toThrow()
    })

    it('should throw error if id not found', async () => {
      await expect(deleteFormBuilderData(99999)).rejects.toThrow()
    })
  })
})
