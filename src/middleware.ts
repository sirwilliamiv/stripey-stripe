import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PERSONAS } from '@/engine/persona'
import { canAccess } from '@/engine/rbac'

export function middleware(request: NextRequest) {
  const personaId = request.cookies.get('stripe_demo_persona')?.value ?? 'alex'
  const persona = PERSONAS[personaId] ?? PERSONAS['alex']!
  const { pathname } = request.nextUrl

  if (!canAccess(persona.role, pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('rbac_blocked', '1')
    url.searchParams.set('required_role', 'see_observatory')
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  response.headers.set('x-persona-id', persona.id)
  response.headers.set('x-persona-role', persona.role)
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
