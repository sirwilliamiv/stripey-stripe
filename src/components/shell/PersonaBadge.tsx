"use client"
import { useFakeAuth } from '@/lib/fake-auth'

const KYC_LABELS: Record<string, string> = {
  not_required: 'No KYC',
  pending: 'KYC Pending',
  verified: 'Verified',
  rejected: 'KYC Rejected',
}

const KYC_COLORS: Record<string, string> = {
  not_required: 'text-zinc-400',
  pending: 'text-yellow-400',
  verified: 'text-green-400',
  rejected: 'text-red-400',
}

export function PersonaBadge() {
  const persona = useFakeAuth((s) => s.persona)

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-800 text-sm">
      <span className="text-zinc-100 font-medium">{persona.name}</span>
      <span className="text-zinc-500">·</span>
      <span className="text-zinc-400 capitalize">{persona.role.replace('_', ' ')}</span>
      <span className="text-zinc-500">·</span>
      <span className={KYC_COLORS[persona.kycState]}>{KYC_LABELS[persona.kycState]}</span>
    </div>
  )
}
