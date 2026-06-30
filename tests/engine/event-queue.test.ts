import { describe, it, expect, beforeEach } from 'vitest'
import { useEventQueue } from '@/engine/event-queue'
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

describe('useEventQueue', () => {
  beforeEach(() => {
    useEventQueue.getState().clear()
  })

  it('starts empty', () => {
    expect(useEventQueue.getState().events).toHaveLength(0)
  })

  it('enqueues events', () => {
    useEventQueue.getState().enqueue({
      id: 'evt_001',
      timestamp: new Date().toISOString(),
      ...makePartial({ action: 'first' }),
    })
    expect(useEventQueue.getState().events).toHaveLength(1)
  })

  it('clears all events', () => {
    useEventQueue.getState().enqueue({
      id: 'evt_001',
      timestamp: new Date().toISOString(),
      ...makePartial(),
    })
    useEventQueue.getState().clear()
    expect(useEventQueue.getState().events).toHaveLength(0)
  })
})

describe('emit()', () => {
  beforeEach(() => {
    useEventQueue.getState().clear()
  })

  it('generates a unique id', () => {
    const a = emit(makePartial({ action: 'a' }))
    const b = emit(makePartial({ action: 'b' }))
    expect(a.id).not.toBe(b.id)
  })

  it('sets timestamp as ISO string', () => {
    const evt = emit(makePartial())
    expect(evt.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('enqueues to the store', () => {
    emit(makePartial({ action: 'queued' }))
    const events = useEventQueue.getState().events
    expect(events).toHaveLength(1)
    expect(events[0]?.action).toBe('queued')
  })

  it('preserves all fields from partial', () => {
    const evt = emit(makePartial({
      actor: 'stripe',
      phase: 'webhook',
      source: 'Stripe',
      action: 'payment_intent.succeeded',
      complianceStates: ['pci'],
      simulationLevel: 'simulated',
    }))
    expect(evt.actor).toBe('stripe')
    expect(evt.phase).toBe('webhook')
    expect(evt.complianceStates).toEqual(['pci'])
  })
})
