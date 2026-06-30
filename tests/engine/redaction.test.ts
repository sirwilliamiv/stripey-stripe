import { describe, it, expect } from 'vitest'
import { redactSensitiveFields } from '@/engine/redaction'

describe('redactSensitiveFields', () => {
  it('redacts card_number', () => {
    const result = redactSensitiveFields({ card_number: '4242424242424242' })
    expect((result as Record<string, unknown>).card_number).toBe('****')
  })

  it('redacts cvc', () => {
    const result = redactSensitiveFields({ cvc: '123' })
    expect((result as Record<string, unknown>).cvc).toBe('****')
  })

  it('redacts secret_key', () => {
    const result = redactSensitiveFields({ secret_key: 'sk_live_abcdef' })
    expect((result as Record<string, unknown>).secret_key).toBe('****')
  })

  it('passes through non-sensitive fields', () => {
    const result = redactSensitiveFields({ amount: 2000, currency: 'usd' })
    expect((result as Record<string, unknown>).amount).toBe(2000)
    expect((result as Record<string, unknown>).currency).toBe('usd')
  })

  it('handles nested objects', () => {
    const result = redactSensitiveFields({ data: { card_number: '4242' } })
    expect(((result as Record<string, unknown>).data as Record<string, unknown>).card_number).toBe('****')
  })

  it('handles arrays', () => {
    const result = redactSensitiveFields([{ card_number: '4242' }, { amount: 100 }])
    const arr = result as Array<Record<string, unknown>>
    expect(arr[0]?.card_number).toBe('****')
    expect(arr[1]?.amount).toBe(100)
  })

  it('returns null/undefined as-is', () => {
    expect(redactSensitiveFields(null)).toBeNull()
    expect(redactSensitiveFields(undefined)).toBeUndefined()
  })

  it('partial-masks id-like fields', () => {
    const result = redactSensitiveFields({ payment_method: 'pm_1234567890abcdef' })
    const val = (result as Record<string, unknown>).payment_method as string
    expect(val).toContain('****')
    expect(val).toContain('cdef')
  })
})
