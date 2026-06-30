import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import { DVRControls } from '@/components/observatory/DVRControls'
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'
import { emit } from '@/engine/event-emitter'

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined, isPlaying: false, isFrozen: false, speed: 1 })
})

describe('DVRControls', () => {
  it('shows paused state by default', () => {
    render(<DVRControls />)
    expect(screen.getByTitle('Play')).toBeTruthy()
  })

  it('shows frozen label when frozen', () => {
    useDVR.setState({ isFrozen: true })
    render(<DVRControls />)
    expect(screen.getAllByText(/frozen/)[0]).toBeTruthy()
  })

  it('shows event count', () => {
    act(() => {
      emit({ actor: 'user', phase: 'user_action', source: 'test', action: 'a', complianceStates: ['idle'], simulationLevel: 'simulated' })
      emit({ actor: 'user', phase: 'user_action', source: 'test', action: 'b', complianceStates: ['idle'], simulationLevel: 'simulated' })
    })
    render(<DVRControls />)
    expect(screen.getByText('1/2')).toBeTruthy()
  })
})
