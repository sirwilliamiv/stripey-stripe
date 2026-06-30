import { describe, it, expect } from 'vitest'
import { redactSensitiveFields } from '@/engine/redaction'

describe('redactSensitiveFields', () => {
  it('redacts card number fields', () => {
    const result = redactSensitiveFields({ number: '4242424242424242', amount: 100 })
    expect((result as Record<string, unknown>).number).toBe('[REDACTED]')
    expect((result as Record<string, unknown>).amount).toBe(100)
  })

  it('redacts cvc', () => {
    const result = redactSensitiveFields({ cvc: '123' })
    expect((result as Record<string, unknown>).cvc).toBe('[REDACTED]')
  })

  it('redacts nested sensitive fields', () => {
    const result = redactSensitiveFields({ card: { number: '4242', cvc: '123', exp_month: 12 } })
    const card = (result as Record<string, unknown>).card as Record<string, unknown>
    expect(card.number).toBe('[REDACTED]')
    expect(card.cvc).toBe('[REDACTED]')
    expect(card.exp_month).toBe('[REDACTED]')
  })

  it('redacts ssn and tax_id', () => {
    const result = redactSensitiveFields({ ssn: '123-45-6789', tax_id: 'EIN123' })
    expect((result as Record<string, unknown>).ssn).toBe('[REDACTED]')
    expect((result as Record<string, unknown>).tax_id).toBe('[REDACTED]')
  })

  it('passes through non-sensitive primitives', () => {
    expect(redactSensitiveFields('hello')).toBe('hello')
    expect(redactSensitiveFields(42)).toBe(42)
    expect(redactSensitiveFields(null)).toBeNull()
  })

  it('handles arrays by redacting each element', () => {
    const result = redactSensitiveFields([{ number: '4242' }, { amount: 100 }])
    expect((result as Array<Record<string, unknown>>)[0]?.number).toBe('[REDACTED]')
    expect((result as Array<Record<string, unknown>>)[1]?.amount).toBe(100)
  })
})
