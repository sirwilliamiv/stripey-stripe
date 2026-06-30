import { describe, it, expect } from 'vitest'
import { STRIPE_OBJECT_EXAMPLES, getExampleByType } from '@/engine/stripe-objects/examples'

describe('STRIPE_OBJECT_EXAMPLES', () => {
  it('has at least 3 examples', () => {
    expect(STRIPE_OBJECT_EXAMPLES.length).toBeGreaterThanOrEqual(3)
  })

  it('each example has required fields', () => {
    for (const example of STRIPE_OBJECT_EXAMPLES) {
      expect(example.objectType).toBeTruthy()
      expect(example.id).toBeTruthy()
      expect(example.data).toBeTruthy()
      expect(Array.isArray(example.relationships)).toBe(true)
      expect(Array.isArray(example.webhookEvents)).toBe(true)
      expect(example.storeGuidance).toBeTruthy()
    }
  })

  it('each storeGuidance has the four arrays', () => {
    for (const example of STRIPE_OBJECT_EXAMPLES) {
      const g = example.storeGuidance
      expect(Array.isArray(g.store)).toBe(true)
      expect(Array.isArray(g.neverStore)).toBe(true)
      expect(Array.isArray(g.sourceOfTruth)).toBe(true)
      expect(Array.isArray(g.listenFor)).toBe(true)
    }
  })
})

describe('getExampleByType', () => {
  it('returns PaymentIntent example', () => {
    const ex = getExampleByType('PaymentIntent')
    expect(ex?.objectType).toBe('PaymentIntent')
  })

  it('returns undefined for unknown type', () => {
    expect(getExampleByType('NonExistent')).toBeUndefined()
  })
})
