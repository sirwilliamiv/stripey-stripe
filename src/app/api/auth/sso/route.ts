import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { buildMockOidcClaims, buildMockAuthCode } from '@/lib/sso-mock'

const COOKIE_NAME = 'stripe_demo_persona'

async function setPersonaCookie(id: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, id, { httpOnly: true, sameSite: 'lax', path: '/' })
}

// GET /api/auth/sso?action=initiate&persona=dana
// GET /api/auth/sso?action=callback&code=...
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const action = searchParams.get('action')

  if (action === 'initiate') {
    const personaId = searchParams.get('persona') ?? 'dana'
    const code = buildMockAuthCode()
    // Simulate redirect to IdP and back
    const callbackUrl = new URL('/api/auth/sso', request.url)
    callbackUrl.searchParams.set('action', 'callback')
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('persona', personaId)
    // In a real app, this would redirect to accounts.google.com
    return NextResponse.redirect(callbackUrl)
  }

  if (action === 'callback') {
    const personaId = searchParams.get('persona') ?? 'dana'
    const claims = buildMockOidcClaims(personaId)
    await setPersonaCookie(personaId)
    const response = NextResponse.redirect(new URL('/', request.url))
    // Expose claims in a readable header for Observatory
    response.headers.set('x-oidc-claims', JSON.stringify(claims))
    return response
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
