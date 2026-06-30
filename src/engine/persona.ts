"use client"
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Persona } from './types'

export const PERSONAS: Record<string, Persona> = {
  alex: {
    id: 'alex',
    name: 'Alex',
    role: 'buyer',
    kycState: 'not_required',
    connectState: 'none',
  },
  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'seller',
    kycState: 'verified',
    connectState: 'active',
    connectType: 'express',
  },
  jordan: {
    id: 'jordan',
    name: 'Jordan',
    role: 'seller',
    kycState: 'pending',
    connectState: 'onboarding',
    connectType: 'express',
  },
  sam: {
    id: 'sam',
    name: 'Sam',
    role: 'freelancer',
    kycState: 'verified',
    connectState: 'active',
    connectType: 'custom',
  },
  dana: {
    id: 'dana',
    name: 'Dana',
    role: 'enterprise',
    kycState: 'not_required',
    connectState: 'none',
    useSso: true,
  },
  billy: {
    id: 'billy',
    name: 'Billy',
    role: 'platform_admin',
    kycState: 'not_required',
    connectState: 'active',
    connectType: 'platform',
  },
}

interface PersonaState {
  active: Persona
  swap: (id: string) => void
}

export const usePersona = create<PersonaState>()(
  immer((set) => ({
    active: PERSONAS['alex']!,
    swap: (id) =>
      set((state) => {
        const p = PERSONAS[id]
        if (p) state.active = p
      }),
  }))
)
