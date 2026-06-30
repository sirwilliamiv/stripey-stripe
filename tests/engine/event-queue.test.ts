import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useEventQueue } from '@/engine/event-queue'
import { emit } from '@/engine/event-emitter'
import type { SimEvent, ComplianceState } from '@/engine/types'

const makeEvent = (overrides: Partial<SimEvent> = {}): SimEvent => ({
  id: 'evt_test_1',
  timestamp: '2026-06-29T00:00:00Z',
  actor: 'user',
  phase: 'user_action',
  source: 'test',
  action: 'test action',
  complianceStates: ['idle'],
  simulationLevel: 'simulated',
  ...overrides,
})

describe('useEventQueue', () => {
  beforeEach(() => {
    useEventQueue.getState().clear()
  })

  it('starts empty', () => {
    const { result } = renderHook(() => useEventQueue())
    expect(result.current.events).toHaveLength(0)
  })

  it('enqueue adds event to events array', () => {
    const { result } = renderHook(() => useEventQueue())
    act(() => result.current.enqueue(makeEvent()))
    expect(result.current.events).toHaveLength(1)
  })

  it('enqueue multiple events adds all to array', () => {
    const { result } = renderHook(() => useEventQueue())
    act(() => {
      result.current.enqueue(makeEvent({ id: 'evt_1' }))
      result.current.enqueue(makeEvent({ id: 'evt_2' }))
    })
    expect(result.current.events).toHaveLength(2)
  })

  it('clear resets to empty', () => {
    const { result } = renderHook(() => useEventQueue())
    act(() => {
      result.current.enqueue(makeEvent())
      result.current.clear()
    })
    expect(result.current.events).toHaveLength(0)
  })

  it('enqueue does NOT manage cursor — queue has no cursor', () => {
    // Queue exposes no cursor field. Cursor lives in DVR.
    const { result } = renderHook(() => useEventQueue())
    act(() => result.current.enqueue(makeEvent()))
    expect((result.current as unknown as Record<string, unknown>)['cursor']).toBeUndefined()
  })
})

const makeEmitPartial = (overrides: Partial<Omit<SimEvent, 'id' | 'timestamp'>> = {}) => ({
  actor: 'user' as const,
  phase: 'user_action' as const,
  source: 'test',
  action: 'test action',
  complianceStates: ['idle'] as ComplianceState[],
  simulationLevel: 'simulated' as const,
  ...overrides,
})

describe('emit helper', () => {
  beforeEach(() => {
    useEventQueue.getState().clear()
  })

  it('creates an event and enqueues it', () => {
    const evt = emit(makeEmitPartial())
    expect(useEventQueue.getState().events).toHaveLength(1)
    expect(evt.id).toMatch(/^evt_/)
    expect(evt.timestamp).toBeTruthy()
  })

  it('generates unique ids across calls', () => {
    const e1 = emit(makeEmitPartial())
    const e2 = emit(makeEmitPartial())
    expect(e1.id).not.toBe(e2.id)
  })

  it('preserves all provided fields', () => {
    const evt = emit(makeEmitPartial({ action: 'custom action', actor: 'stripe', phase: 'stripe_object' }))
    expect(evt.action).toBe('custom action')
    expect(evt.actor).toBe('stripe')
    expect(evt.phase).toBe('stripe_object')
  })

  it('requires phase field (TypeScript enforced)', () => {
    // This test confirms phase is required at compile time.
    // @ts-expect-error — phase is required
    const result = () => emit({ actor: 'user', source: 'test', action: 'test', complianceStates: ['idle'], simulationLevel: 'simulated' })
    void result
    expect(true).toBe(true) // type error above is the assertion
  })
})
