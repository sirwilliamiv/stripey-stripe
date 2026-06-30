import type { ComplianceState } from './types'

export interface ComplianceMeta {
  state: ComplianceState
  label: string
  color: string
  regulation: string
  explanation: string
  saqNote?: string
}

export interface ComplianceResult {
  primary: ComplianceState
  color: string
  active: ComplianceState[]
  label: string
  metas: ComplianceMeta[]
}

const PRIORITY: ComplianceState[] = ['idle', 'pii', 'kyc_aml', 'crypto', 'banking', 'pci']

export const COMPLIANCE_CONFIG: Record<ComplianceState, ComplianceMeta> = {
  idle: {
    state: 'idle',
    label: 'Safe / Idle',
    color: '#22C55E',
    regulation: '—',
    explanation: 'No sensitive data in flight. Your app is not handling regulated data right now.',
  },
  pii: {
    state: 'pii',
    label: 'PII In Flight',
    color: '#EAB308',
    regulation: 'GDPR / CCPA',
    explanation: 'Personally identifiable information (name, email, address) is being collected or transmitted.',
  },
  pci: {
    state: 'pci',
    label: 'PCI Scope',
    color: '#F97316',
    regulation: 'PCI-DSS SAQ A',
    explanation: 'Card data is in scope. Stripe Elements iframes isolate card fields so PANs never reach your server.',
    saqNote: 'SAQ A applies because Stripe.js handles the card field in an iframe.',
  },
  kyc_aml: {
    state: 'kyc_aml',
    label: 'KYC / AML',
    color: '#3B82F6',
    regulation: 'BSA / FinCEN',
    explanation: 'Identity verification or bank account data is being processed.',
  },
  crypto: {
    state: 'crypto',
    label: 'Crypto Flow',
    color: '#A855F7',
    regulation: 'FinCEN MSB rules',
    explanation: 'A cryptocurrency transaction is in flight.',
  },
  banking: {
    state: 'banking',
    label: 'Regulated Banking',
    color: '#EF4444',
    regulation: 'Banking regulation / BaaS licensing',
    explanation: 'Treasury, Issuing, or Capital is active. Stripe holds the required licenses.',
  },
}

export function getComplianceMeta(state: ComplianceState): ComplianceMeta {
  return COMPLIANCE_CONFIG[state]
}

export function deriveComplianceResult(states: ComplianceState[]): ComplianceResult {
  const active: ComplianceState[] = states.length === 0 ? ['idle'] : [...states]

  let primary: ComplianceState = 'idle'
  for (const state of active) {
    if (PRIORITY.indexOf(state) > PRIORITY.indexOf(primary)) {
      primary = state
    }
  }

  const metas = active.map((s) => COMPLIANCE_CONFIG[s])
  const nonIdle = active
    .filter((s) => s !== 'idle')
    .sort((a, b) => PRIORITY.indexOf(b) - PRIORITY.indexOf(a)) // highest priority first
  const label = nonIdle.length === 0
    ? 'Safe / Idle'
    : nonIdle.map((s) => COMPLIANCE_CONFIG[s].label).join(' + ')

  return {
    primary,
    color: COMPLIANCE_CONFIG[primary].color,
    active,
    label,
    metas,
  }
}
