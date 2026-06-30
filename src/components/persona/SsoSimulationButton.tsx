"use client"
import { emit } from '@/engine/event-emitter'
import { usePersona } from '@/engine/persona'

export function SsoSimulationButton() {
  const { active, swap } = usePersona()
  if (!active.useSso) return null

  const simulate = async () => {
    emit({
      flowId: 'sso-flow', stepId: 'sso-01',
      actor: 'user', phase: 'user_action',
      source: 'topbar/sso', action: 'User clicks "Sign in with Google"',
      complianceStates: ['pii'], simulationLevel: 'simulated',
      certTips: ['SSO tells YOUR app who the user is. It does not verify identity for Stripe.'],
    })
    emit({
      flowId: 'sso-flow', stepId: 'sso-02',
      actor: 'idp', phase: 'client_call',
      source: 'google-oauth', action: 'Redirect to accounts.google.com/oauth/authorize',
      complianceStates: ['pii'], simulationLevel: 'simulated',
      certTips: ['User is redirected to the Identity Provider (Google). Your app sees nothing until callback.'],
    })
    emit({
      flowId: 'sso-flow', stepId: 'sso-03',
      actor: 'idp', phase: 'server_call',
      source: 'google-oauth', action: 'Authorization code returned to callback URL',
      complianceStates: ['pii'], simulationLevel: 'simulated',
      request: { code: 'mock_auth_code_abc123', state: 'csrf_token' },
    })
    emit({
      flowId: 'sso-flow', stepId: 'sso-04',
      actor: 'app', phase: 'server_call',
      source: 'api/auth/sso/callback', action: 'Exchange auth code for OIDC token',
      complianceStates: ['pii'], simulationLevel: 'simulated',
      request: { code: 'mock_auth_code_abc123' },
      response: { sub: 'google-sub-dan', email: 'dan@enterprise.example.com', hd: 'enterprise.example.com' },
      certTips: ['The OIDC token proves who Dan is to YOUR app. Stripe Identity separately verifies Dan for regulated operations.'],
    })
    emit({
      flowId: 'sso-flow', stepId: 'sso-05',
      actor: 'app', phase: 'db_write',
      source: 'api/auth/sso/callback', action: 'App session created — persona set to Dan',
      complianceStates: ['idle'], simulationLevel: 'simulated',
      certTips: ['[YOUR APP] owns this session. [STRIPE] owns KYC verification. These are independent systems.'],
    })
    swap('dan')
    await fetch('/api/auth/persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: 'dan' }),
    })
  }

  return (
    <button
      onClick={simulate}
      className="rounded border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
    >
      Simulate SSO Login (Enterprise)
    </button>
  )
}
