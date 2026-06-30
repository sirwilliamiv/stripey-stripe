import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePersona, PERSONAS } from '@/engine/persona'

beforeEach(() => {
  usePersona.setState({ active: PERSONAS['alex']! })
})

describe('usePersona', () => {
  it('starts with alex as default', () => {
    const { result } = renderHook(() => usePersona())
    expect(result.current.active.id).toBe('alex')
  })

  it('swap changes active persona', () => {
    const { result } = renderHook(() => usePersona())
    act(() => result.current.swap('maya'))
    expect(result.current.active.id).toBe('maya')
    expect(result.current.active.role).toBe('seller')
  })

  it('all 6 personas are defined', () => {
    expect(Object.keys(PERSONAS)).toHaveLength(6)
  })

  it('maya is a fully verified seller', () => {
    expect(PERSONAS['maya']?.kycState).toBe('verified')
    expect(PERSONAS['maya']?.connectState).toBe('active')
    expect(PERSONAS['maya']?.connectType).toBe('express')
  })

  it('jordan is mid-onboarding', () => {
    expect(PERSONAS['jordan']?.kycState).toBe('pending')
    expect(PERSONAS['jordan']?.connectState).toBe('onboarding')
  })

  it('dana uses SSO', () => {
    expect(PERSONAS['dana']?.useSso).toBe(true)
  })
})
