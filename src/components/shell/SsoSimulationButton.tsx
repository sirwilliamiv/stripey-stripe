"use client"
import { useFakeAuth } from '@/lib/fake-auth'

export function SsoSimulationButton() {
  const persona = useFakeAuth((s) => s.persona)

  if (!persona.useSso) return null

  return (
    <span className="px-3 py-1 rounded text-sm font-medium bg-blue-900 text-blue-200">
      SSO: Enterprise
    </span>
  )
}
