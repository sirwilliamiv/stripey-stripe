"use client"
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'
import type { PlaybackSpeed } from '@/engine/types'

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 2]

export function DVRControls() {
  const { cursor, isPlaying, isFrozen, speed, play, pause, freeze, unfreeze, stepForward, stepBack, jumpToStart, jumpToEnd, setSpeed } =
    useDVR()
  const total = useEventQueue((s) => s.events.length)

  const position = total === 0 ? '—' : `${cursor + 1}/${total}`

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-t border-zinc-800 bg-zinc-950 text-xs text-zinc-400 select-none">
      <button
        title="Jump to start"
        onClick={jumpToStart}
        disabled={total === 0}
        className="px-2 py-1 rounded hover:bg-zinc-800 disabled:opacity-30 transition-colors"
      >
        ⏮
      </button>
      <button
        title="Step back"
        onClick={stepBack}
        disabled={cursor <= 0}
        className="px-2 py-1 rounded hover:bg-zinc-800 disabled:opacity-30 transition-colors"
      >
        ⏪
      </button>
      {isPlaying && !isFrozen ? (
        <button
          title="Pause"
          onClick={pause}
          className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-100 transition-colors"
        >
          ⏸
        </button>
      ) : (
        <button
          title="Play"
          onClick={play}
          disabled={total === 0}
          className="px-2 py-1 rounded bg-violet-700 hover:bg-violet-600 text-white disabled:opacity-30 transition-colors"
        >
          ▶
        </button>
      )}
      <button
        title="Step forward"
        onClick={stepForward}
        disabled={cursor >= total - 1}
        className="px-2 py-1 rounded hover:bg-zinc-800 disabled:opacity-30 transition-colors"
      >
        ⏩
      </button>
      <button
        title="Jump to end"
        onClick={jumpToEnd}
        disabled={total === 0}
        className="px-2 py-1 rounded hover:bg-zinc-800 disabled:opacity-30 transition-colors"
      >
        ⏭
      </button>

      <span className="ml-2 tabular-nums text-zinc-500">{position}</span>

      <div className="ml-auto flex items-center gap-1">
        <span className="text-zinc-600">Speed:</span>
        {SPEED_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`px-2 py-0.5 rounded transition-colors ${
              speed === s ? 'bg-violet-700 text-white' : 'hover:bg-zinc-800 text-zinc-400'
            }`}
          >
            {s}×
          </button>
        ))}
        <button
          onClick={isFrozen ? unfreeze : freeze}
          className={`ml-1 px-2 py-0.5 rounded transition-colors ${
            isFrozen ? 'bg-amber-900 text-amber-300' : 'hover:bg-zinc-800 text-zinc-400'
          }`}
        >
          {isFrozen ? '🔒 frozen' : 'freeze'}
        </button>
      </div>
    </div>
  )
}
