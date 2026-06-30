"use client"
import { PersonaSwitcher } from './PersonaSwitcher'
import { SsoSimulationButton } from './SsoSimulationButton'
import { PersonaBadge } from './PersonaBadge'

export function TopBar() {
  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-zinc-950 h-12 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-violet-400 font-bold text-lg tracking-tight">Stripey</span>
        <span className="text-zinc-600 text-sm">· Stripe Learning Observatory</span>
      </div>
      <div className="flex items-center gap-3">
        <PersonaSwitcher />
        <SsoSimulationButton />
        <PersonaBadge />
      </div>
    </header>
  )
}
