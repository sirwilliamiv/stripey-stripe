import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { StoreGuideTab } from '@/components/observatory/tabs/StoreGuideTab'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'
import { emit } from '@/engine/event-emitter'

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined })
})

describe('StoreGuideTab', () => {
  it('shows no guidance message when no event', () => {
    render(<StoreGuideTab />)
    expect(screen.getAllByText(/No store guidance/)[0]).toBeTruthy()
  })

  it('shows store guidance from current event', () => {
    act(() => {
      emit({
        actor: 'stripe', phase: 'webhook', source: 'stripe', action: 'checkout.session.completed',
        complianceStates: ['idle'], simulationLevel: 'simulated',
        storeGuidance: {
          store: ['customer.id', 'session.id'],
          neverStore: ['card number'],
          sourceOfTruth: ['payment status'],
          listenFor: ['checkout.session.completed'],
        },
      })
    })
    render(<StoreGuideTab />)
    expect(screen.getByText('customer.id')).toBeTruthy()
    expect(screen.getByText('card number')).toBeTruthy()
  })
})
