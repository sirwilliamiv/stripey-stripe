"use client"
import { useFakeAuth } from '@/lib/fake-auth'
import { useSsoMock, SSO_PROVIDERS } from '@/lib/sso-mock'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export function SsoSimulationButton() {
  const persona = useFakeAuth((s) => s.persona)
  const { active, provider, simulateSso, clearSso } = useSsoMock()

  if (!persona.useSso) return null

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            active
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
          }`}
        >
          {active ? `SSO: ${provider}` : 'Simulate SSO'}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-40 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl z-50"
          sideOffset={4}
        >
          {SSO_PROVIDERS.map((p) => (
            <DropdownMenu.Item
              key={p}
              onSelect={() => simulateSso(p)}
              className={`px-3 py-2 rounded cursor-pointer outline-none text-sm transition-colors ${
                active && provider === p
                  ? 'bg-blue-800 text-blue-100'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {p}
            </DropdownMenu.Item>
          ))}
          {active && (
            <>
              <DropdownMenu.Separator className="my-1 border-t border-zinc-700" />
              <DropdownMenu.Item
                onSelect={clearSso}
                className="px-3 py-2 rounded cursor-pointer outline-none text-sm text-red-400 hover:bg-zinc-800"
              >
                Clear SSO
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
