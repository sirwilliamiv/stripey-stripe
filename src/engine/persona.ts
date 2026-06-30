import type { Persona } from './types'

export const PERSONAS: Persona[] = [
  {
    id: 'alice',
    name: 'Alice Buyer',
    role: 'buyer',
    kycState: 'not_required',
    connectState: 'none',
    useSso: false,
  },
  {
    id: 'bob',
    name: 'Bob Seller',
    role: 'seller',
    kycState: 'verified',
    connectState: 'active',
    connectType: 'express',
    useSso: false,
  },
  {
    id: 'cara',
    name: 'Cara Freelancer',
    role: 'freelancer',
    kycState: 'pending',
    connectState: 'onboarding',
    connectType: 'custom',
    useSso: false,
  },
  {
    id: 'dan',
    name: 'Dan Enterprise',
    role: 'enterprise',
    kycState: 'verified',
    connectState: 'active',
    connectType: 'platform',
    useSso: true,
  },
  {
    id: 'eva',
    name: 'Eva Admin',
    role: 'platform_admin',
    kycState: 'verified',
    connectState: 'active',
    connectType: 'platform',
    useSso: true,
  },
  {
    id: 'frank',
    name: 'Frank Developer',
    role: 'platform_admin',
    kycState: 'not_required',
    connectState: 'none',
    useSso: false,
  },
]

export function getPersonaById(id: string): Persona | undefined {
  return PERSONAS.find((p) => p.id === id)
}

export function getDefaultPersona(): Persona {
  const first = PERSONAS[0]
  if (!first) throw new Error('No personas defined')
  return first
}
