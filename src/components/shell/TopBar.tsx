"use client"
import Link from 'next/link'
import { PersonaBadge } from './PersonaBadge'
import { PersonaSwitcher } from '@/components/persona/PersonaSwitcher'
import { SsoSimulationButton } from '@/components/persona/SsoSimulationButton'

const BUSINESSES = [
  { id: 'stripeland', label: 'Stripeland', href: '/stripeland' },
  { id: 'stackd', label: 'Stackd', href: '/stackd' },
  { id: 'flowlance', label: 'Flowlance', href: '/flowlance' },
]

export function TopBar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <Link href="/" className="font-mono text-sm font-bold text-indigo-600">
        ◆ Stripe Demo
      </Link>
      <nav className="flex gap-2">
        {BUSINESSES.map((b) => (
          <Link
            key={b.id}
            href={b.href}
            className="rounded px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {b.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <PersonaSwitcher />
        <SsoSimulationButton />
        <PersonaBadge />
        <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-xs text-amber-700">
          TEST MODE
        </span>
      </div>
    </header>
  )
}
