import { describe, it, expect, beforeEach } from 'vitest'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'
import { emit } from '@/engine/event-emitter'
import type { SimEvent } from '@/engine/types'

function makePartial(overrides: Partial<Omit<SimEvent, 'id' | 'timestamp'>> = {}): Omit<SimEvent, 'id' | 'timestamp'> {
  return {
    actor: 'app',
    phase: 'server_call',
    source: 'test',
    action: 'test action',
    complianceStates: [],
    simulationLevel: 'simulated',
    ...overrides,
  }
}

describe('useDVR', () => {
  beforeEach(() => {
    useEventQueue.getState().clear()
    useDVR.setState({ cursor: -1, currentEvent: undefined, isPlaying: false, isFrozen: false })
  })

  it('starts at cursor -1', () => {
    expect(useDVR.getState().cursor).toBe(-1)
    expect(useDVR.getState().currentEvent).toBeUndefined()
  })

  it('sets cursor to 0 on first event', () => {
    emit(makePartial({ action: 'first event' }))
    expect(useDVR.getState().cursor).toBe(0)
    expect(useDVR.getState().currentEvent?.action).toBe('first event')
  })

  it('holds cursor when paused on second event', () => {
    useDVR.getState().pause()
    emit(makePartial({ action: 'first event' }))
    emit(makePartial({ action: 'second event' }))
    expect(useDVR.getState().cursor).toBe(0)
    expect(useDVR.getState().currentEvent?.action).toBe('first event')
  })

  it('advances to latest when playing', () => {
    useDVR.getState().play()
    emit(makePartial({ action: 'first event' }))
    emit(makePartial({ action: 'second event' }))
    expect(useDVR.getState().cursor).toBe(1)
    expect(useDVR.getState().currentEvent?.action).toBe('second event')
  })

  it('stepForward advances cursor', () => {
    emit(makePartial({ action: 'first event' }))
    emit(makePartial({ action: 'second event' }))
    expect(useDVR.getState().cursor).toBe(0)
    useDVR.getState().stepForward()
    expect(useDVR.getState().cursor).toBe(1)
    expect(useDVR.getState().currentEvent?.action).toBe('second event')
  })

  it('stepBack retreats cursor', () => {
    useDVR.getState().play()
    emit(makePartial({ action: 'first event' }))
    emit(makePartial({ action: 'second event' }))
    useDVR.getState().stepBack()
    expect(useDVR.getState().cursor).toBe(0)
    expect(useDVR.getState().currentEvent?.action).toBe('first event')
  })

  it('jumpToEnd sets cursor to last', () => {
    emit(makePartial({ action: 'first event' }))
    emit(makePartial({ action: 'second event' }))
    useDVR.getState().jumpToEnd()
    expect(useDVR.getState().cursor).toBe(1)
    expect(useDVR.getState().currentEvent?.action).toBe('second event')
  })

  it('jumpToStart sets cursor to 0', () => {
    useDVR.getState().play()
    emit(makePartial({ action: 'first event' }))
    emit(makePartial({ action: 'second event' }))
    useDVR.getState().jumpToStart()
    expect(useDVR.getState().cursor).toBe(0)
    expect(useDVR.getState().currentEvent?.action).toBe('first event')
  })

  it('resets on clear', () => {
    emit(makePartial({ action: 'first event' }))
    expect(useDVR.getState().cursor).toBe(0)
    useEventQueue.getState().clear()
    expect(useDVR.getState().cursor).toBe(-1)
    expect(useDVR.getState().currentEvent).toBeUndefined()
  })

  it('freeze prevents cursor advance while playing', () => {
    useDVR.getState().play()
    emit(makePartial({ action: 'first event' }))
    useDVR.getState().freeze()
    emit(makePartial({ action: 'second event' }))
    expect(useDVR.getState().cursor).toBe(0)
  })
})
