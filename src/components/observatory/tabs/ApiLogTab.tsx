"use client"
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'
import { redactSensitiveFields } from '@/engine/redaction'
import { motion, AnimatePresence } from 'framer-motion'

export function ApiLogTab() {
  const events = useEventQueue((s) => s.events)
  const cursor = useDVR((s) => s.cursor)
  const currentEvent = useDVR((s) => s.currentEvent)

  const visibleEvents = events.slice(0, cursor + 1)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        <AnimatePresence initial={false}>
          {visibleEvents.map((evt, i) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-lg border p-3 ${
                currentEvent?.id === evt.id
                  ? 'border-violet-600 bg-violet-950/30'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-violet-400 font-semibold">{evt.action}</span>
                <span className="text-zinc-500">{evt.phase}</span>
              </div>
              <div className="text-zinc-500 mb-1">
                <span className="text-zinc-400">{evt.source}</span>
                {evt.stripeObject && (
                  <span className="ml-2 text-blue-400">· {evt.stripeObject}</span>
                )}
              </div>
              {evt.request !== undefined && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-zinc-500 hover:text-zinc-300">Request</summary>
                  <pre className="mt-1 overflow-auto text-green-400 text-xs whitespace-pre-wrap">
                    {JSON.stringify(redactSensitiveFields(evt.request), null, 2)}
                  </pre>
                </details>
              )}
              {evt.response !== undefined && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-zinc-500 hover:text-zinc-300">Response</summary>
                  <pre className="mt-1 overflow-auto text-blue-300 text-xs whitespace-pre-wrap">
                    {JSON.stringify(redactSensitiveFields(evt.response), null, 2)}
                  </pre>
                </details>
              )}
              {evt.isFailureMode && (
                <div className="mt-2 text-orange-400 font-medium">⚠ Failure Mode: {evt.failureModeType}</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {visibleEvents.length === 0 && (
          <div className="text-zinc-600 text-center mt-8">Run a flow to see API calls</div>
        )}
      </div>
    </div>
  )
}
