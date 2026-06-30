import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { setPersonaCookie } from '@/lib/fake-auth'

export async function POST(request: NextRequest) {
  const body = await request.json() as { personaId?: string }
  const personaId = body.personaId ?? 'alex'
  await setPersonaCookie(personaId)
  return NextResponse.json({ ok: true, personaId })
}
