"use client"
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'
import { motion, AnimatePresence } from 'framer-motion'

export function WebhooksTab() {
  const events = useEventQueue((s) => s.events)
  const cursor = useDVR((s) => s.cursor)
  const currentEvent = useDVR((s) => s.currentEvent)

  const webhookEvents = events
    .slice(0, cursor + 1)
    .filter((e) => e.phase === 'webhook')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
        <AnimatePresence initial={false}>
          {webhookEvents.map((evt) => (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={`rounded-lg border p-3 ${
                currentEvent?.id === evt.id
                  ? 'border-orange-500 bg-orange-950/20'
                  : 'border-zinc-800 bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-orange-400 font-semibold">{evt.action}</span>
                <span className="text-zinc-500 text-xs">{new Date(evt.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className="text-zinc-500">
                from <span className="text-zinc-400">{evt.source}</span>
                {evt.stripeObject && <span className="ml-2 text-blue-400">· {evt.stripeObject}</span>}
              </div>
              {evt.response !== undefined && (
                <pre className="mt-2 overflow-auto text-zinc-400 text-xs whitespace-pre-wrap">
                  {JSON.stringify(evt.response, null, 2)}
                </pre>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {webhookEvents.length === 0 && (
          <div className="text-zinc-600 text-center mt-8">No webhook events yet</div>
        )}
      </div>
    </div>
  )
}
