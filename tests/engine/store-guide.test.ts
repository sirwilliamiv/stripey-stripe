import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { emit } from '@/engine/event-emitter'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined })
})

describe('StoreGuidance in events', () => {
  it('events can carry storeGuidance', () => {
    const evt = emit({
      actor: 'stripe',
      phase: 'webhook',
      source: 'checkout',
      action: 'checkout.session.completed',
      stripeObject: 'CheckoutSession',
      complianceStates: ['pii'],
      simulationLevel: 'simulated',
      storeGuidance: {
        store: ['customer.id', 'session.id', 'payment_intent.id'],
        neverStore: ['card number', 'CVC'],
        sourceOfTruth: ['payment status'],
        listenFor: ['checkout.session.completed'],
      },
    })
    expect(evt.storeGuidance?.store).toContain('customer.id')
    expect(evt.storeGuidance?.neverStore).toContain('card number')
  })

  it('DVR currentEvent reflects storeGuidance', () => {
    act(() => {
      emit({
        actor: 'stripe',
        phase: 'webhook',
        source: 'test',
        action: 'test.event',
        complianceStates: ['idle'],
        simulationLevel: 'simulated',
        storeGuidance: {
          store: ['order_id'],
          neverStore: [],
          sourceOfTruth: [],
          listenFor: ['test.event'],
        },
      })
    })
    // currentEvent lives in DVR, not in useEventQueue
    expect(useDVR.getState().currentEvent?.storeGuidance?.store).toContain('order_id')
  })
})
