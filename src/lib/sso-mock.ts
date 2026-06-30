export interface OidcClaims {
  sub: string
  email: string
  name: string
  picture: string
  hd: string  // hosted domain (Google Workspace)
  iss: string
  aud: string
  iat: number
  exp: number
}

export function buildMockOidcClaims(personaId: string): OidcClaims {
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

export function buildMockAuthCode(): string {
  return `mock_auth_code_${Math.random().toString(36).slice(2)}`
}
