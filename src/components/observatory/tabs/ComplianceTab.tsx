"use client"
import { useDVR } from '@/engine/dvr'
import { deriveComplianceResult } from '@/engine/compliance'

export function ComplianceTab() {
  const currentEvent = useDVR((s) => s.currentEvent)
  const states = currentEvent?.complianceStates ?? ['idle']
  const result = deriveComplianceResult(states)

  return (
    <div className="space-y-3 p-3 font-mono text-xs">
      {result.active.length > 1 && (
        <p className="font-semibold" style={{ color: result.color }}>{result.label}</p>
      )}
      {result.metas.map((meta) => (
        <div key={meta.state} className="rounded border p-3" style={{ borderColor: meta.color }}>
          <p className="font-bold" style={{ color: meta.color }}>{meta.label}</p>
          <p className="mt-1 text-zinc-500">{meta.regulation}</p>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{meta.explanation}</p>
          {meta.saqNote && (
            <p className="mt-2 rounded bg-orange-50 p-2 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              SAQ: {meta.saqNote}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
