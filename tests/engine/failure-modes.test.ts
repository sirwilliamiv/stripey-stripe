import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFailureModes, FAILURE_MODES } from '@/engine/failure-modes'

beforeEach(() => {
  useFailureModes.getState().clearAll()
})

describe('FAILURE_MODES', () => {
  it('has all 17 failure modes defined', () => {
    expect(Object.keys(FAILURE_MODES)).toHaveLength(17)
  })

  it('each mode has label and description', () => {
    for (const mode of Object.values(FAILURE_MODES)) {
      expect(mode.label).toBeTruthy()
      expect(mode.description).toBeTruthy()
      expect(mode.affectedProducts.length).toBeGreaterThan(0)
    }
  })
})

describe('useFailureModes', () => {
  it('starts with no active modes', () => {
    const { result } = renderHook(() => useFailureModes())
    expect(result.current.active).toHaveLength(0)
  })

  it('toggle activates a mode', () => {
    const { result } = renderHook(() => useFailureModes())
    act(() => result.current.toggle('card_declined'))
    expect(result.current.active).toContain('card_declined')
  })

  it('toggle twice deactivates', () => {
    const { result } = renderHook(() => useFailureModes())
    act(() => {
      result.current.toggle('card_declined')
      result.current.toggle('card_declined')
    })
    expect(result.current.active).not.toContain('card_declined')
  })

  it('isActive returns correct boolean', () => {
    const { result } = renderHook(() => useFailureModes())
    act(() => result.current.toggle('webhook_delayed'))
    expect(result.current.isActive('webhook_delayed')).toBe(true)
    expect(result.current.isActive('card_declined')).toBe(false)
  })
})
