import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { setPersonaCookie } from '@/lib/fake-auth'

interface OidcClaims {
  sub: string
  email: string
  name: string
  picture: string
  hd: string
  iss: string
  aud: string
  iat: number
  exp: number
}

function buildMockOidcClaims(personaId: string): OidcClaims {
  return {
    sub: `google-sub-${personaId}-12345`,
    email: `${personaId}@enterprise.example.com`,
    name: personaId === 'dana' ? 'Dana (Enterprise)' : personaId,
    picture: `https://ui-avatars.com/api/?name=${personaId}`,
    hd: 'enterprise.example.com',
    iss: 'https://accounts.google.com',
    aud: 'stripe-demo-app.example.com',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
}

// GET /api/auth/sso?action=initiate&persona=dana
// GET /api/auth/sso?action=callback&code=...
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const action = searchParams.get('action')

  if (action === 'initiate') {
    const personaId = searchParams.get('persona') ?? 'dana'
    const code = `mock_auth_code_${Math.random().toString(36).slice(2)}`
    const callbackUrl = new URL('/api/auth/sso', request.url)
    callbackUrl.searchParams.set('action', 'callback')
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('persona', personaId)
    return NextResponse.redirect(callbackUrl)
  }

  if (action === 'callback') {
    const personaId = searchParams.get('persona') ?? 'dana'
    const claims = buildMockOidcClaims(personaId)
    await setPersonaCookie(personaId)
    const response = NextResponse.redirect(new URL('/', request.url))
    response.headers.set('x-oidc-claims', JSON.stringify(claims))
    return response
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
