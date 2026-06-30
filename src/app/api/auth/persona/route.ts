import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

const COOKIE_NAME = 'stripe_demo_persona'

export async function POST(request: NextRequest) {
  const body = await request.json() as { personaId?: string }
  const personaId = body.personaId ?? 'alex'
  const store = await cookies()
  store.set(COOKIE_NAME, personaId, { httpOnly: true, sameSite: 'lax', path: '/' })
  return NextResponse.json({ ok: true, personaId })
}
