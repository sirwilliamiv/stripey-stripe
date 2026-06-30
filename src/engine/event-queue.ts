"use client"
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { SimEvent } from './types'

interface EventQueueState {
  events: SimEvent[]
  enqueue: (event: SimEvent) => void
  clear: () => void
}

export const useEventQueue = create<EventQueueState>()(
  immer((set) => ({
    events: [],

    enqueue: (event) =>
      set((state) => {
        state.events.push(event)
      }),

    clear: () =>
      set((state) => {
        state.events = []
      }),
  }))
)
