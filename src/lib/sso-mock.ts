"use client"
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface SsoState {
  active: boolean
  provider: string | null
  simulateSso: (provider: string) => void
  clearSso: () => void
}

export const useSsoMock = create<SsoState>()(
  immer((set) => ({
    active: false,
    provider: null,
    simulateSso: (provider) =>
      set((s) => {
        s.active = true
        s.provider = provider
      }),
    clearSso: () =>
      set((s) => {
        s.active = false
        s.provider = null
      }),
  }))
)

export const SSO_PROVIDERS = ['Okta', 'Azure AD', 'Google Workspace', 'OneLogin'] as const
export type SsoProvider = (typeof SSO_PROVIDERS)[number]
