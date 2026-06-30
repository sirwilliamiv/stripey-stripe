import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'
import { emit } from '@/engine/event-emitter'
import type { ComplianceState } from '@/engine/types'

const makePartial = (overrides = {}) => ({
  actor: 'user' as const,
  phase: 'user_action' as const,
  source: 'test',
  action: 'test',
  complianceStates: ['idle'] as ComplianceState[],
  simulationLevel: 'simulated' as const,
  ...overrides,
})

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined, isPlaying: false, isFrozen: false, speed: 1 })
})

describe('useDVR — playback controls', () => {
  it('starts paused, unfrozen, cursor -1', () => {
    const { result } = renderHook(() => useDVR())
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.isFrozen).toBe(false)
    expect(result.current.cursor).toBe(-1)
  })

  it('play sets isPlaying true', () => {
    const { result } = renderHook(() => useDVR())
    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(true)
  })

  it('freeze locks both play state and isFrozen', () => {
    const { result } = renderHook(() => useDVR())
    act(() => result.current.freeze())
    expect(result.current.isFrozen).toBe(true)
    expect(result.current.isPlaying).toBe(false)
  })

  it('setSpeed changes speed', () => {
    const { result } = renderHook(() => useDVR())
    act(() => result.current.setSpeed(2))
    expect(result.current.speed).toBe(2)
  })
})

describe('useDVR — cursor management (the DVR learning model)', () => {
  it('first enqueue always shows the event (cursor -1 → 0), even when paused', () => {
    // paused by default — emit() generates its own id, test by action instead
    act(() => emit(makePartial({ action: 'first event' })))
    expect(useDVR.getState().cursor).toBe(0)
    expect(useDVR.getState().currentEvent?.action).toBe('first event')
  })

  it('enqueue does NOT advance cursor when paused and cursor already set', () => {
    act(() => emit(makePartial({ action: 'first event' })))   // cursor → 0
    act(() => emit(makePartial({ action: 'second event' })))  // paused: cursor stays 0
    expect(useDVR.getState().cursor).toBe(0)
    expect(useDVR.getState().currentEvent?.action).toBe('first event')
  })

  it('enqueue advances cursor to latest when playing', () => {
    useDVR.setState({ isPlaying: true, isFrozen: false })
    act(() => emit(makePartial({ action: 'first event' })))
    act(() => emit(makePartial({ action: 'second event' })))
    expect(useDVR.getState().cursor).toBe(1)
    expect(useDVR.getState().currentEvent?.action).toBe('second event')
  })

  it('freeze prevents cursor movement even when isPlaying was true', () => {
    useDVR.setState({ isPlaying: true, isFrozen: true })
    act(() => emit(makePartial({ action: 'first event' })))   // cursor → 0 (first event rule)
    act(() => emit(makePartial({ action: 'second event' })))  // frozen: stays at 0
    expect(useDVR.getState().cursor).toBe(0)
    expect(useDVR.getState().currentEvent?.action).toBe('first event')
  })

  it('stepForward advances cursor by 1', () => {
    act(() => emit(makePartial({ action: 'first event' })))
    act(() => emit(makePartial({ action: 'second event' })))
    // cursor is at 0 (paused after first event)
    const { result } = renderHook(() => useDVR())
    act(() => result.current.stepForward())
    expect(result.current.cursor).toBe(1)
    expect(result.current.currentEvent?.action).toBe('second event')
  })

  it('stepBack decrements cursor by 1', () => {
    act(() => emit(makePartial({ action: 'first event' })))
    act(() => emit(makePartial({ action: 'second event' })))
    // manually advance cursor to 1 so we can step back
    const events = useEventQueue.getState().events
    useDVR.setState({ cursor: 1, currentEvent: events[1] ?? events[0] })
    const { result } = renderHook(() => useDVR())
    act(() => result.current.stepBack())
    expect(result.current.cursor).toBe(0)
    expect(result.current.currentEvent?.action).toBe('first event')
  })

  it('clear resets cursor to -1', () => {
    act(() => emit(makePartial({ action: 'first event' })))
    act(() => useEventQueue.getState().clear())
    expect(useDVR.getState().cursor).toBe(-1)
    expect(useDVR.getState().currentEvent).toBeUndefined()
  })
})
