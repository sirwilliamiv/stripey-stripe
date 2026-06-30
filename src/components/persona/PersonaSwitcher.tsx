"use client"
import { usePersona, PERSONAS } from '@/engine/persona'

export function PersonaSwitcher() {
  const { active, swap } = usePersona()

  const handleSwap = async (id: string) => {
    swap(id)
    await fetch('/api/auth/persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: id }),
    })
  }

  return (
    <select
      value={active.id}
      onChange={(e) => handleSwap(e.target.value)}
      className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      {Object.values(PERSONAS).map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} ({p.role})
        </option>
      ))}
    </select>
  )
}
