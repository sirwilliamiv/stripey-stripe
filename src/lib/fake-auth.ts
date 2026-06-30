import { cookies } from 'next/headers'
import { PERSONAS } from '@/engine/persona'
import type { Persona } from '@/engine/types'

const COOKIE_NAME = 'stripe_demo_persona'

export async function getPersonaFromCookie(): Promise<Persona> {
  const store = await cookies()
  const id = store.get(COOKIE_NAME)?.value ?? 'alex'
  return PERSONAS[id] ?? PERSONAS['alex']!
}

export async function setPersonaCookie(id: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, id, { httpOnly: true, sameSite: 'lax', path: '/' })
}
