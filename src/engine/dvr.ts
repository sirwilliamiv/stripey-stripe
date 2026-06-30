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
      set((s) => { s.cursor = next; s.currentEvent = events[next] })
    },
    stepBack: () => {
      const events = useEventQueue.getState().events
      const { cursor } = get()
      const prev = Math.max(cursor - 1, 0)
      set((s) => { s.cursor = prev; s.currentEvent = events[prev] })
    },
    jumpToStart: () => {
      const events = useEventQueue.getState().events
      if (events.length > 0) set((s) => { s.cursor = 0; s.currentEvent = events[0] })
    },
    jumpToEnd: () => {
      const events = useEventQueue.getState().events
      if (events.length > 0) {
        const last = events.length - 1
        set((s) => { s.cursor = last; s.currentEvent = events[last] })
      }
    },
  }))
)

// Subscribe to queue — DVR decides cursor movement.
// Queue never imports DVR. One-way dependency.
useEventQueue.subscribe((state, prevState) => {
  const events = state.events

  if (events.length === 0 && prevState.events.length > 0) {
    // Queue cleared
    useDVR.setState({ cursor: -1, currentEvent: undefined })
    return
  }

  if (events.length > prevState.events.length) {
    // New event enqueued
    const { cursor, isPlaying, isFrozen } = useDVR.getState()

    if (cursor === -1) {
      // First event ever — always show it regardless of play state
      useDVR.setState({ cursor: 0, currentEvent: events[0] })
    } else if (isPlaying && !isFrozen) {
      // Playing: advance to newest
      const last = events.length - 1
      useDVR.setState({ cursor: last, currentEvent: events[last] })
    }
    // Paused or frozen: hold cursor, user steps manually
  }
})
