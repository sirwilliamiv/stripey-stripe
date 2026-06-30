import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ComplianceBorder } from '@/components/shell/ComplianceBorder'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'
import { emit } from '@/engine/event-emitter'

describe('ComplianceBorder', () => {
  beforeEach(() => {
    useEventQueue.getState().clear()
    useDVR.setState({ cursor: -1, currentEvent: undefined, isPlaying: false, isFrozen: false, speed: 1, stepDelayMs: 3000 })
  })

  it('renders children', () => {
    render(<ComplianceBorder><div>hello</div></ComplianceBorder>)
    expect(screen.getByText('hello')).toBeTruthy()
  })

  it('shows idle aria-label by default', () => {
    render(<ComplianceBorder><div>x</div></ComplianceBorder>)
    expect(screen.getByLabelText(/Compliance state: Safe \/ Idle/i)).toBeTruthy()
  })

  it('shows pci aria-label when event has pci state', () => {
    emit({
      actor: 'app',
      phase: 'client_call',
      source: 'test',
      action: 'stripe.confirmCardPayment()',
      complianceStates: ['pci'],
      simulationLevel: 'simulated',
    })
    render(<ComplianceBorder><div>x</div></ComplianceBorder>)
    expect(screen.getByLabelText(/Compliance state: PCI Scope/i)).toBeTruthy()
  })
})
