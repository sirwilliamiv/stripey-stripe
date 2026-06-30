import { useEventQueue } from './event-queue'
import type { SimEvent } from './types'

let counter = 0

export function emit(partial: Omit<SimEvent, 'id' | 'timestamp'>): SimEvent {
  counter += 1
  const event: SimEvent = {
    ...partial,
    id: `evt_${Date.now()}_${counter}`,
    timestamp: new Date().toISOString(),
  }
  useEventQueue.getState().enqueue(event)
  return event
}
