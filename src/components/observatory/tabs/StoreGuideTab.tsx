"use client"
import { useDVR } from '@/engine/dvr'

export function StoreGuideTab() {
  const currentEvent = useDVR((s) => s.currentEvent)
  const guide = currentEvent?.storeGuidance

  if (!guide) {
    return (
      <div className="p-4 text-zinc-600 text-sm text-center mt-8">
        No store guidance for current event.
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 text-sm">
      <Section
        title="Store in your DB"
        color="text-green-400"
        items={guide.store}
        icon="✓"
      />
      <Section
        title="Never store"
        color="text-red-400"
        items={guide.neverStore}
        icon="✗"
      />
      <Section
        title="Source of truth"
        color="text-blue-400"
        items={guide.sourceOfTruth}
        icon="★"
      />
      <Section
        title="Listen for webhooks"
        color="text-orange-400"
        items={guide.listenFor}
        icon="⚡"
      />
    </div>
  )
}

function Section({
  title,
  color,
  items,
  icon,
}: {
  title: string
  color: string
  items: string[]
  icon: string
}) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
      <p className={`font-medium mb-2 ${color}`}>{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-zinc-300 text-xs">
            <span className={`${color} shrink-0`}>{icon}</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
