import { describe, it, expect } from 'vitest'
import { deriveComplianceResult, getComplianceMeta } from '@/engine/compliance'

describe('deriveComplianceResult', () => {
  it('idle → green, label "Safe / Idle"', () => {
    const r = deriveComplianceResult(['idle'])
    expect(r.color).toBe('#22C55E')
    expect(r.primary).toBe('idle')
    expect(r.active).toEqual(['idle'])
  })

  it('pci → orange primary', () => {
    const r = deriveComplianceResult(['pci'])
    expect(r.color).toBe('#F97316')
    expect(r.primary).toBe('pci')
  })

  it('multiple active states — primary is highest priority, all are in active[]', () => {
    const r = deriveComplianceResult(['pii', 'pci'])
    expect(r.primary).toBe('pci')
    expect(r.color).toBe('#F97316')
    expect(r.active).toContain('pii')
    expect(r.active).toContain('pci')
    expect(r.label).toContain('PCI')
    expect(r.label).toContain('PII')
  })

  it('empty → idle', () => {
    const r = deriveComplianceResult([])
    expect(r.color).toBe('#22C55E')
    expect(r.primary).toBe('idle')
  })
})

describe('getComplianceMeta', () => {
  it('pci returns regulation and explanation', () => {
    const meta = getComplianceMeta('pci')
    expect(meta.regulation).toContain('PCI-DSS')
    expect(meta.label).toBeTruthy()
    expect(meta.explanation).toBeTruthy()
  })

  it('idle returns safe state meta', () => {
    const meta = getComplianceMeta('idle')
    expect(meta.color).toBe('#22C55E')
  })
})
