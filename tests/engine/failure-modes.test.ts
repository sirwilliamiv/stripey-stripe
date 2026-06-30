import { describe, it, expect } from 'vitest'
import { FAILURE_MODES, getFailureMode, getFailureModesByProduct } from '@/engine/failure-modes'

describe('FAILURE_MODES', () => {
  it('has exactly 17 modes', () => {
    expect(FAILURE_MODES).toHaveLength(17)
  })

  it('each mode has required fields', () => {
    for (const mode of FAILURE_MODES) {
      expect(mode.type).toBeTruthy()
      expect(mode.label).toBeTruthy()
      expect(mode.description).toBeTruthy()
      expect(Array.isArray(mode.affectedProducts)).toBe(true)
      expect(mode.affectedProducts.length).toBeGreaterThan(0)
    }
  })
})

describe('getFailureMode', () => {
  it('returns correct mode by type', () => {
    const mode = getFailureMode('card_declined')
    expect(mode?.type).toBe('card_declined')
    expect(mode?.label).toBeTruthy()
  })

  it('returns undefined for unknown type', () => {
    // @ts-expect-error intentional invalid type for test
    expect(getFailureMode('not_a_real_mode')).toBeUndefined()
  })
})

describe('getFailureModesByProduct', () => {
  it('returns modes for payments product', () => {
    const modes = getFailureModesByProduct('payments')
    expect(modes.length).toBeGreaterThan(0)
    for (const mode of modes) {
      expect(mode.affectedProducts).toContain('payments')
    }
  })

  it('returns empty for unknown product', () => {
    expect(getFailureModesByProduct('unknown_product')).toHaveLength(0)
  })
})
