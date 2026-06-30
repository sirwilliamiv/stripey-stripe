import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StoreGuideTab } from '@/components/observatory/tabs/StoreGuideTab'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'
import { emit } from '@/engine/event-emitter'
import type { StoreGuidance } from '@/engine/types'

const testGuidance: StoreGuidance = {
  store: ['PaymentIntent.id', 'PaymentIntent.status'],
  neverStore: ['card number', 'CVC'],
  sourceOfTruth: ['Listen for payment_intent.succeeded'],
  listenFor: ['payment_intent.succeeded'],
}

describe('StoreGuideTab', () => {
  beforeEach(() => {
    useEventQueue.getState().clear()
    useDVR.setState({ cursor: -1, currentEvent: undefined, isPlaying: false, isFrozen: false, speed: 1, stepDelayMs: 3000 })
  })

  it('shows placeholder when no current event', () => {
    render(<StoreGuideTab />)
    expect(screen.getByText(/No storage guidance/i)).toBeTruthy()
  })

  it('renders store guidance when event has storeGuidance', () => {
    emit({
      actor: 'stripe',
      phase: 'webhook',
      source: 'Stripe',
      action: 'payment_intent.succeeded',
      complianceStates: ['pci'],
      simulationLevel: 'simulated',
      storeGuidance: testGuidance,
    })
    render(<StoreGuideTab />)
    expect(screen.getByText('PaymentIntent.id')).toBeTruthy()
    expect(screen.getByText('card number')).toBeTruthy()
  })
})
