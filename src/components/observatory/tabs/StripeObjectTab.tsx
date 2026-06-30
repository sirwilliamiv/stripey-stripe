"use client"
import { useDVR } from '@/engine/dvr'
import { getExampleByType } from '@/engine/stripe-objects/examples'

export function StripeObjectTab() {
  const currentEvent = useDVR((s) => s.currentEvent)
  const objectType = currentEvent?.stripeObject
  const example = objectType ? getExampleByType(objectType) : undefined

  if (!objectType) {
    return (
      <div className="p-4 text-zinc-600 text-sm text-center mt-8">
        No Stripe object associated with this event
      </div>
    )
  }

  if (!example) {
    return (
      <div className="p-4 text-zinc-500 text-sm">
        <span className="text-blue-400 font-mono">{objectType}</span> — no example available
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-blue-400 font-semibold font-mono">{example.objectType}</span>
        <span className="text-zinc-500 font-mono">{example.id}</span>
      </div>

      <details open>
        <summary className="cursor-pointer text-zinc-400 hover:text-zinc-200 font-medium mb-2">Example JSON</summary>
        <pre className="mt-2 overflow-auto text-blue-300 font-mono text-xs whitespace-pre-wrap rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
          {JSON.stringify(example.data, null, 2)}
        </pre>
      </details>

      <div>
        <p className="font-medium text-zinc-400 mb-2">Relationships</p>
        <div className="space-y-1">
          {example.relationships.map((rel, i) => (
            <div key={i} className="flex gap-2 text-zinc-400">
              <span className="text-green-400 font-mono">{rel.field}</span>
              <span className="text-zinc-600">→</span>
              <span className="text-blue-400">{rel.objectType}</span>
              <span className="text-zinc-600">— {rel.description}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="font-medium text-zinc-400 mb-2">Webhook events</p>
        <div className="flex flex-wrap gap-1">
          {example.webhookEvents.map((evt) => (
            <span key={evt} className="px-2 py-0.5 rounded text-orange-400 bg-orange-950/30 border border-orange-900/50 font-mono">
              {evt}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
