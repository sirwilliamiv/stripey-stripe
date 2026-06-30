"use client"
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'

export function CertTipsTab() {
  const cursor = useDVR((s) => s.cursor)
  const currentEvent = useDVR((s) => s.currentEvent)
  const events = useEventQueue((s) => s.events)

  const allTips = events
    .slice(0, cursor + 1)
    .flatMap((e) => e.certTips ?? [])
    .filter((tip, i, arr) => arr.indexOf(tip) === i)

  const currentTips = currentEvent?.certTips ?? []

  return (
    <div className="p-4 space-y-4">
      {currentTips.length > 0 && (
        <div>
          <p className="text-xs font-medium text-violet-400 mb-2">Current event tips</p>
          <ul className="space-y-2">
            {currentTips.map((tip, i) => (
              <li key={i} className="flex gap-2 rounded-lg border border-violet-900/50 bg-violet-950/20 p-3 text-xs text-violet-200">
                <span className="text-violet-400 shrink-0">★</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {allTips.length > 0 && (
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-2">All tips seen so far</p>
          <ul className="space-y-1">
            {allTips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-xs text-zinc-400">
                <span className="text-zinc-600 shrink-0">·</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {allTips.length === 0 && (
        <div className="text-zinc-600 text-sm text-center mt-8">
          Cert tips will appear as you step through events
        </div>
      )}
    </div>
  )
}
