"use client"
import { useFakeAuth } from '@/lib/fake-auth'
import { PERSONAS } from '@/engine/persona'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

export function PersonaSwitcher() {
  const { persona, setPersona } = useFakeAuth()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="px-3 py-1 rounded bg-zinc-700 text-sm text-zinc-100 hover:bg-zinc-600 transition-colors">
          Switch Persona
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-48 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl z-50"
          sideOffset={4}
        >
          {PERSONAS.map((p) => (
            <DropdownMenu.Item
              key={p.id}
              onSelect={() => setPersona(p.id)}
              className={`flex flex-col px-3 py-2 rounded cursor-pointer outline-none text-sm transition-colors ${
                persona.id === p.id
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-zinc-500 text-xs capitalize">{p.role.replace('_', ' ')}</span>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
