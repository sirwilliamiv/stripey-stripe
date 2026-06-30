import { describe, it, expect } from 'vitest'
import { deriveComplianceResult } from '@/engine/compliance'

describe('deriveComplianceResult', () => {
  it('returns idle when states is empty', () => {
    const result = deriveComplianceResult([])
    expect(result.primary).toBe('idle')
    expect(result.color).toBe('#22C55E')
    expect(result.active).toEqual(['idle'])
    expect(result.label).toBe('Safe / Idle')
  })

  it('returns idle when states is ["idle"]', () => {
    const result = deriveComplianceResult(['idle'])
    expect(result.primary).toBe('idle')
  })

  it('picks pci as primary when pci is present', () => {
    const result = deriveComplianceResult(['pii', 'pci'])
    expect(result.primary).toBe('pci')
    expect(result.color).toBe('#F97316')
  })

  it('combines labels for multiple states', () => {
    const result = deriveComplianceResult(['pii', 'kyc_aml'])
    expect(result.label).toContain('PII In Flight')
    expect(result.label).toContain('KYC / AML')
  })

  it('returns all metas for active states', () => {
    const result = deriveComplianceResult(['pci', 'pii'])
    expect(result.metas).toHaveLength(2)
    const types = result.metas.map((m) => m.state)
    expect(types).toContain('pci')
    expect(types).toContain('pii')
  })

  it('banking has higher priority than pii', () => {
    const result = deriveComplianceResult(['pii', 'banking'])
    expect(result.primary).toBe('banking')
  })

  it('crypto has higher priority than kyc_aml', () => {
    const result = deriveComplianceResult(['kyc_aml', 'crypto'])
    expect(result.primary).toBe('crypto')
  })

  it('pci has highest priority', () => {
    const result = deriveComplianceResult(['pii', 'kyc_aml', 'crypto', 'banking', 'pci'])
    expect(result.primary).toBe('pci')
  })
})
