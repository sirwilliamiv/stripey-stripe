import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { ComplianceBorder } from '@/components/shell/ComplianceBorder'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'

describe('ComplianceBorder', () => {
  beforeEach(() => {
    useEventQueue.getState().clear()
    useDVR.setState({ cursor: -1, currentEvent: undefined, isPlaying: false, isFrozen: false, speed: 1, stepDelayMs: 3000 })
  })

  it('renders without throwing', () => {
    expect(() => render(<ComplianceBorder />)).not.toThrow()
  })

  it('renders a fixed-position overlay element', () => {
    const { container } = render(<ComplianceBorder />)
    // The component renders a motion.div with fixed positioning
    const fixed = container.querySelector('.fixed')
    expect(fixed).toBeTruthy()
  })
})
