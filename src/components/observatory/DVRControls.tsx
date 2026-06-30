"use client"
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'
import type { PlaybackSpeed } from '@/engine/types'

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2]

export function DVRControls() {
  const { isPlaying, isFrozen, speed, cursor, play, pause, freeze, unfreeze, stepForward, stepBack, jumpToStart, jumpToEnd, setSpeed } = useDVR()
  const { events } = useEventQueue()
  const total = events.length

  return (
    <div className="flex shrink-0 items-center gap-2 border-t border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <button onClick={jumpToStart} title="Jump to start" className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" disabled={cursor <= 0}>◀◀</button>
      <button onClick={stepBack} title="Step back" className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" disabled={cursor <= 0}>◀</button>
      <button
        onClick={isPlaying ? pause : play}
        title={isPlaying ? 'Pause' : 'Play'}
        className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <button onClick={stepForward} title="Step forward" className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" disabled={cursor >= total - 1}>▶</button>
      <button onClick={jumpToEnd} title="Jump to end" className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" disabled={cursor >= total - 1}>▶▶</button>

      <span className="mx-1 font-mono text-xs text-zinc-400">
        {total === 0 ? '— / —' : `${cursor + 1} / ${total}`}
      </span>

      <div className="ml-auto flex items-center gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`rounded px-1.5 py-0.5 font-mono text-xs ${speed === s ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            {s}x
          </button>
        ))}
        <button
          onClick={isFrozen ? unfreeze : freeze}
          className={`ml-1 rounded px-2 py-0.5 font-mono text-xs ${isFrozen ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          {isFrozen ? '🔒 frozen' : 'freeze'}
        </button>
      </div>
    </div>
  )
}
