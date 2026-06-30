"use client"
import { useDVR } from '@/engine/dvr'
import { deriveComplianceResult, COMPLIANCE_CONFIG } from '@/engine/compliance'
import { motion } from 'framer-motion'

export function ComplianceTab() {
  const currentEvent = useDVR((s) => s.currentEvent)
  const states = currentEvent?.complianceStates ?? []
  const result = deriveComplianceResult(states)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <motion.div
          className="w-4 h-4 rounded-full"
          animate={{ backgroundColor: result.color }}
          transition={{ duration: 0.4 }}
        />
        <span className="text-lg font-semibold text-zinc-100">{result.label}</span>
      </div>

      <div className="space-y-3">
        {result.metas.map((meta) => (
          <div
            key={meta.state}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3"
            style={{ borderLeftColor: meta.color, borderLeftWidth: 3 }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-zinc-100 text-sm">{meta.label}</span>
              <span className="text-xs text-zinc-500 px-2 py-0.5 rounded-full bg-zinc-800">{meta.regulation}</span>
            </div>
            <p className="text-xs text-zinc-400">{meta.explanation}</p>
            {meta.saqNote && (
              <p className="mt-1 text-xs text-orange-400 font-medium">{meta.saqNote}</p>
            )}
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-800 pt-3">
        <p className="text-xs text-zinc-600 font-medium mb-2">All states</p>
        <div className="flex flex-wrap gap-2">
          {Object.values(COMPLIANCE_CONFIG).map((cfg) => (
            <span
              key={cfg.state}
              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                result.active.includes(cfg.state)
                  ? 'opacity-100'
                  : 'opacity-20'
              }`}
              style={{ backgroundColor: cfg.color + '22', color: cfg.color, border: `1px solid ${cfg.color}44` }}
            >
              {cfg.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
