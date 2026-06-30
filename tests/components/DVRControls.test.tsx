import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DVRControls } from '@/components/observatory/DVRControls'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'
import { emit } from '@/engine/event-emitter'

function makePartial(): Omit<import('@/engine/types').SimEvent, 'id' | 'timestamp'> {
  return {
    actor: 'app',
    phase: 'server_call',
    source: 'test',
    action: 'test',
    complianceStates: [],
    simulationLevel: 'simulated',
  }
}

describe('DVRControls', () => {
  beforeEach(() => {
    useEventQueue.getState().clear()
    useDVR.setState({ cursor: -1, currentEvent: undefined, isPlaying: false, isFrozen: false, speed: 1, stepDelayMs: 3000 })
  })

  it('shows — / — when no events', () => {
    render(<DVRControls />)
    expect(screen.getByText('— / —')).toBeTruthy()
  })

  it('shows 1 / 1 after first event', () => {
    emit(makePartial())
    render(<DVRControls />)
    expect(screen.getByText('1 / 1')).toBeTruthy()
  })

  it('play button triggers play', () => {
    emit(makePartial())
    render(<DVRControls />)
    const play = screen.getByTitle('Play')
    fireEvent.click(play)
    expect(useDVR.getState().isPlaying).toBe(true)
  })

  it('pause button triggers pause', () => {
    emit(makePartial())
    useDVR.getState().play()
    render(<DVRControls />)
    const pause = screen.getByTitle('Pause')
    fireEvent.click(pause)
    expect(useDVR.getState().isPlaying).toBe(false)
  })

  it('step forward advances cursor', () => {
    emit(makePartial())
    emit(makePartial())
    render(<DVRControls />)
    expect(useDVR.getState().cursor).toBe(0)
    fireEvent.click(screen.getByTitle('Step forward'))
    expect(useDVR.getState().cursor).toBe(1)
  })

  it('jump to end button jumps to last event', () => {
    emit(makePartial())
    emit(makePartial())
    render(<DVRControls />)
    fireEvent.click(screen.getByTitle('Jump to end'))
    expect(useDVR.getState().cursor).toBe(1)
  })
})
