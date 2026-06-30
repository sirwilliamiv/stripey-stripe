import { describe, it, expect } from 'vitest'
import { canAccess } from '@/engine/rbac'

describe('canAccess', () => {
  it('buyer can access /stripeland', () => {
    expect(canAccess('buyer', '/stripeland')).toBe(true)
  })

  it('buyer cannot access /flowlance/onboard', () => {
    expect(canAccess('buyer', '/flowlance/onboard')).toBe(false)
  })

  it('seller can access /stripeland/sellers/onboard', () => {
    expect(canAccess('seller', '/stripeland/sellers/onboard')).toBe(true)
  })

  it('platform_admin can access everything', () => {
    expect(canAccess('platform_admin', '/flowlance/capital')).toBe(true)
    expect(canAccess('platform_admin', '/stripeland/radar')).toBe(true)
  })

  it('freelancer can access /flowlance', () => {
    expect(canAccess('freelancer', '/flowlance')).toBe(true)
    expect(canAccess('freelancer', '/flowlance/wallet')).toBe(true)
  })

  it('enterprise can access /stackd/invoice', () => {
    expect(canAccess('enterprise', '/stackd/invoice')).toBe(true)
  })
})
