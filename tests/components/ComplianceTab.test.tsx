import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { ComplianceTab } from '@/components/observatory/tabs/ComplianceTab'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'
import { emit } from '@/engine/event-emitter'

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined })
})

describe('ComplianceTab', () => {
  it('shows idle state by default', () => {
    render(<ComplianceTab />)
    expect(screen.getByText('Safe / Idle')).toBeTruthy()
  })

  it('shows PCI label when current event has pci state', () => {
    act(() => {
      emit({ actor: 'app', phase: 'client_call', source: 'elements', action: 'Card Element mounted', complianceStates: ['pci'], simulationLevel: 'simulated' })
    })
    render(<ComplianceTab />)
    expect(screen.getAllByText(/PCI/)[0]).toBeTruthy()
    expect(screen.getAllByText(/PCI-DSS/)[0]).toBeTruthy()
  })

  it('shows combined label for multiple active states', () => {
    act(() => {
      emit({ actor: 'app', phase: 'server_call', source: 'test', action: 'test', complianceStates: ['pii', 'pci'], simulationLevel: 'simulated' })
    })
    render(<ComplianceTab />)
    // result.label = "PCI Scope + PII In Flight" — shown as a single element when multiple states active
    expect(screen.getAllByText(/PCI.*PII/i)[0]).toBeTruthy()
  })
})
