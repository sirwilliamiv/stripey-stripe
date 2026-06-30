"use client"
import { useState } from 'react'
import { STRIPE_OBJECT_EXAMPLES } from '@/engine/stripe-objects/examples'

export function ObjectExplorerTab() {
  const [selected, setSelected] = useState<string | null>(null)
  const obj = STRIPE_OBJECT_EXAMPLES.find((e) => e.objectType === selected)

  return (
    <div className="flex h-full flex-col font-mono text-xs">
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800">
        {STRIPE_OBJECT_EXAMPLES.map((e) => (
          <button
            key={e.objectType}
            onClick={() => setSelected(e.objectType)}
            className={`rounded px-2 py-0.5 ${selected === e.objectType ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
          >
            {e.objectType}
          </button>
        ))}
      </div>
      {obj ? (
        <div className="flex-1 overflow-y-auto space-y-3 p-3">
          <div>
            <p className="font-bold text-zinc-700 dark:text-zinc-300">{obj.objectType} <span className="text-zinc-400">{obj.id}</span></p>
            <pre className="mt-2 overflow-x-auto rounded bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {JSON.stringify(obj.data, null, 2)}
            </pre>
          </div>
          <div>
            <p className="font-bold text-zinc-500">Relationships</p>
            {obj.relationships.map((r) => (
              <p key={r.field} className="ml-2 text-zinc-500">• <span className="text-zinc-700 dark:text-zinc-300">{r.field}</span> → {r.objectType}: {r.description}</p>
            ))}
          </div>
          <div>
            <p className="font-bold text-amber-600">Webhook Events</p>
            {obj.webhookEvents.map((e) => <p key={e} className="ml-2 text-zinc-500">• {e}</p>)}
          </div>
          <div>
            <p className="font-bold text-green-600">✅ Store: {obj.storeGuidance.store.join(', ')}</p>
            <p className="font-bold text-red-600">❌ Never: {obj.storeGuidance.neverStore.join(', ')}</p>
            <p className="font-bold text-amber-600">🎣 Listen: {obj.storeGuidance.listenFor.join('; ')}</p>
          </div>
        </div>
      ) : (
        <div className="p-3 text-zinc-400">Select an object above to inspect it.</div>
      )}
    </div>
  )
}
