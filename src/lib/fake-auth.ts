"use client"
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Persona } from '@/engine/types'
import { getDefaultPersona, getPersonaById } from '@/engine/persona'

interface FakeAuthState {
  persona: Persona
  setPersona: (id: string) => void
}

export const useFakeAuth = create<FakeAuthState>()(
  immer((set) => ({
    persona: getDefaultPersona(),
    setPersona: (id) =>
      set((s) => {
        const found = getPersonaById(id)
        if (found) s.persona = found
      }),
  }))
)
