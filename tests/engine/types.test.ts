import { describe, it, expectTypeOf } from 'vitest'
import type { SimEvent, Persona, ComplianceState, Actor, EventPhase } from '@/engine/types'

describe('SimEvent', () => {
  it('requires complianceStates array', () => {
    expectTypeOf<SimEvent['complianceStates']>().toEqualTypeOf<ComplianceState[]>()
  })

  it('actor is a union', () => {
    expectTypeOf<SimEvent['actor']>().toEqualTypeOf<Actor>()
  })

  it('phase is required and is EventPhase union', () => {
    expectTypeOf<SimEvent['phase']>().toEqualTypeOf<EventPhase>()
  })

  it('flowId and stepId are optional strings', () => {
    expectTypeOf<SimEvent['flowId']>().toEqualTypeOf<string | undefined>()
    expectTypeOf<SimEvent['stepId']>().toEqualTypeOf<string | undefined>()
  })

  it('optional fields are optional', () => {
    expectTypeOf<SimEvent['certTips']>().toEqualTypeOf<string[] | undefined>()
    expectTypeOf<SimEvent['stripeObject']>().toEqualTypeOf<string | undefined>()
  })
})

describe('Persona', () => {
  it('has required fields', () => {
    expectTypeOf<Persona['role']>().not.toBeAny()
    expectTypeOf<Persona['kycState']>().not.toBeAny()
  })
})
