"use client"
import { usePersona } from '@/engine/persona'

const KYC_LABELS = {
  not_required: { label: 'KYC: N/A', cls: 'bg-zinc-100 text-zinc-500' },
  pending: { label: 'KYC: ⏳ pending', cls: 'bg-yellow-100 text-yellow-700' },
  verified: { label: 'KYC: ✓ verified', cls: 'bg-green-100 text-green-700' },
  rejected: { label: 'KYC: ✗ rejected', cls: 'bg-red-100 text-red-700' },
} as const

const CONNECT_LABELS = {
  none: null,
  onboarding: { label: 'CONNECT: ⏳ onboarding', cls: 'bg-yellow-100 text-yellow-700' },
  active: { label: 'CONNECT: ✓ active', cls: 'bg-green-100 text-green-700' },
  restricted: { label: 'CONNECT: ⚠ restricted', cls: 'bg-orange-100 text-orange-700' },
} as const

export function PersonaBadge() {
  const { active } = usePersona()
  const kyc = KYC_LABELS[active.kycState]
  const connect = CONNECT_LABELS[active.connectState]

  return (
    <div className="flex items-center gap-2 text-xs font-mono">
      <span className="rounded bg-indigo-100 px-2 py-0.5 text-indigo-700">
        AUTH: {active.name} {active.useSso ? '(SSO)' : '● session'}
      </span>
      <span className="rounded bg-zinc-100 px-2 py-0.5 text-zinc-600">
        ROLE: {active.role}
      </span>
      <span className={`rounded px-2 py-0.5 ${kyc.cls}`}>{kyc.label}</span>
      {connect && (
        <span className={`rounded px-2 py-0.5 ${connect.cls}`}>{connect.label}</span>
      )}
    </div>
  )
}
