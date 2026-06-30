import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { ApiLogTab } from '@/components/observatory/tabs/ApiLogTab'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'
import { emit } from '@/engine/event-emitter'

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined })
})

describe('ApiLogTab', () => {
  it('shows empty state before any events', () => {
    render(<ApiLogTab />)
    expect(screen.getAllByText(/No events yet/)[0]).toBeTruthy()
  })

  it('shows events up to cursor position', () => {
    act(() => {
      emit({ actor: 'app', phase: 'server_call', source: 'test', action: 'POST /v1/payment_intents', complianceStates: ['pci'], simulationLevel: 'simulated' })
    })
    render(<ApiLogTab />)
    expect(screen.getAllByText(/POST \/v1\/payment_intents/)[0]).toBeTruthy()
  })

  it('highlights current event at cursor', () => {
    act(() => {
      emit({ actor: 'user', phase: 'user_action', source: 'test', action: 'User clicked Buy', complianceStates: ['pii'], simulationLevel: 'simulated' })
    })
    const { container } = render(<ApiLogTab />)
    const highlighted = container.querySelector('.border-indigo-400')
    expect(highlighted).toBeTruthy()
  })
})
