"use client"
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PlaybackSpeed, SimEvent } from './types'
import { useEventQueue } from './event-queue'

interface DVRState {
  cursor: number
  currentEvent: SimEvent | undefined
  isPlaying: boolean
  isFrozen: boolean
  speed: PlaybackSpeed
  stepDelayMs: number
  play: () => void
  pause: () => void
  freeze: () => void
  unfreeze: () => void
  setSpeed: (speed: PlaybackSpeed) => void
  stepForward: () => void
  stepBack: () => void
  jumpToStart: () => void
  jumpToEnd: () => void
}

export const useDVR = create<DVRState>()(
  immer((set, get) => ({
    cursor: -1,
    currentEvent: undefined,
    isPlaying: false,
    isFrozen: false,
    speed: 1,
    stepDelayMs: 3000,

    play: () => set((s) => { s.isPlaying = true; s.isFrozen = false }),
    pause: () => set((s) => { s.isPlaying = false }),
    freeze: () => set((s) => { s.isFrozen = true; s.isPlaying = false }),
    unfreeze: () => set((s) => { s.isFrozen = false }),
    setSpeed: (speed) => set((s) => {
      s.speed = speed
      s.stepDelayMs = Math.round(3000 / speed)
    }),

    stepForward: () => {
      const events = useEventQueue.getState().events
      const { cursor } = get()
      const next = Math.min(cursor + 1, events.length - 1)
      const nextEvent = events[next]
      if (nextEvent !== undefined) {
        set((s) => { s.cursor = next; s.currentEvent = nextEvent })
      }
    },
    stepBack: () => {
      const events = useEventQueue.getState().events
      const { cursor } = get()
      const prev = Math.max(cursor - 1, 0)
      const prevEvent = events[prev]
      if (prevEvent !== undefined) {
        set((s) => { s.cursor = prev; s.currentEvent = prevEvent })
      }
    },
    jumpToStart: () => {
      const events = useEventQueue.getState().events
      const first = events[0]
      if (first !== undefined) set((s) => { s.cursor = 0; s.currentEvent = first })
    },
    jumpToEnd: () => {
      const events = useEventQueue.getState().events
      if (events.length > 0) {
        const last = events.length - 1
        const lastEvent = events[last]
        if (lastEvent !== undefined) set((s) => { s.cursor = last; s.currentEvent = lastEvent })
      }
    },
  }))
)

// Queue → DVR subscription. One-way. Queue never imports DVR.
useEventQueue.subscribe((state, prevState) => {
  const events = state.events

  if (events.length === 0 && prevState.events.length > 0) {
    useDVR.setState({ cursor: -1, currentEvent: undefined })
    return
  }

  if (events.length > prevState.events.length) {
    const { cursor, isPlaying, isFrozen } = useDVR.getState()

    if (cursor === -1) {
      const first = events[0]
      if (first !== undefined) useDVR.setState({ cursor: 0, currentEvent: first })
    } else if (isPlaying && !isFrozen) {
      const last = events.length - 1
      const lastEvent = events[last]
      if (lastEvent !== undefined) useDVR.setState({ cursor: last, currentEvent: lastEvent })
    }
  }
})
