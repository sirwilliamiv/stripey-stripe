import { describe, it, expect } from 'vitest'
import { STRIPE_OBJECT_EXAMPLES, getObjectExample } from '@/engine/stripe-objects/examples'

describe('STRIPE_OBJECT_EXAMPLES', () => {
  it('has at least 3 example objects', () => {
    expect(STRIPE_OBJECT_EXAMPLES.length).toBeGreaterThanOrEqual(3)
  })

  it('each example has required fields', () => {
    for (const example of STRIPE_OBJECT_EXAMPLES) {
      expect(example.objectType).toBeTruthy()
      expect(example.id).toBeTruthy()
      expect(example.webhookEvents.length).toBeGreaterThan(0)
      expect(example.storeGuidance.store).toBeDefined()
      expect(example.storeGuidance.neverStore).toBeDefined()
      expect(example.relationships.length).toBeGreaterThan(0)
    }
  })
})

describe('getObjectExample', () => {
  it('returns Customer by objectType', () => {
    const obj = getObjectExample('Customer')
    expect(obj).toBeDefined()
    expect(obj?.id).toBe('cus_example123')
  })

  it('returns PaymentIntent', () => {
    const obj = getObjectExample('PaymentIntent')
    expect(obj?.id).toBe('pi_example789')
    expect(obj?.storeGuidance.store).toContain('id')
  })

  it('returns undefined for unknown type', () => {
    expect(getObjectExample('Widget')).toBeUndefined()
  })
})
