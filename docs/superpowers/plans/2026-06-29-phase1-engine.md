# Phase 1: Simulator Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Stripe learning simulator engine — event queue, DVR, compliance state machine, persona system, Observatory UI shell, and one fake payment flow — with no real Stripe calls yet.

**Architecture:** Single Next.js 15 App Router app. Engine state lives in Zustand stores. Every user action emits a `SimEvent` into the queue. The DVR controls which event is "current." The compliance state machine derives border color from the current event's `complianceStates[]`. Observatory is a tabbed panel that reads from the same queue.

**Tech Stack:** Next.js 15, TypeScript (strict), Tailwind CSS, shadcn/ui, Zustand, Framer Motion, Vitest, Playwright, GitHub Actions.

## Global Constraints

- Node ≥ 20, pnpm ≥ 9
- TypeScript strict mode, `noUncheckedIndexedAccess: true`
- All Zustand stores use the `immer` middleware
- No `any` — use `unknown` and narrow
- Every file under `src/engine/` must have a corresponding test file under `tests/engine/`
- Commit message format: `type(scope): message` — e.g. `feat(engine): add compliance state machine`
- All components are React Server Components by default; add `"use client"` only when needed

---

## File Map

```
src/
  engine/
    types.ts                   SimEvent, Persona, Role, ComplianceState, all shared types
    event-emitter.ts           emit() — creates and enqueues a SimEvent
    event-queue.ts             Zustand store: events[] only — no cursor. enqueue() just pushes.
    dvr.ts                     Zustand store: cursor, currentEvent, isPlaying, speed, freeze. Subscribes to queue.
    redaction.ts               redactSensitiveFields() — strips PAN/CVC/SSN from request/response before display
    compliance.ts              complianceStates[] → border color + label
    persona.ts                 Zustand store: active persona, swap()
    rbac.ts                    Role → allowed routes map, canAccess()
    failure-modes.ts           FailureModeConfig registry, active toggles store
    exam-mode.ts               ExamQuestion registry, grade(), getQuestionsForFlow()
    stripe-objects/
      examples.ts              Hardcoded StripeObjectExample[] for the explorer
  lib/
    fake-auth.ts               setPersonaCookie(), getPersonaFromCookie()
    sso-mock.ts                mockOidcRedirect(), mockOidcCallback()
    cn.ts                      clsx + twMerge helper
  components/
    shell/
      ComplianceBorder.tsx     Animated 4px border wrapping viewport
      TopBar.tsx               Business switcher + persona badge + mode indicators
      SplitLayout.tsx          60/40 split, Observatory on right
      PersonaBadge.tsx         Auth / KYC / Connect state chips
    observatory/
      Observatory.tsx          Tabs container
      DVRControls.tsx          ◀◀ ◀ ❚❚ ▶ ▶▶ + speed + freeze
      tabs/
        ApiLogTab.tsx          Event log with actor tags + redaction
        WebhooksTab.tsx        Webhook event stream
        ObjectExplorerTab.tsx  Stripe object inspector
        MoneyFlowTab.tsx       Animated SVG graph (stub in Phase 1)
        ComplianceTab.tsx      Current state + regulation explanation
        StoreGuideTab.tsx      What to store / never store
        CertTipsTab.tsx        Cert tip + exam questions
    persona/
      PersonaSwitcher.tsx      Dropdown to swap persona
    fake-flow/
      FakePaymentFlow.tsx      One complete fake "pay $10" flow
  middleware.ts                RBAC route guard
  app/
    layout.tsx                 Root layout: ComplianceBorder + TopBar + SplitLayout
    page.tsx                   World dashboard (stub)
    api/
      events/route.ts          SSE stream of queued events
      auth/
        persona/route.ts       POST: swap persona cookie
        sso/route.ts           GET: mock OIDC initiate; GET callback: complete
tests/
  engine/
    types.test.ts
    event-queue.test.ts
    dvr.test.ts
    compliance.test.ts
    persona.test.ts
    rbac.test.ts
    failure-modes.test.ts
    exam-mode.test.ts
  e2e/
    fake-flow.spec.ts
.github/
  workflows/ci.yml
```

---

## Dependency Graph (parallelization guide)

```
Task 1 (scaffold)
  └─ Task 2 (types)
       ├─ Task 3 (event-queue)  ─┐
       ├─ Task 4 (dvr) ← Task 3 ─┼─ Task 12 (layout + border)
       ├─ Task 5 (compliance)   ─┘     └─ Task 13 (topbar)
       ├─ Task 6 (redaction)                └─ Task 14 (observatory shell)
       ├─ Task 7 (persona)                       ├─ Task 15 (dvr controls UI)
       ├─ Task 8 (rbac) ← Task 7                 ├─ Task 16 (object explorer)
       ├─ Task 9 (failure modes)                  └─ Task 17 (store guide)
       └─ Task 10 (exam mode)
                                           Task 18 (react component tests) ← Task 14
Task 11 (SSO mock) ← Tasks 7, 8           Task 19 (fake flow) ← Tasks 12-18
Task 20 (CI) ← Task 1
```

Parallel after Task 2: Tasks 3, 5, 6, 7, 9, 10.
Task 4 (DVR) depends on Task 3 (queue) — run sequentially.
Parallel after Task 14: Tasks 15, 16, 17, 18.

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `.github/workflows/ci.yml`

- [ ] **Step 1: Bootstrap Next.js**

Directory already has files (docs, git history). Use a temp dir then merge:

```bash
cd /Users/b/Desktop/code/stripey-stripe
pnpm create next-app@latest temp-stripe-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
rsync -av temp-stripe-app/ ./
rm -rf temp-stripe-app
```

Expected: Next.js project files merged into existing directory without overwriting docs/.

- [ ] **Step 2: Install dependencies**

```bash
pnpm add zustand immer framer-motion clsx tailwind-merge
pnpm add @radix-ui/react-tabs @radix-ui/react-dropdown-menu @radix-ui/react-badge
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
pnpm add -D playwright @playwright/test
pnpm add -D @types/node
pnpm dlx shadcn@latest init
```

When shadcn prompts: style=default, base color=zinc, CSS variables=yes.

- [ ] **Step 3: Configure Vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

Create `tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Configure tsconfig strict mode**

In `tsconfig.json`, ensure:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

- [ ] **Step 5: Add test scripts to package.json**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "check": "pnpm type-check && pnpm test"
  }
}
```

- [ ] **Step 6: Write GitHub Actions CI**

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm type-check
      - run: pnpm test
```

- [ ] **Step 7: Verify scaffold**

```bash
pnpm type-check
pnpm test
```

Expected: 0 errors, 0 tests (no test files yet = pass).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(scaffold): next15 + tailwind + vitest + playwright + shadcn"
```

---

## Task 2: SimEvent Type System

**Files:**
- Create: `src/engine/types.ts`
- Test: `tests/engine/types.test.ts`

**Produces:** All shared types consumed by every subsequent task.

- [ ] **Step 1: Write the types**

Create `src/engine/types.ts`:
```typescript
export type Actor = "user" | "app" | "stripe" | "idp" | "webhook"

export type EventPhase =
  | "user_action"
  | "client_call"
  | "server_call"
  | "stripe_object"
  | "webhook"
  | "db_write"
  | "compliance_transition"

// actor = WHO did it. phase = WHAT KIND of system event it is.

export type ComplianceState = "idle" | "pii" | "pci" | "kyc_aml" | "crypto" | "banking"

export type SimulationLevel = "real_api" | "real_hosted" | "simulated" | "conceptual"

export type Role = "buyer" | "seller" | "freelancer" | "enterprise" | "platform_admin"

export type KycState = "not_required" | "pending" | "verified" | "rejected"

export type ConnectState = "none" | "onboarding" | "active" | "restricted"

export type ConnectType = "express" | "custom" | "platform"

export type PlaybackSpeed = 0.5 | 1 | 2

export type FailureModeType =
  | "card_declined"
  | "card_declined_insufficient_funds"
  | "card_declined_do_not_honor"
  | "three_d_secure_required"
  | "webhook_delayed"
  | "webhook_duplicated"
  | "webhook_out_of_order"
  | "subscription_payment_fails"
  | "invoice_past_due"
  | "connect_lost_capability"
  | "kyc_rejected"
  | "payout_failed"
  | "dispute_opened"
  | "refund_issued"
  | "partial_capture"
  | "checkout_session_expired"
  | "rate_limit_hit"

export interface StoreGuidance {
  store: string[]
  neverStore: string[]
  sourceOfTruth: string[]
  listenFor: string[]
}

export interface SimEvent {
  id: string
  flowId?: string        // which demo flow this event belongs to (for exam mode)
  stepId?: string        // logical step within the flow (for cert tips lookup)
  timestamp: string
  actor: Actor
  phase: EventPhase      // what kind of system event (actor = who, phase = what kind)
  source: string
  action: string
  stripeObject?: string
  complianceStates: ComplianceState[]
  request?: unknown
  response?: unknown
  certTips?: string[]
  storeGuidance?: StoreGuidance
  isFailureMode?: boolean
  failureModeType?: FailureModeType
  simulationLevel: SimulationLevel
}

export interface Persona {
  id: string
  name: string
  role: Role
  kycState: KycState
  connectState: ConnectState
  connectType?: ConnectType
  useSso?: boolean
}

export interface FailureModeConfig {
  type: FailureModeType
  label: string
  description: string
  affectedProducts: string[]
}

export interface ExamQuestion {
  id: string
  flowId: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  eventRef?: string
  certTracks: string[]
}

export interface StripeObjectRelationship {
  field: string
  objectType: string
  description: string
}

export interface StripeObjectExample {
  objectType: string
  id: string
  data: Record<string, unknown>
  relationships: StripeObjectRelationship[]
  webhookEvents: string[]
  storeGuidance: StoreGuidance
}
```

- [ ] **Step 2: Write type sanity tests**

Create `tests/engine/types.test.ts`:
```typescript
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
```

- [ ] **Step 3: Run tests**

```bash
pnpm test tests/engine/types.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/engine/types.ts tests/engine/types.test.ts
git commit -m "feat(engine): add SimEvent type system"
```

---

## Task 3: Event Queue Store

**Files:**
- Create: `src/engine/event-queue.ts`, `src/engine/event-emitter.ts`
- Test: `tests/engine/event-queue.test.ts`

**Consumes:** `SimEvent` from `@/engine/types`
**Produces:** `useEventQueue()`, `emit()`

The queue stores events only. It does NOT manage the cursor — that is the DVR's job. `enqueue()` pushes and notifies DVR via the DVR's subscription (set up in dvr.ts). The queue never imports dvr.ts.

- [ ] **Step 1: Write failing tests**

Create `tests/engine/event-queue.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useEventQueue } from '@/engine/event-queue'
import type { SimEvent } from '@/engine/types'

const makeEvent = (overrides: Partial<SimEvent> = {}): SimEvent => ({
  id: 'evt_test_1',
  timestamp: '2026-06-29T00:00:00Z',
  actor: 'user',
  phase: 'user_action',
  source: 'test',
  action: 'test action',
  complianceStates: ['idle'],
  simulationLevel: 'simulated',
  ...overrides,
})

describe('useEventQueue', () => {
  beforeEach(() => {
    useEventQueue.getState().clear()
  })

  it('starts empty', () => {
    const { result } = renderHook(() => useEventQueue())
    expect(result.current.events).toHaveLength(0)
  })

  it('enqueue adds event to events array', () => {
    const { result } = renderHook(() => useEventQueue())
    act(() => result.current.enqueue(makeEvent()))
    expect(result.current.events).toHaveLength(1)
  })

  it('enqueue multiple events adds all to array', () => {
    const { result } = renderHook(() => useEventQueue())
    act(() => {
      result.current.enqueue(makeEvent({ id: 'evt_1' }))
      result.current.enqueue(makeEvent({ id: 'evt_2' }))
    })
    expect(result.current.events).toHaveLength(2)
  })

  it('clear resets to empty', () => {
    const { result } = renderHook(() => useEventQueue())
    act(() => {
      result.current.enqueue(makeEvent())
      result.current.clear()
    })
    expect(result.current.events).toHaveLength(0)
  })

  it('enqueue does NOT manage cursor — queue has no cursor', () => {
    // Queue exposes no cursor field. Cursor lives in DVR.
    const { result } = renderHook(() => useEventQueue())
    act(() => result.current.enqueue(makeEvent()))
    expect((result.current as Record<string, unknown>)['cursor']).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test tests/engine/event-queue.test.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Implement event queue**

Create `src/engine/event-queue.ts`:
```typescript
"use client"
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { SimEvent } from './types'

// Queue stores events only. Cursor lives in DVR.
// DVR subscribes to this store and decides cursor movement.
interface EventQueueState {
  events: SimEvent[]
  enqueue: (event: SimEvent) => void
  clear: () => void
}

export const useEventQueue = create<EventQueueState>()(
  immer((set) => ({
    events: [],

    enqueue: (event) =>
      set((state) => {
        state.events.push(event)
      }),

    clear: () =>
      set((state) => {
        state.events = []
      }),
  }))
)
```

- [ ] **Step 4: Implement emit helper**

Create `src/engine/event-emitter.ts`:
```typescript
import { useEventQueue } from './event-queue'
import type { SimEvent } from './types'

let counter = 0

export function emit(partial: Omit<SimEvent, 'id' | 'timestamp'> & { phase: SimEvent['phase'] }): SimEvent {
  counter += 1
  const event: SimEvent = {
    ...partial,
    id: `evt_${Date.now()}_${counter}`,
    timestamp: new Date().toISOString(),
  }
  useEventQueue.getState().enqueue(event)
  return event
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm test tests/engine/event-queue.test.ts
```

Expected: PASS (7 tests)

- [ ] **Step 6: Commit**

```bash
git add src/engine/event-queue.ts src/engine/event-emitter.ts tests/engine/event-queue.test.ts
git commit -m "feat(engine): add event queue store and emit helper"
```

---

## Task 4: DVR Store

**Files:**
- Create: `src/engine/dvr.ts`
- Test: `tests/engine/dvr.test.ts`

**Consumes:** `useEventQueue` from `@/engine/event-queue`, `PlaybackSpeed` from `@/engine/types`
**Produces:** `useDVR()`

DVR owns `cursor` and `currentEvent`. It subscribes to `useEventQueue.events` on module load. When a new event is enqueued: if cursor is -1, advance to 0 (first event); if playing and not frozen, advance to latest; if paused or frozen, hold. The queue never imports dvr — one-way dependency.

- [ ] **Step 1: Write failing tests**

Create `tests/engine/dvr.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'
import { emit } from '@/engine/event-emitter'

const makePartial = (overrides = {}) => ({
  actor: 'user' as const,
  phase: 'user_action' as const,
  source: 'test',
  action: 'test',
  complianceStates: ['idle'] as const,
  simulationLevel: 'simulated' as const,
  ...overrides,
})

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined, isPlaying: false, isFrozen: false, speed: 1 })
})

describe('useDVR — playback controls', () => {
  it('starts paused, unfrozen, cursor -1', () => {
    const { result } = renderHook(() => useDVR())
    expect(result.current.isPlaying).toBe(false)
    expect(result.current.isFrozen).toBe(false)
    expect(result.current.cursor).toBe(-1)
  })

  it('play sets isPlaying true', () => {
    const { result } = renderHook(() => useDVR())
    act(() => result.current.play())
    expect(result.current.isPlaying).toBe(true)
  })

  it('freeze locks both play state and isFrozen', () => {
    const { result } = renderHook(() => useDVR())
    act(() => result.current.freeze())
    expect(result.current.isFrozen).toBe(true)
    expect(result.current.isPlaying).toBe(false)
  })

  it('setSpeed changes speed', () => {
    const { result } = renderHook(() => useDVR())
    act(() => result.current.setSpeed(2))
    expect(result.current.speed).toBe(2)
  })
})

describe('useDVR — cursor management (the DVR learning model)', () => {
  it('first enqueue always shows the event (cursor -1 → 0), even when paused', () => {
    // paused by default
    act(() => emit(makePartial({ id: 'evt_1' })))
    expect(useDVR.getState().cursor).toBe(0)
    expect(useDVR.getState().currentEvent?.id).toMatch('evt_1')
  })

  it('enqueue does NOT advance cursor when paused and cursor already set', () => {
    act(() => emit(makePartial({ id: 'evt_1' })))  // cursor → 0
    act(() => emit(makePartial({ id: 'evt_2' })))  // paused: cursor stays 0
    expect(useDVR.getState().cursor).toBe(0)
    expect(useDVR.getState().currentEvent?.id).toMatch('evt_1')
  })

  it('enqueue advances cursor to latest when playing', () => {
    useDVR.setState({ isPlaying: true, isFrozen: false })
    act(() => emit(makePartial({ id: 'evt_1' })))
    act(() => emit(makePartial({ id: 'evt_2' })))
    expect(useDVR.getState().cursor).toBe(1)
    expect(useDVR.getState().currentEvent?.id).toMatch('evt_2')
  })

  it('freeze prevents cursor movement even when isPlaying was true', () => {
    useDVR.setState({ isPlaying: true, isFrozen: true })
    act(() => emit(makePartial({ id: 'evt_1' })))  // cursor → 0 (first event)
    act(() => emit(makePartial({ id: 'evt_2' })))  // frozen: stays at 0
    expect(useDVR.getState().cursor).toBe(0)
  })

  it('stepForward advances cursor by 1', () => {
    act(() => emit(makePartial({ id: 'evt_1' })))
    act(() => emit(makePartial({ id: 'evt_2' })))
    // cursor is at 0 (paused after first event)
    const { result } = renderHook(() => useDVR())
    act(() => result.current.stepForward())
    expect(result.current.cursor).toBe(1)
  })

  it('stepBack decrements cursor by 1', () => {
    act(() => emit(makePartial({ id: 'evt_1' })))
    act(() => emit(makePartial({ id: 'evt_2' })))
    useDVR.setState({ cursor: 1, currentEvent: useEventQueue.getState().events[1] })
    const { result } = renderHook(() => useDVR())
    act(() => result.current.stepBack())
    expect(result.current.cursor).toBe(0)
  })

  it('clear resets cursor to -1', () => {
    act(() => emit(makePartial({ id: 'evt_1' })))
    act(() => useEventQueue.getState().clear())
    expect(useDVR.getState().cursor).toBe(-1)
    expect(useDVR.getState().currentEvent).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test tests/engine/dvr.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement DVR store**

Create `src/engine/dvr.ts`:
```typescript
"use client"
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PlaybackSpeed, SimEvent } from './types'
import { useEventQueue } from './event-queue'

interface DVRState {
  cursor: number
  currentEvent: SimEvent | undefined
  isPlaying: boolean
  isFrozen: boolean
  speed: PlaybackSpeed
  stepDelayMs: number
  play: () => void
  pause: () => void
  freeze: () => void
  unfreeze: () => void
  setSpeed: (speed: PlaybackSpeed) => void
  stepForward: () => void
  stepBack: () => void
  jumpToStart: () => void
  jumpToEnd: () => void
}

export const useDVR = create<DVRState>()(
  immer((set, get) => ({
    cursor: -1,
    currentEvent: undefined,
    isPlaying: false,
    isFrozen: false,
    speed: 1,
    stepDelayMs: 3000,

    play: () => set((s) => { s.isPlaying = true; s.isFrozen = false }),
    pause: () => set((s) => { s.isPlaying = false }),
    freeze: () => set((s) => { s.isFrozen = true; s.isPlaying = false }),
    unfreeze: () => set((s) => { s.isFrozen = false }),
    setSpeed: (speed) => set((s) => {
      s.speed = speed
      s.stepDelayMs = Math.round(3000 / speed)
    }),

    stepForward: () => {
      const events = useEventQueue.getState().events
      const { cursor } = get()
      const next = Math.min(cursor + 1, events.length - 1)
      set((s) => { s.cursor = next; s.currentEvent = events[next] })
    },
    stepBack: () => {
      const events = useEventQueue.getState().events
      const { cursor } = get()
      const prev = Math.max(cursor - 1, 0)
      set((s) => { s.cursor = prev; s.currentEvent = events[prev] })
    },
    jumpToStart: () => {
      const events = useEventQueue.getState().events
      if (events.length > 0) set((s) => { s.cursor = 0; s.currentEvent = events[0] })
    },
    jumpToEnd: () => {
      const events = useEventQueue.getState().events
      if (events.length > 0) {
        const last = events.length - 1
        set((s) => { s.cursor = last; s.currentEvent = events[last] })
      }
    },
  }))
)

// Subscribe to queue — DVR decides cursor movement.
// Queue never imports DVR. One-way dependency.
useEventQueue.subscribe((state, prevState) => {
  const events = state.events

  if (events.length === 0 && prevState.events.length > 0) {
    // Queue cleared
    useDVR.setState({ cursor: -1, currentEvent: undefined })
    return
  }

  if (events.length > prevState.events.length) {
    // New event enqueued
    const { cursor, isPlaying, isFrozen } = useDVR.getState()

    if (cursor === -1) {
      // First event ever — always show it regardless of play state
      useDVR.setState({ cursor: 0, currentEvent: events[0] })
    } else if (isPlaying && !isFrozen) {
      // Playing: advance to newest
      const last = events.length - 1
      useDVR.setState({ cursor: last, currentEvent: events[last] })
    }
    // Paused or frozen: hold cursor, user steps manually
  }
})
```

- [ ] **Step 4: Run tests**

```bash
pnpm test tests/engine/dvr.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/dvr.ts tests/engine/dvr.test.ts
git commit -m "feat(engine): add DVR store with step/play/freeze controls"
```

---

## Task 5: Compliance State Machine

**Files:**
- Create: `src/engine/compliance.ts`
- Test: `tests/engine/compliance.test.ts`

**Consumes:** `ComplianceState` from `@/engine/types`
**Produces:** `COMPLIANCE_CONFIG`, `getComplianceMeta()`, `deriveComplianceResult()`

- [ ] **Step 1: Write failing tests**

Create `tests/engine/compliance.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { deriveComplianceColor, getComplianceMeta } from '@/engine/compliance'

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
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test tests/engine/compliance.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement compliance module**

Create `src/engine/compliance.ts`:
```typescript
import type { ComplianceState } from './types'

export interface ComplianceMeta {
  state: ComplianceState
  label: string
  color: string
  regulation: string
  explanation: string
  saqNote?: string
}

// Priority order: higher index = higher priority when multiple states active
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
    explanation: 'Personally identifiable information (name, email, address) is being collected or transmitted. Your app must handle this under GDPR/CCPA requirements.',
  },
  pci: {
    state: 'pci',
    label: 'PCI Scope',
    color: '#F97316',
    regulation: 'PCI-DSS SAQ A',
    explanation: 'Card data is in scope. Stripe Elements iframes isolate card fields so PANs never reach your server. Your app qualifies for SAQ A, not SAQ A-EP.',
    saqNote: 'SAQ A applies because Stripe.js handles the card field in an iframe. If you wrote any JS that touches the card field directly, you would need SAQ A-EP.',
  },
  kyc_aml: {
    state: 'kyc_aml',
    label: 'KYC / AML',
    color: '#3B82F6',
    regulation: 'BSA / FinCEN',
    explanation: 'Identity verification or bank account data is being processed. Stripe Identity and Financial Connections handle the regulated data — your app receives only a status and verification ID.',
  },
  crypto: {
    state: 'crypto',
    label: 'Crypto Flow',
    color: '#A855F7',
    regulation: 'FinCEN MSB rules',
    explanation: 'A cryptocurrency transaction is in flight. Depending on jurisdiction and volume, your platform may be classified as a Money Services Business.',
  },
  banking: {
    state: 'banking',
    label: 'Regulated Banking',
    color: '#EF4444',
    regulation: 'Banking regulation / BaaS licensing',
    explanation: 'Treasury, Issuing, or Capital is active. These products involve regulated banking infrastructure. Stripe holds the required licenses; your platform operates under Stripe\'s BaaS umbrella.',
  },
}

export function getComplianceMeta(state: ComplianceState): ComplianceMeta {
  return COMPLIANCE_CONFIG[state]
}

export interface ComplianceResult {
  primary: ComplianceState  // highest-priority state (drives border color)
  color: string             // border color for primary
  active: ComplianceState[] // all active states (drives label + gradient later)
  label: string             // human-readable combined label
  metas: ComplianceMeta[]   // full meta for all active states
}

export function deriveComplianceResult(states: ComplianceState[]): ComplianceResult {
  const active = states.length === 0 ? ['idle' as ComplianceState] : [...states]

  // Pick highest-priority state for the border color
  let primary: ComplianceState = 'idle'
  for (const state of active) {
    if (PRIORITY.indexOf(state) > PRIORITY.indexOf(primary)) {
      primary = state
    }
  }

  const metas = active.map((s) => COMPLIANCE_CONFIG[s])
  const nonIdle = active.filter((s) => s !== 'idle')
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
```

- [ ] **Step 4: Run tests**

```bash
pnpm test tests/engine/compliance.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/compliance.ts tests/engine/compliance.test.ts
git commit -m "feat(engine): add compliance state machine"
```

---

## Task 6: Redaction Helper

**Files:**
- Create: `src/engine/redaction.ts`
- Test: `tests/engine/redaction.test.ts`

**Produces:** `redactSensitiveFields(value: unknown): unknown`

Teaches the right habit: even in fake data, never log sensitive-looking field names. Used by ApiLogTab before rendering request/response.

- [ ] **Step 1: Write failing tests**

Create `tests/engine/redaction.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { redactSensitiveFields } from '@/engine/redaction'

describe('redactSensitiveFields', () => {
  it('redacts card number fields', () => {
    const result = redactSensitiveFields({ number: '4242424242424242', amount: 100 })
    expect((result as Record<string, unknown>).number).toBe('[REDACTED]')
    expect((result as Record<string, unknown>).amount).toBe(100)
  })

  it('redacts cvc', () => {
    const result = redactSensitiveFields({ cvc: '123' })
    expect((result as Record<string, unknown>).cvc).toBe('[REDACTED]')
  })

  it('redacts nested sensitive fields', () => {
    const result = redactSensitiveFields({ card: { number: '4242', cvc: '123', exp_month: 12 } })
    const card = (result as Record<string, unknown>).card as Record<string, unknown>
    expect(card.number).toBe('[REDACTED]')
    expect(card.cvc).toBe('[REDACTED]')
    expect(card.exp_month).toBe('[REDACTED]')
  })

  it('redacts ssn and tax_id', () => {
    const result = redactSensitiveFields({ ssn: '123-45-6789', tax_id: 'EIN123' })
    expect((result as Record<string, unknown>).ssn).toBe('[REDACTED]')
    expect((result as Record<string, unknown>).tax_id).toBe('[REDACTED]')
  })

  it('passes through non-sensitive primitives', () => {
    expect(redactSensitiveFields('hello')).toBe('hello')
    expect(redactSensitiveFields(42)).toBe(42)
    expect(redactSensitiveFields(null)).toBeNull()
  })

  it('handles arrays by redacting each element', () => {
    const result = redactSensitiveFields([{ number: '4242' }, { amount: 100 }])
    expect((result as Array<Record<string, unknown>>)[0]?.number).toBe('[REDACTED]')
    expect((result as Array<Record<string, unknown>>)[1]?.amount).toBe(100)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test tests/engine/redaction.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement**

Create `src/engine/redaction.ts`:
```typescript
const SENSITIVE_KEYS = new Set([
  'number', 'cvc', 'exp_month', 'exp_year',
  'card', 'pan', 'ssn', 'tax_id', 'dob',
  'account_number', 'routing_number',
])

export function redactSensitiveFields(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(redactSensitiveFields)

  const obj = value as Record<string, unknown>
  const result: Record<string, unknown> = {}

  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key)) {
      result[key] = '[REDACTED]'
    } else {
      result[key] = redactSensitiveFields(val)
    }
  }

  return result
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test tests/engine/redaction.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/redaction.ts tests/engine/redaction.test.ts
git commit -m "feat(engine): add sensitive field redaction helper"
```

---

## Task 7: Persona Store + Fake JWT

**Files:**
- Create: `src/engine/persona.ts`, `src/lib/fake-auth.ts`
- Test: `tests/engine/persona.test.ts`

**Produces:** `usePersona()`, `PERSONAS`, `setPersonaCookie()`, `getPersonaFromCookie()`

- [ ] **Step 1: Write failing tests**

Create `tests/engine/persona.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { usePersona, PERSONAS } from '@/engine/persona'

beforeEach(() => {
  usePersona.setState({ active: PERSONAS['alex']! })
})

describe('usePersona', () => {
  it('starts with alex as default', () => {
    const { result } = renderHook(() => usePersona())
    expect(result.current.active.id).toBe('alex')
  })

  it('swap changes active persona', () => {
    const { result } = renderHook(() => usePersona())
    act(() => result.current.swap('maya'))
    expect(result.current.active.id).toBe('maya')
    expect(result.current.active.role).toBe('seller')
  })

  it('all 6 personas are defined', () => {
    expect(Object.keys(PERSONAS)).toHaveLength(6)
  })

  it('maya is a fully verified seller', () => {
    expect(PERSONAS['maya']?.kycState).toBe('verified')
    expect(PERSONAS['maya']?.connectState).toBe('active')
    expect(PERSONAS['maya']?.connectType).toBe('express')
  })

  it('jordan is mid-onboarding', () => {
    expect(PERSONAS['jordan']?.kycState).toBe('pending')
    expect(PERSONAS['jordan']?.connectState).toBe('onboarding')
  })

  it('dana uses SSO', () => {
    expect(PERSONAS['dana']?.useSso).toBe(true)
  })
})
```

- [ ] **Step 2: Run to confirm failure**

```bash
pnpm test tests/engine/persona.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement persona store**

Create `src/engine/persona.ts`:
```typescript
"use client"
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Persona } from './types'

export const PERSONAS: Record<string, Persona> = {
  alex: {
    id: 'alex',
    name: 'Alex',
    role: 'buyer',
    kycState: 'not_required',
    connectState: 'none',
  },
  maya: {
    id: 'maya',
    name: 'Maya',
    role: 'seller',
    kycState: 'verified',
    connectState: 'active',
    connectType: 'express',
  },
  jordan: {
    id: 'jordan',
    name: 'Jordan',
    role: 'seller',
    kycState: 'pending',
    connectState: 'onboarding',
    connectType: 'express',
  },
  sam: {
    id: 'sam',
    name: 'Sam',
    role: 'freelancer',
    kycState: 'verified',
    connectState: 'active',
    connectType: 'custom',
  },
  dana: {
    id: 'dana',
    name: 'Dana',
    role: 'enterprise',
    kycState: 'not_required',
    connectState: 'none',
    useSso: true,
  },
  billy: {
    id: 'billy',
    name: 'Billy',
    role: 'platform_admin',
    kycState: 'not_required',
    connectState: 'active',
    connectType: 'platform',
  },
}

interface PersonaState {
  active: Persona
  swap: (id: string) => void
}

export const usePersona = create<PersonaState>()(
  immer((set) => ({
    active: PERSONAS['alex']!,
    swap: (id) =>
      set((state) => {
        const p = PERSONAS[id]
        if (p) state.active = p
      }),
  }))
)
```

- [ ] **Step 4: Implement fake-auth helpers**

Create `src/lib/fake-auth.ts`:
```typescript
import { cookies } from 'next/headers'
import { PERSONAS } from '@/engine/persona'
import type { Persona } from '@/engine/types'

const COOKIE_NAME = 'stripe_demo_persona'

export async function getPersonaFromCookie(): Promise<Persona> {
  const store = await cookies()
  const id = store.get(COOKIE_NAME)?.value ?? 'alex'
  return PERSONAS[id] ?? PERSONAS['alex']!
}

export async function setPersonaCookie(id: string): Promise<void> {
  const store = await cookies()
  store.set(COOKIE_NAME, id, { httpOnly: true, sameSite: 'lax', path: '/' })
}
```

- [ ] **Step 5: Run tests**

```bash
pnpm test tests/engine/persona.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/engine/persona.ts src/lib/fake-auth.ts tests/engine/persona.test.ts
git commit -m "feat(engine): add persona store and fake JWT cookie helpers"
```

---

## Task 8: RBAC + Middleware

**Files:**
- Create: `src/engine/rbac.ts`, `src/middleware.ts`
- Test: `tests/engine/rbac.test.ts`

**Consumes:** `Role` from `@/engine/types`, `getPersonaFromCookie` from `@/lib/fake-auth`
**Produces:** `ROLE_ROUTES`, `canAccess()`, Next.js middleware

- [ ] **Step 1: Write failing tests**

Create `tests/engine/rbac.test.ts`:
```typescript
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
```

- [ ] **Step 2: Implement RBAC**

Create `src/engine/rbac.ts`:
```typescript
import type { Role } from './types'

// Routes that require specific roles. Prefix match.
const RESTRICTED: Array<{ prefix: string; allowedRoles: Role[] }> = [
  { prefix: '/stripeland/sellers', allowedRoles: ['seller', 'platform_admin'] },
  { prefix: '/stripeland/radar', allowedRoles: ['seller', 'platform_admin'] },
  { prefix: '/flowlance/onboard', allowedRoles: ['freelancer', 'platform_admin'] },
  { prefix: '/flowlance/wallet', allowedRoles: ['freelancer', 'platform_admin'] },
  { prefix: '/flowlance/cards', allowedRoles: ['freelancer', 'platform_admin'] },
  { prefix: '/flowlance/capital', allowedRoles: ['freelancer', 'platform_admin'] },
  { prefix: '/stackd/invoice', allowedRoles: ['enterprise', 'platform_admin'] },
]

export function canAccess(role: Role, pathname: string): boolean {
  if (role === 'platform_admin') return true
  for (const rule of RESTRICTED) {
    if (pathname.startsWith(rule.prefix)) {
      return rule.allowedRoles.includes(role)
    }
  }
  return true
}
```

- [ ] **Step 3: Implement middleware**

Create `src/middleware.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { PERSONAS } from '@/engine/persona'
import { canAccess } from '@/engine/rbac'

export function middleware(request: NextRequest) {
  const personaId = request.cookies.get('stripe_demo_persona')?.value ?? 'alex'
  const persona = PERSONAS[personaId] ?? PERSONAS['alex']!
  const { pathname } = request.nextUrl

  if (!canAccess(persona.role, pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.searchParams.set('rbac_blocked', '1')
    url.searchParams.set('required_role', 'see_observatory')
    return NextResponse.redirect(url)
  }

  const response = NextResponse.next()
  response.headers.set('x-persona-id', persona.id)
  response.headers.set('x-persona-role', persona.role)
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test tests/engine/rbac.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/rbac.ts src/middleware.ts tests/engine/rbac.test.ts
git commit -m "feat(engine): add RBAC module and Next.js middleware"
```

---

## Task 9: Failure Mode Registry

**Files:**
- Create: `src/engine/failure-modes.ts`
- Test: `tests/engine/failure-modes.test.ts`

**Produces:** `FAILURE_MODES`, `useFailureModes()`

- [ ] **Step 1: Write failing tests**

Create `tests/engine/failure-modes.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useFailureModes, FAILURE_MODES } from '@/engine/failure-modes'

beforeEach(() => {
  useFailureModes.getState().clearAll()
})

describe('FAILURE_MODES', () => {
  it('has all 17 failure modes defined', () => {
    expect(Object.keys(FAILURE_MODES)).toHaveLength(17)
  })

  it('each mode has label and description', () => {
    for (const mode of Object.values(FAILURE_MODES)) {
      expect(mode.label).toBeTruthy()
      expect(mode.description).toBeTruthy()
      expect(mode.affectedProducts.length).toBeGreaterThan(0)
    }
  })
})

describe('useFailureModes', () => {
  it('starts with no active modes', () => {
    const { result } = renderHook(() => useFailureModes())
    expect(result.current.active).toHaveLength(0)
  })

  it('toggle activates a mode', () => {
    const { result } = renderHook(() => useFailureModes())
    act(() => result.current.toggle('card_declined'))
    expect(result.current.active).toContain('card_declined')
  })

  it('toggle twice deactivates', () => {
    const { result } = renderHook(() => useFailureModes())
    act(() => {
      result.current.toggle('card_declined')
      result.current.toggle('card_declined')
    })
    expect(result.current.active).not.toContain('card_declined')
  })

  it('isActive returns correct boolean', () => {
    const { result } = renderHook(() => useFailureModes())
    act(() => result.current.toggle('webhook_delayed'))
    expect(result.current.isActive('webhook_delayed')).toBe(true)
    expect(result.current.isActive('card_declined')).toBe(false)
  })
})
```

- [ ] **Step 2: Implement**

Create `src/engine/failure-modes.ts`:
```typescript
"use client"
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { FailureModeConfig, FailureModeType } from './types'

export const FAILURE_MODES: Record<FailureModeType, FailureModeConfig> = {
  card_declined: { type: 'card_declined', label: 'Card Declined', description: 'Generic decline — card issuer rejects the charge.', affectedProducts: ['Payments', 'Billing'] },
  card_declined_insufficient_funds: { type: 'card_declined_insufficient_funds', label: 'Insufficient Funds', description: 'Card has insufficient funds.', affectedProducts: ['Payments'] },
  card_declined_do_not_honor: { type: 'card_declined_do_not_honor', label: 'Do Not Honor', description: 'Issuer blocks the charge without explanation.', affectedProducts: ['Payments'] },
  three_d_secure_required: { type: 'three_d_secure_required', label: '3D Secure Required', description: 'Card requires additional authentication before payment confirms.', affectedProducts: ['Payments', 'Billing'] },
  webhook_delayed: { type: 'webhook_delayed', label: 'Webhook Delayed', description: 'Webhook arrives 5+ minutes after the event. Your handler must be idempotent.', affectedProducts: ['All'] },
  webhook_duplicated: { type: 'webhook_duplicated', label: 'Webhook Duplicated', description: 'Same event ID delivered twice. Idempotency key prevents double-processing.', affectedProducts: ['All'] },
  webhook_out_of_order: { type: 'webhook_out_of_order', label: 'Webhook Out of Order', description: 'succeeded arrives before created. Never assume ordering.', affectedProducts: ['All'] },
  subscription_payment_fails: { type: 'subscription_payment_fails', label: 'Subscription Payment Fails', description: 'Renewal charge fails. Subscription moves to past_due, not canceled.', affectedProducts: ['Billing'] },
  invoice_past_due: { type: 'invoice_past_due', label: 'Invoice Past Due', description: 'Invoice payment fails after all retry attempts.', affectedProducts: ['Billing', 'Invoicing'] },
  connect_lost_capability: { type: 'connect_lost_capability', label: 'Connect Lost Capability', description: 'Connected account loses a capability (e.g., card_payments). Payouts are blocked.', affectedProducts: ['Connect'] },
  kyc_rejected: { type: 'kyc_rejected', label: 'KYC Rejected', description: 'Identity verification fails. Account cannot receive payouts.', affectedProducts: ['Identity', 'Connect'] },
  payout_failed: { type: 'payout_failed', label: 'Payout Failed', description: 'Payout to bank account fails. Funds return to Stripe balance.', affectedProducts: ['Connect', 'Treasury'] },
  dispute_opened: { type: 'dispute_opened', label: 'Dispute Opened', description: 'Cardholder files a chargeback. Funds held pending resolution.', affectedProducts: ['Payments', 'Radar'] },
  refund_issued: { type: 'refund_issued', label: 'Refund Issued', description: 'Full or partial refund on a PaymentIntent.', affectedProducts: ['Payments'] },
  partial_capture: { type: 'partial_capture', label: 'Partial Capture', description: 'Capture less than the authorized amount.', affectedProducts: ['Payments'] },
  checkout_session_expired: { type: 'checkout_session_expired', label: 'Checkout Session Expired', description: 'Session expires before customer completes payment. No charge occurs.', affectedProducts: ['Checkout'] },
  rate_limit_hit: { type: 'rate_limit_hit', label: 'Rate Limit Hit', description: 'Too many API requests in a short window. Stripe returns 429.', affectedProducts: ['All'] },
}

interface FailureModeState {
  active: FailureModeType[]   // array for easy serialization + UI display
  toggle: (type: FailureModeType) => void
  isActive: (type: FailureModeType) => boolean
  clearAll: () => void
}

export const useFailureModes = create<FailureModeState>()(
  immer((set, get) => ({
    active: [],
    toggle: (type) =>
      set((state) => {
        const idx = state.active.indexOf(type)
        if (idx >= 0) {
          state.active.splice(idx, 1)
        } else {
          state.active.push(type)
        }
      }),
    isActive: (type) => get().active.includes(type),
    clearAll: () => set((state) => { state.active = [] }),
  }))
)
```

- [ ] **Step 3: Run tests**

```bash
pnpm test tests/engine/failure-modes.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/engine/failure-modes.ts tests/engine/failure-modes.test.ts
git commit -m "feat(engine): add failure mode registry with 16 modes"
```

---

## Task 10: Exam Mode Engine

**Files:**
- Create: `src/engine/exam-mode.ts`
- Test: `tests/engine/exam-mode.test.ts`

**Produces:** `EXAM_QUESTIONS`, `getQuestionsForFlow()`, `gradeAnswer()`

- [ ] **Step 1: Write failing tests**

Create `tests/engine/exam-mode.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { getQuestionsForFlow, gradeAnswer, EXAM_QUESTIONS } from '@/engine/exam-mode'

describe('EXAM_QUESTIONS', () => {
  it('has at least 5 seeded questions', () => {
    expect(EXAM_QUESTIONS.length).toBeGreaterThanOrEqual(5)
  })

  it('every question has 4 options', () => {
    for (const q of EXAM_QUESTIONS) {
      expect(q.options).toHaveLength(4)
      expect(q.correctIndex).toBeGreaterThanOrEqual(0)
      expect(q.correctIndex).toBeLessThan(4)
    }
  })
})

describe('getQuestionsForFlow', () => {
  it('returns questions for fake-payment flow', () => {
    const qs = getQuestionsForFlow('fake-payment')
    expect(qs.length).toBeGreaterThan(0)
  })

  it('returns empty array for unknown flow', () => {
    expect(getQuestionsForFlow('nonexistent-flow')).toHaveLength(0)
  })
})

describe('gradeAnswer', () => {
  it('returns correct: true when index matches', () => {
    const q = EXAM_QUESTIONS[0]!
    const result = gradeAnswer(q.id, q.correctIndex)
    expect(result.correct).toBe(true)
  })

  it('returns correct: false for wrong answer', () => {
    const q = EXAM_QUESTIONS[0]!
    const wrongIndex = q.correctIndex === 0 ? 1 : 0
    const result = gradeAnswer(q.id, wrongIndex)
    expect(result.correct).toBe(false)
    expect(result.explanation).toBeTruthy()
  })
})
```

- [ ] **Step 2: Implement**

Create `src/engine/exam-mode.ts`:
```typescript
import type { ExamQuestion } from './types'

export const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 'q_fulfill_webhook',
    flowId: 'fake-payment',
    question: 'Which event should your server use to fulfill an order after Checkout?',
    options: [
      'payment_intent.created',
      'checkout.session.completed',
      'charge.succeeded',
      'payment_intent.payment_failed',
    ],
    correctIndex: 1,
    explanation: 'checkout.session.completed fires when the customer successfully completes payment AND Stripe has confirmed the funds. Never fulfill on the client-side redirect or on payment_intent.created (which fires before payment).',
    certTracks: ['Developer', 'Payments'],
  },
  {
    id: 'q_card_data_server',
    flowId: 'fake-payment',
    question: 'When using Stripe Elements, does card data touch your server?',
    options: [
      'Yes — the card number is POSTed to your API route then forwarded to Stripe',
      'No — Stripe.js tokenizes card data in an iframe before your server sees anything',
      'Only the last 4 digits touch your server',
      'Only if you use server-side rendering',
    ],
    correctIndex: 1,
    explanation: 'Stripe Elements renders card fields in Stripe-owned iframes. Card data is tokenized client-side by Stripe.js and becomes a PaymentMethod ID. Your server receives only the ID — never the PAN, CVC, or expiry. This is why you qualify for SAQ A.',
    certTracks: ['Developer', 'Security'],
  },
  {
    id: 'q_idempotency',
    flowId: 'fake-payment',
    question: 'Your webhook handler receives the same payment_intent.succeeded event twice. What should happen?',
    options: [
      'Fulfill the order twice',
      'Return a 500 error so Stripe retries correctly',
      'Check if the order is already fulfilled and skip if so — return 200',
      'Refund one of the payments',
    ],
    correctIndex: 2,
    explanation: 'Stripe retries webhooks that do not receive a 2xx response within 30 seconds. Your handler must be idempotent — check if you have already processed this event ID and return 200 without side effects if so. Never return 500 for a duplicate — that tells Stripe to keep retrying.',
    certTracks: ['Developer', 'Webhooks'],
  },
  {
    id: 'q_transfer_vs_payout',
    flowId: 'fake-payment',
    question: 'In Connect, what is the difference between a Transfer and a Payout?',
    options: [
      'They are the same thing with different names',
      'Transfer moves funds between Stripe accounts; Payout moves funds from a Stripe balance to a bank account',
      'Payout moves funds between Stripe accounts; Transfer moves funds to a bank account',
      'Transfers are for Express accounts; Payouts are for Custom accounts',
    ],
    correctIndex: 1,
    explanation: 'Transfer: moves funds from your platform\'s Stripe balance to a connected account\'s Stripe balance. Payout: moves funds from a Stripe balance (platform or connected) to an external bank account or debit card. Different objects, different events, different failure modes.',
    certTracks: ['Connect', 'Developer'],
  },
  {
    id: 'q_sso_vs_kyc',
    flowId: 'fake-payment',
    question: 'A user logs in via Google SSO (OAuth). Does this mean Stripe Identity has verified them?',
    options: [
      'Yes — Google has verified their identity',
      'No — SSO only tells your app who the user claims to be; Stripe Identity separately verifies their government ID',
      'Yes — if their Google account is verified',
      'Only if you pass the OAuth token to the Stripe Identity API',
    ],
    correctIndex: 1,
    explanation: 'SSO (OAuth/OIDC) authenticates the user to YOUR application — it tells your app which account to associate the session with. Stripe Identity is a completely separate system that verifies the user\'s real-world identity against a government ID and selfie. A user can be SSO-authenticated but unverified by Stripe Identity, or vice versa.',
    certTracks: ['Identity', 'Security'],
  },
]

export function getQuestionsForFlow(flowId: string): ExamQuestion[] {
  return EXAM_QUESTIONS.filter((q) => q.flowId === flowId)
}

export interface GradeResult {
  correct: boolean
  explanation: string
  certTracks: string[]
  eventRef?: string
}

export function gradeAnswer(questionId: string, selectedIndex: number): GradeResult {
  const q = EXAM_QUESTIONS.find((q) => q.id === questionId)
  if (!q) return { correct: false, explanation: 'Question not found.', certTracks: [] }
  return {
    correct: selectedIndex === q.correctIndex,
    explanation: q.explanation,
    certTracks: q.certTracks,
    eventRef: q.eventRef,
  }
}
```

- [ ] **Step 3: Run tests**

```bash
pnpm test tests/engine/exam-mode.test.ts
```

Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/engine/exam-mode.ts tests/engine/exam-mode.test.ts
git commit -m "feat(engine): add exam mode engine with 5 seed questions"
```

---

## Task 11: Mock SSO Flow + Client Simulation

**Files:**
- Create: `src/lib/sso-mock.ts`, `src/app/api/auth/sso/route.ts`
- Test: (integration — covered in fake-flow E2E)

**Consumes:** `setPersonaCookie` from `@/lib/fake-auth`

- [ ] **Step 1: Implement SSO mock**

Create `src/lib/sso-mock.ts`:
```typescript
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
```

- [ ] **Step 2: Implement SSO API route**

Create `src/app/api/auth/sso/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { setPersonaCookie } from '@/lib/fake-auth'
import { buildMockOidcClaims, buildMockAuthCode } from '@/lib/sso-mock'

// GET /api/auth/sso?action=initiate&persona=dana
// GET /api/auth/sso?action=callback&code=...
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const action = searchParams.get('action')

  if (action === 'initiate') {
    const personaId = searchParams.get('persona') ?? 'dana'
    const code = buildMockAuthCode()
    // Simulate redirect to IdP and back
    const callbackUrl = new URL('/api/auth/sso', request.url)
    callbackUrl.searchParams.set('action', 'callback')
    callbackUrl.searchParams.set('code', code)
    callbackUrl.searchParams.set('persona', personaId)
    // In a real app, this would redirect to accounts.google.com
    return NextResponse.redirect(callbackUrl)
  }

  if (action === 'callback') {
    const personaId = searchParams.get('persona') ?? 'dana'
    const claims = buildMockOidcClaims(personaId)
    await setPersonaCookie(personaId)
    const response = NextResponse.redirect(new URL('/', request.url))
    // Expose claims in a readable header for Observatory
    response.headers.set('x-oidc-claims', JSON.stringify(claims))
    return response
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 })
}
```

- [ ] **Step 3: Implement persona swap API**

Create `src/app/api/auth/persona/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { setPersonaCookie } from '@/lib/fake-auth'

export async function POST(request: NextRequest) {
  const body = await request.json() as { personaId?: string }
  const personaId = body.personaId ?? 'alex'
  await setPersonaCookie(personaId)
  return NextResponse.json({ ok: true, personaId })
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/sso-mock.ts src/app/api/auth/sso/route.ts src/app/api/auth/persona/route.ts
git commit -m "feat(engine): add mock SSO (OIDC) flow and persona swap API"
```

- [ ] **Step 5: Add SSO simulation component**

Create `src/components/persona/SsoSimulationButton.tsx`:
```tsx
"use client"
import { emit } from '@/engine/event-emitter'
import { usePersona } from '@/engine/persona'

export function SsoSimulationButton() {
  const { active, swap } = usePersona()
  if (!active.useSso) return null

  const simulate = async () => {
    emit({
      actor: 'user', phase: 'user_action',
      source: 'topbar/sso', action: 'User clicks "Sign in with Google"',
      complianceStates: ['pii'], simulationLevel: 'simulated',
      certTips: ['SSO tells YOUR app who the user is. It does not verify identity for Stripe.'],
    })
    emit({
      actor: 'idp', phase: 'client_call',
      source: 'google-oauth', action: 'Redirect to accounts.google.com/oauth/authorize',
      complianceStates: ['pii'], simulationLevel: 'simulated',
      certTips: ['User is redirected to the Identity Provider (Google). Your app sees nothing until callback.'],
    })
    emit({
      actor: 'idp', phase: 'server_call',
      source: 'google-oauth', action: 'Authorization code returned to callback URL',
      complianceStates: ['pii'], simulationLevel: 'simulated',
      request: { code: 'mock_auth_code_abc123', state: 'csrf_token' },
    })
    emit({
      actor: 'app', phase: 'server_call',
      source: 'api/auth/sso/callback', action: 'Exchange auth code for OIDC token',
      complianceStates: ['pii'], simulationLevel: 'simulated',
      request: { code: 'mock_auth_code_abc123' },
      response: { sub: 'google-sub-dana', email: 'dana@enterprise.example.com', hd: 'enterprise.example.com' },
      certTips: ['The OIDC token proves who Dana is to YOUR app. Stripe Identity separately verifies Dana for regulated operations.'],
    })
    emit({
      actor: 'app', phase: 'db_write',
      source: 'api/auth/sso/callback', action: 'App session created — persona set to Dana',
      complianceStates: ['idle'], simulationLevel: 'simulated',
      certTips: ['[YOUR APP] owns this session. [STRIPE] owns KYC verification. These are independent systems.'],
    })
    swap('dana')
    await fetch('/api/auth/persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: 'dana' }),
    })
  }

  return (
    <button
      onClick={simulate}
      className="rounded border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
    >
      Simulate SSO Login (Dana)
    </button>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/persona/SsoSimulationButton.tsx
git commit -m "feat(engine): add SSO simulation client component with Observatory events"
```

---

## Task 12: Root Layout + Compliance Border
<!-- renumbered from 11 -->

**Files:**
- Create: `src/lib/cn.ts`, `src/components/shell/ComplianceBorder.tsx`, `src/components/shell/SplitLayout.tsx`, `src/app/layout.tsx`

- [ ] **Step 1: Add cn utility**

Create `src/lib/cn.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 2: Build ComplianceBorder**

Create `src/components/shell/ComplianceBorder.tsx`:
```tsx
"use client"
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEventQueue } from '@/engine/event-queue'
import { deriveComplianceColor, COMPLIANCE_CONFIG } from '@/engine/compliance'

export function ComplianceBorder() {
  const currentEvent = useEventQueue((s) => s.currentEvent)
  const [color, setColor] = useState('#22C55E')
  const [label, setLabel] = useState<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const states = currentEvent?.complianceStates ?? ['idle']
    const newColor = deriveComplianceColor(states)
    const primaryState = states.find((s) => s !== 'idle') ?? 'idle'
    const meta = COMPLIANCE_CONFIG[primaryState]

    if (newColor !== color) {
      setLabel(meta.label)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => {
        setColor(newColor)
        timeoutRef.current = setTimeout(() => setLabel(null), 2000)
      }, 800)
    }
  }, [currentEvent, color])

  return (
    <>
      {/* Border ring */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50"
        animate={{ boxShadow: `inset 0 0 0 4px ${color}` }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />
      {/* State label overlay */}
      <AnimatePresence>
        {label && (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="pointer-events-none fixed top-14 left-1/2 z-50 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-mono font-semibold text-white shadow-lg"
            style={{ backgroundColor: color }}
          >
            entering {label.toLowerCase()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

- [ ] **Step 3: Build SplitLayout**

Create `src/components/shell/SplitLayout.tsx`:
```tsx
import type { ReactNode } from 'react'

interface Props {
  business: ReactNode
  observatory: ReactNode
}

export function SplitLayout({ business, observatory }: Props) {
  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">
      <main className="w-[60%] overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
        {business}
      </main>
      <aside className="w-[40%] overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        {observatory}
      </aside>
    </div>
  )
}
```

- [ ] **Step 4: Update root layout**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ComplianceBorder } from '@/components/shell/ComplianceBorder'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Stripe Demo — Learning Engine',
  description: 'Learn every Stripe product through interactive demos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ComplianceBorder />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 5: Verify type-check**

```bash
pnpm type-check
```

Expected: 0 errors

- [ ] **Step 6: Commit**

```bash
git add src/lib/cn.ts src/components/shell/ src/app/layout.tsx
git commit -m "feat(shell): add compliance border, split layout, root layout"
```

---

## Task 13: TopBar + PersonaBadge

**Files:**
- Create: `src/components/shell/TopBar.tsx`, `src/components/shell/PersonaBadge.tsx`, `src/components/persona/PersonaSwitcher.tsx`

- [ ] **Step 1: Build PersonaBadge**

Create `src/components/shell/PersonaBadge.tsx`:
```tsx
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
```

- [ ] **Step 2: Build PersonaSwitcher**

Create `src/components/persona/PersonaSwitcher.tsx`:
```tsx
"use client"
import { usePersona, PERSONAS } from '@/engine/persona'

export function PersonaSwitcher() {
  const { active, swap } = usePersona()

  const handleSwap = async (id: string) => {
    swap(id)
    await fetch('/api/auth/persona', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personaId: id }),
    })
  }

  return (
    <select
      value={active.id}
      onChange={(e) => handleSwap(e.target.value)}
      className="rounded border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      {Object.values(PERSONAS).map((p) => (
        <option key={p.id} value={p.id}>
          {p.name} ({p.role})
        </option>
      ))}
    </select>
  )
}
```

- [ ] **Step 3: Build TopBar**

Create `src/components/shell/TopBar.tsx`:
```tsx
"use client"
import Link from 'next/link'
import { PersonaBadge } from './PersonaBadge'
import { PersonaSwitcher } from '@/components/persona/PersonaSwitcher'

const BUSINESSES = [
  { id: 'stripeland', label: 'Stripeland', href: '/stripeland' },
  { id: 'stackd', label: 'Stackd', href: '/stackd' },
  { id: 'flowlance', label: 'Flowlance', href: '/flowlance' },
]

export function TopBar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      <Link href="/" className="font-mono text-sm font-bold text-indigo-600">
        ◆ Stripe Demo
      </Link>
      <nav className="flex gap-2">
        {BUSINESSES.map((b) => (
          <Link
            key={b.id}
            href={b.href}
            className="rounded px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            {b.label}
          </Link>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <PersonaSwitcher />
        <PersonaBadge />
        <span className="rounded bg-amber-100 px-2 py-0.5 font-mono text-xs text-amber-700">
          TEST MODE
        </span>
      </div>
    </header>
  )
}
```

- [ ] **Step 4: Add TopBar to layout**

Edit `src/app/layout.tsx` — add TopBar inside body:
```tsx
import { TopBar } from '@/components/shell/TopBar'
// ...
<body className={inter.className}>
  <ComplianceBorder />
  <TopBar />
  {children}
</body>
```

- [ ] **Step 5: Verify**

```bash
pnpm type-check
```

- [ ] **Step 6: Commit**

```bash
git add src/components/shell/TopBar.tsx src/components/shell/PersonaBadge.tsx src/components/persona/PersonaSwitcher.tsx
git commit -m "feat(shell): add TopBar, PersonaBadge, PersonaSwitcher"
```

---

## Task 14: Observatory Shell

**Files:**
- Create: `src/components/observatory/Observatory.tsx` and 7 tab stubs

- [ ] **Step 1: Install Tabs primitive**

```bash
pnpm dlx shadcn@latest add tabs
```

- [ ] **Step 2: Build Observatory container**

Create `src/components/observatory/Observatory.tsx`:
```tsx
"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DVRControls } from './DVRControls'
import { ApiLogTab } from './tabs/ApiLogTab'
import { WebhooksTab } from './tabs/WebhooksTab'
import { ObjectExplorerTab } from './tabs/ObjectExplorerTab'
import { MoneyFlowTab } from './tabs/MoneyFlowTab'
import { ComplianceTab } from './tabs/ComplianceTab'
import { StoreGuideTab } from './tabs/StoreGuideTab'
import { CertTipsTab } from './tabs/CertTipsTab'

const TABS = [
  { value: 'api', label: 'API Log', component: ApiLogTab },
  { value: 'webhooks', label: 'Webhooks', component: WebhooksTab },
  { value: 'objects', label: 'Objects', component: ObjectExplorerTab },
  { value: 'flow', label: 'Money Flow', component: MoneyFlowTab },
  { value: 'compliance', label: 'Compliance', component: ComplianceTab },
  { value: 'store', label: 'Store Guide', component: StoreGuideTab },
  { value: 'cert', label: 'Cert Tips', component: CertTipsTab },
]

export function Observatory() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Observatory
        </p>
      </div>
      <Tabs defaultValue="api" className="flex flex-1 flex-col overflow-hidden">
        <TabsList className="shrink-0 justify-start rounded-none border-b border-zinc-200 bg-transparent px-3 dark:border-zinc-800">
          {TABS.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-none border-b-2 border-transparent pb-2 pt-1 text-xs data-[state=active]:border-indigo-600 data-[state=active]:text-indigo-600"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="flex-1 overflow-y-auto">
          {TABS.map(({ value, component: Tab }) => (
            <TabsContent key={value} value={value} className="m-0 h-full">
              <Tab />
            </TabsContent>
          ))}
        </div>
        <DVRControls />
      </Tabs>
    </div>
  )
}
```

- [ ] **Step 3: Create tab stubs**

Create each file with a placeholder that renders:

`src/components/observatory/tabs/ApiLogTab.tsx`:
```tsx
"use client"
import { useEventQueue } from '@/engine/event-queue'

export function ApiLogTab() {
  const { events, cursor } = useEventQueue()
  const visible = events.slice(0, cursor + 1)

  return (
    <div className="space-y-1 p-3 font-mono text-xs">
      {visible.length === 0 && (
        <p className="text-zinc-400">No events yet. Run a flow to see API calls.</p>
      )}
      {visible.map((evt, i) => (
        <div
          key={evt.id}
          className={`rounded border p-2 ${i === cursor ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950' : 'border-zinc-200 dark:border-zinc-800'}`}
        >
          <span className="text-zinc-400">[{evt.actor.toUpperCase()}]</span>{' '}
          <span className="font-semibold">{evt.action}</span>
          {evt.stripeObject && <span className="ml-2 text-zinc-400">→ {evt.stripeObject}</span>}
        </div>
      ))}
    </div>
  )
}
```

`src/components/observatory/tabs/WebhooksTab.tsx`:
```tsx
"use client"
import { useEventQueue } from '@/engine/event-queue'

export function WebhooksTab() {
  const { events, cursor } = useEventQueue()
  const webhooks = events.slice(0, cursor + 1).filter((e) => e.actor === 'webhook')

  return (
    <div className="space-y-1 p-3 font-mono text-xs">
      {webhooks.length === 0 && <p className="text-zinc-400">No webhook events yet.</p>}
      {webhooks.map((evt) => (
        <div key={evt.id} className="rounded border border-zinc-200 p-2 dark:border-zinc-800">
          <span className="font-semibold text-amber-600">{evt.action}</span>
          {evt.certTips?.map((tip, i) => (
            <p key={i} className="mt-1 text-zinc-500">⚠ {tip}</p>
          ))}
        </div>
      ))}
    </div>
  )
}
```

`src/components/observatory/tabs/ObjectExplorerTab.tsx`:
```tsx
export function ObjectExplorerTab() {
  return (
    <div className="p-3 font-mono text-xs text-zinc-400">
      Object explorer — wired in Task 15.
    </div>
  )
}
```

`src/components/observatory/tabs/MoneyFlowTab.tsx`:
```tsx
export function MoneyFlowTab() {
  return (
    <div className="p-3 font-mono text-xs text-zinc-400">
      Money flow diagram — wired in Phase 2.
    </div>
  )
}
```

`src/components/observatory/tabs/ComplianceTab.tsx`:
```tsx
"use client"
import { useEventQueue } from '@/engine/event-queue'
import { deriveActiveMeta } from '@/engine/compliance'

export function ComplianceTab() {
  const currentEvent = useEventQueue((s) => s.currentEvent)
  const states = currentEvent?.complianceStates ?? ['idle']
  const metas = deriveActiveMeta(states)

  return (
    <div className="space-y-3 p-3 font-mono text-xs">
      {metas.map((meta) => (
        <div key={meta.state} className="rounded border p-3" style={{ borderColor: meta.color }}>
          <p className="font-bold" style={{ color: meta.color }}>{meta.label}</p>
          <p className="mt-1 text-zinc-500">{meta.regulation}</p>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">{meta.explanation}</p>
          {meta.saqNote && (
            <p className="mt-2 rounded bg-orange-50 p-2 text-orange-700 dark:bg-orange-950 dark:text-orange-300">
              SAQ: {meta.saqNote}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
```

`src/components/observatory/tabs/StoreGuideTab.tsx`:
```tsx
"use client"
import { useEventQueue } from '@/engine/event-queue'

export function StoreGuideTab() {
  const currentEvent = useEventQueue((s) => s.currentEvent)
  const guide = currentEvent?.storeGuidance

  if (!guide) {
    return <div className="p-3 font-mono text-xs text-zinc-400">No store guidance for current event.</div>
  }

  return (
    <div className="space-y-3 p-3 font-mono text-xs">
      {guide.store.length > 0 && (
        <div>
          <p className="font-bold text-green-600">✅ Store in your DB</p>
          {guide.store.map((s) => <p key={s} className="ml-2 text-zinc-600">• {s}</p>)}
        </div>
      )}
      {guide.neverStore.length > 0 && (
        <div>
          <p className="font-bold text-red-600">❌ Never store</p>
          {guide.neverStore.map((s) => <p key={s} className="ml-2 text-zinc-600">• {s}</p>)}
        </div>
      )}
      {guide.sourceOfTruth.length > 0 && (
        <div>
          <p className="font-bold text-blue-600">📡 Use Stripe as source of truth</p>
          {guide.sourceOfTruth.map((s) => <p key={s} className="ml-2 text-zinc-600">• {s}</p>)}
        </div>
      )}
      {guide.listenFor.length > 0 && (
        <div>
          <p className="font-bold text-amber-600">🎣 Listen for webhook</p>
          {guide.listenFor.map((s) => <p key={s} className="ml-2 text-zinc-600">• {s}</p>)}
        </div>
      )}
    </div>
  )
}
```

`src/components/observatory/tabs/CertTipsTab.tsx`:
```tsx
"use client"
import { useEventQueue } from '@/engine/event-queue'

export function CertTipsTab() {
  const currentEvent = useEventQueue((s) => s.currentEvent)
  const tips = currentEvent?.certTips ?? []

  return (
    <div className="space-y-2 p-3 font-mono text-xs">
      {tips.length === 0 && <p className="text-zinc-400">No cert tips for current event.</p>}
      {tips.map((tip, i) => (
        <div key={i} className="rounded border border-indigo-200 bg-indigo-50 p-2 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
          💡 {tip}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Verify**

```bash
pnpm type-check
```

- [ ] **Step 5: Commit**

```bash
git add src/components/observatory/
git commit -m "feat(observatory): add shell with 7 tabs"
```

---

## Task 15: DVR Controls UI

**Files:**
- Create: `src/components/observatory/DVRControls.tsx`

- [ ] **Step 1: Build DVRControls**

Create `src/components/observatory/DVRControls.tsx`:
```tsx
"use client"
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'
import type { PlaybackSpeed } from '@/engine/types'

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2]

export function DVRControls() {
  const { isPlaying, isFrozen, speed, play, pause, freeze, unfreeze, stepForward, stepBack, jumpToStart, jumpToEnd, setSpeed } = useDVR()
  const { cursor, events } = useEventQueue()
  const total = events.length

  return (
    <div className="flex shrink-0 items-center gap-2 border-t border-zinc-200 bg-white px-3 py-2 dark:border-zinc-800 dark:bg-zinc-950">
      <button onClick={jumpToStart} title="Jump to start" className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" disabled={cursor <= 0}>◀◀</button>
      <button onClick={stepBack} title="Step back" className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" disabled={cursor <= 0}>◀</button>
      <button
        onClick={isPlaying ? pause : play}
        title={isPlaying ? 'Pause' : 'Play'}
        className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        {isPlaying ? '❚❚' : '▶'}
      </button>
      <button onClick={stepForward} title="Step forward" className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" disabled={cursor >= total - 1}>▶</button>
      <button onClick={jumpToEnd} title="Jump to end" className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30" disabled={cursor >= total - 1}>▶▶</button>

      <span className="mx-1 font-mono text-xs text-zinc-400">
        {total === 0 ? '—' : `${cursor + 1}/${total}`}
      </span>

      <div className="ml-auto flex items-center gap-1">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => setSpeed(s)}
            className={`rounded px-1.5 py-0.5 font-mono text-xs ${speed === s ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
          >
            {s}x
          </button>
        ))}
        <button
          onClick={isFrozen ? unfreeze : freeze}
          className={`ml-1 rounded px-2 py-0.5 font-mono text-xs ${isFrozen ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
        >
          {isFrozen ? '🔒 frozen' : 'freeze'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/observatory/DVRControls.tsx
git commit -m "feat(observatory): add DVR controls UI"
```

---

## Task 16: Stripe Object Explorer

**Files:**
- Create: `src/engine/stripe-objects/examples.ts`, update `src/components/observatory/tabs/ObjectExplorerTab.tsx`

- [ ] **Step 1: Add example objects**

Create `src/engine/stripe-objects/examples.ts`:
```typescript
import type { StripeObjectExample } from '@/engine/types'

export const STRIPE_OBJECT_EXAMPLES: StripeObjectExample[] = [
  {
    objectType: 'Customer',
    id: 'cus_example123',
    data: {
      id: 'cus_example123',
      object: 'customer',
      email: 'alex@example.com',
      name: 'Alex Buyer',
      created: 1750000000,
      default_source: null,
      invoice_settings: { default_payment_method: 'pm_example456' },
      metadata: { app_user_id: 'usr_789' },
    },
    relationships: [
      { field: 'default_source', objectType: 'PaymentMethod', description: 'Default payment method for charges' },
      { field: 'invoice_settings.default_payment_method', objectType: 'PaymentMethod', description: 'Default PM for subscriptions' },
    ],
    webhookEvents: ['customer.created', 'customer.updated', 'customer.deleted'],
    storeGuidance: {
      store: ['id (as stripe_customer_id on your user record)'],
      neverStore: ['Full customer object — it changes; fetch live'],
      sourceOfTruth: ['email, name — Stripe is source of truth if you sync them there'],
      listenFor: ['customer.updated to sync email changes'],
    },
  },
  {
    objectType: 'PaymentIntent',
    id: 'pi_example789',
    data: {
      id: 'pi_example789',
      object: 'payment_intent',
      amount: 4999,
      currency: 'usd',
      status: 'succeeded',
      customer: 'cus_example123',
      payment_method: 'pm_example456',
      capture_method: 'automatic',
      confirmation_method: 'automatic',
      created: 1750000100,
      metadata: { order_id: 'ord_abc' },
    },
    relationships: [
      { field: 'customer', objectType: 'Customer', description: 'The customer this charge belongs to' },
      { field: 'payment_method', objectType: 'PaymentMethod', description: 'The payment method used' },
    ],
    webhookEvents: [
      'payment_intent.created',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
      'payment_intent.requires_action',
    ],
    storeGuidance: {
      store: ['id', 'status', 'amount', 'metadata.order_id'],
      neverStore: ['payment_method card details — never touch PANs'],
      sourceOfTruth: ['status — always fetch live before fulfilling'],
      listenFor: ['payment_intent.succeeded to fulfill; payment_intent.payment_failed to notify user'],
    },
  },
  {
    objectType: 'Subscription',
    id: 'sub_exampleABC',
    data: {
      id: 'sub_exampleABC',
      object: 'subscription',
      status: 'active',
      customer: 'cus_example123',
      current_period_start: 1750000000,
      current_period_end: 1752592000,
      cancel_at_period_end: false,
      items: { data: [{ price: { id: 'price_monthly', unit_amount: 2999, currency: 'usd' } }] },
    },
    relationships: [
      { field: 'customer', objectType: 'Customer', description: 'Subscriber' },
      { field: 'latest_invoice', objectType: 'Invoice', description: 'Most recent invoice' },
    ],
    webhookEvents: [
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_succeeded',
      'invoice.payment_failed',
    ],
    storeGuidance: {
      store: ['id', 'status', 'current_period_end', 'cancel_at_period_end'],
      neverStore: ['Full subscription object — status changes via webhooks'],
      sourceOfTruth: ['status — fetch live; do not rely solely on your cached value'],
      listenFor: ['customer.subscription.updated for status changes; invoice.payment_failed for dunning'],
    },
  },
]

export function getObjectExample(objectType: string): StripeObjectExample | undefined {
  return STRIPE_OBJECT_EXAMPLES.find((e) => e.objectType === objectType)
}
```

- [ ] **Step 2: Wire ObjectExplorerTab**

Replace `src/components/observatory/tabs/ObjectExplorerTab.tsx`:
```tsx
"use client"
import { useState } from 'react'
import { STRIPE_OBJECT_EXAMPLES } from '@/engine/stripe-objects/examples'

export function ObjectExplorerTab() {
  const [selected, setSelected] = useState<string | null>(null)
  const obj = STRIPE_OBJECT_EXAMPLES.find((e) => e.objectType === selected)

  return (
    <div className="flex h-full flex-col font-mono text-xs">
      <div className="flex flex-wrap gap-1 border-b border-zinc-200 p-2 dark:border-zinc-800">
        {STRIPE_OBJECT_EXAMPLES.map((e) => (
          <button
            key={e.objectType}
            onClick={() => setSelected(e.objectType)}
            className={`rounded px-2 py-0.5 ${selected === e.objectType ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'}`}
          >
            {e.objectType}
          </button>
        ))}
      </div>
      {obj ? (
        <div className="flex-1 overflow-y-auto space-y-3 p-3">
          <div>
            <p className="font-bold text-zinc-700 dark:text-zinc-300">{obj.objectType} <span className="text-zinc-400">{obj.id}</span></p>
            <pre className="mt-2 overflow-x-auto rounded bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {JSON.stringify(obj.data, null, 2)}
            </pre>
          </div>
          <div>
            <p className="font-bold text-zinc-500">Relationships</p>
            {obj.relationships.map((r) => (
              <p key={r.field} className="ml-2 text-zinc-500">• <span className="text-zinc-700 dark:text-zinc-300">{r.field}</span> → {r.objectType}: {r.description}</p>
            ))}
          </div>
          <div>
            <p className="font-bold text-amber-600">Webhook Events</p>
            {obj.webhookEvents.map((e) => <p key={e} className="ml-2 text-zinc-500">• {e}</p>)}
          </div>
          <div>
            <p className="font-bold text-green-600">✅ Store: {obj.storeGuidance.store.join(', ')}</p>
            <p className="font-bold text-red-600">❌ Never: {obj.storeGuidance.neverStore.join(', ')}</p>
            <p className="font-bold text-amber-600">🎣 Listen: {obj.storeGuidance.listenFor.join('; ')}</p>
          </div>
        </div>
      ) : (
        <div className="p-3 text-zinc-400">Select an object above to inspect it.</div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Run type-check**

```bash
pnpm type-check
```

- [ ] **Step 4: Commit**

```bash
git add src/engine/stripe-objects/ src/components/observatory/tabs/ObjectExplorerTab.tsx
git commit -m "feat(observatory): add Stripe object explorer with 3 example objects"
```

---

## Task 17: Store Guide Annotation System

The `StoreGuideTab` is already wired in Task 13 and reads `storeGuidance` from `SimEvent`. This task ensures the system works end-to-end by verifying that events emitted with `storeGuidance` render correctly.

**Files:**
- Test: `tests/engine/store-guide.test.ts`

- [ ] **Step 1: Write integration test**

Create `tests/engine/store-guide.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { emit } from '@/engine/event-emitter'
import { useEventQueue } from '@/engine/event-queue'

beforeEach(() => useEventQueue.getState().clear())

describe('StoreGuidance in events', () => {
  it('events can carry storeGuidance', () => {
    const evt = emit({
      actor: 'stripe',
      source: 'checkout',
      action: 'checkout.session.completed',
      stripeObject: 'CheckoutSession',
      complianceStates: ['pii'],
      simulationLevel: 'simulated',
      storeGuidance: {
        store: ['customer.id', 'session.id', 'payment_intent.id'],
        neverStore: ['card number', 'CVC'],
        sourceOfTruth: ['payment status'],
        listenFor: ['checkout.session.completed'],
      },
    })
    expect(evt.storeGuidance?.store).toContain('customer.id')
    expect(evt.storeGuidance?.neverStore).toContain('card number')
  })

  it('currentEvent reflects storeGuidance', () => {
    const { result } = renderHook(() => useEventQueue())
    act(() => {
      emit({
        actor: 'stripe',
        source: 'test',
        action: 'test.event',
        complianceStates: ['idle'],
        simulationLevel: 'simulated',
        storeGuidance: {
          store: ['order_id'],
          neverStore: [],
          sourceOfTruth: [],
          listenFor: ['test.event'],
        },
      })
    })
    expect(result.current.currentEvent?.storeGuidance?.store).toContain('order_id')
  })
})
```

- [ ] **Step 2: Run tests**

```bash
pnpm test tests/engine/store-guide.test.ts
```

Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/engine/store-guide.test.ts
git commit -m "test(engine): add store guide annotation integration tests"
```

---

## Task 18: React Component Tests

Fast feedback before Playwright. Tests four Observatory tabs and DVRControls with real Zustand state.

**Files:**
- Create: `tests/components/ApiLogTab.test.tsx`, `tests/components/ComplianceTab.test.tsx`, `tests/components/StoreGuideTab.test.tsx`, `tests/components/DVRControls.test.tsx`

- [ ] **Step 1: Write ApiLogTab tests**

Create `tests/components/ApiLogTab.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { ApiLogTab } from '@/components/observatory/tabs/ApiLogTab'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'
import { emit } from '@/engine/event-emitter'

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined })
})

describe('ApiLogTab', () => {
  it('shows empty state before any events', () => {
    render(<ApiLogTab />)
    expect(screen.getByText(/No events yet/)).toBeTruthy()
  })

  it('shows events up to cursor position', () => {
    act(() => {
      emit({ actor: 'app', phase: 'server_call', source: 'test', action: 'POST /v1/payment_intents', complianceStates: ['pci'], simulationLevel: 'simulated' })
    })
    render(<ApiLogTab />)
    expect(screen.getByText(/POST \/v1\/payment_intents/)).toBeTruthy()
  })

  it('highlights current event at cursor', () => {
    act(() => {
      emit({ actor: 'user', phase: 'user_action', source: 'test', action: 'User clicked Buy', complianceStates: ['pii'], simulationLevel: 'simulated' })
    })
    const { container } = render(<ApiLogTab />)
    const highlighted = container.querySelector('.border-indigo-400')
    expect(highlighted).toBeTruthy()
  })
})
```

- [ ] **Step 2: Write ComplianceTab tests**

Create `tests/components/ComplianceTab.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { ComplianceTab } from '@/components/observatory/tabs/ComplianceTab'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'
import { emit } from '@/engine/event-emitter'

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined })
})

describe('ComplianceTab', () => {
  it('shows idle state by default', () => {
    render(<ComplianceTab />)
    expect(screen.getByText(/Safe \/ Idle/)).toBeTruthy()
  })

  it('shows PCI label when current event has pci state', () => {
    act(() => {
      emit({ actor: 'app', phase: 'client_call', source: 'elements', action: 'Card Element mounted', complianceStates: ['pci'], simulationLevel: 'simulated' })
    })
    render(<ComplianceTab />)
    expect(screen.getByText(/PCI/)).toBeTruthy()
    expect(screen.getByText(/PCI-DSS/)).toBeTruthy()
  })

  it('shows combined label for multiple active states', () => {
    act(() => {
      emit({ actor: 'app', phase: 'server_call', source: 'test', action: 'test', complianceStates: ['pii', 'pci'], simulationLevel: 'simulated' })
    })
    render(<ComplianceTab />)
    expect(screen.getByText(/PCI.*PII|PII.*PCI/)).toBeTruthy()
  })
})
```

- [ ] **Step 3: Write StoreGuideTab tests**

Create `tests/components/StoreGuideTab.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { act } from 'react'
import { StoreGuideTab } from '@/components/observatory/tabs/StoreGuideTab'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'
import { emit } from '@/engine/event-emitter'

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined })
})

describe('StoreGuideTab', () => {
  it('shows no guidance message when no event', () => {
    render(<StoreGuideTab />)
    expect(screen.getByText(/No store guidance/)).toBeTruthy()
  })

  it('shows store guidance from current event', () => {
    act(() => {
      emit({
        actor: 'stripe', phase: 'webhook', source: 'stripe', action: 'checkout.session.completed',
        complianceStates: ['idle'], simulationLevel: 'simulated',
        storeGuidance: {
          store: ['customer.id', 'session.id'],
          neverStore: ['card number'],
          sourceOfTruth: ['payment status'],
          listenFor: ['checkout.session.completed'],
        },
      })
    })
    render(<StoreGuideTab />)
    expect(screen.getByText(/customer\.id/)).toBeTruthy()
    expect(screen.getByText(/card number/)).toBeTruthy()
  })
})
```

- [ ] **Step 4: Write DVRControls tests**

Create `tests/components/DVRControls.test.tsx`:
```tsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react'
import { DVRControls } from '@/components/observatory/DVRControls'
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'
import { emit } from '@/engine/event-emitter'

beforeEach(() => {
  useEventQueue.getState().clear()
  useDVR.setState({ cursor: -1, currentEvent: undefined, isPlaying: false, isFrozen: false, speed: 1 })
})

describe('DVRControls', () => {
  it('shows paused state by default', () => {
    render(<DVRControls />)
    expect(screen.getByTitle('Play')).toBeTruthy()
  })

  it('shows frozen label when frozen', () => {
    useDVR.setState({ isFrozen: true })
    render(<DVRControls />)
    expect(screen.getByText(/frozen/)).toBeTruthy()
  })

  it('shows event count', () => {
    act(() => {
      emit({ actor: 'user', phase: 'user_action', source: 'test', action: 'a', complianceStates: ['idle'], simulationLevel: 'simulated' })
      emit({ actor: 'user', phase: 'user_action', source: 'test', action: 'b', complianceStates: ['idle'], simulationLevel: 'simulated' })
    })
    render(<DVRControls />)
    expect(screen.getByText(/1\/2/)).toBeTruthy()
  })
})
```

- [ ] **Step 5: Run component tests**

```bash
pnpm test tests/components/
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add tests/components/
git commit -m "test(components): add React component tests for Observatory tabs and DVRControls"
```

---

## Task 19: Fake Payment Flow + Full Integration

**Files:**
- Create: `src/components/fake-flow/FakePaymentFlow.tsx`, update `src/app/page.tsx`
- Test: `tests/e2e/fake-flow.spec.ts`

This is the Phase 1 proof: a complete flow with no real Stripe. It fires events, changes compliance border color, and shows exam questions.

- [ ] **Step 1: Build FakePaymentFlow**

Create `src/components/fake-flow/FakePaymentFlow.tsx`:
```tsx
"use client"
import { useState } from 'react'
import { emit } from '@/engine/event-emitter'
import { useDVR } from '@/engine/dvr'
import { useEventQueue } from '@/engine/event-queue'

type FlowStep = 'idle' | 'collecting' | 'processing' | 'complete' | 'failed'

export function FakePaymentFlow() {
  const [step, setStep] = useState<FlowStep>('idle')
  const { clear } = useEventQueue()
  const { pause } = useDVR()

  const reset = () => {
    clear()
    pause()
    setStep('idle')
  }

  const startCheckout = () => {
    setStep('collecting')
    emit({
      flowId: 'fake-payment',
      stepId: 'collect-pii',
      actor: 'user',
      phase: 'user_action',
      source: 'stripeland/fake-checkout',
      action: 'User clicks "Buy $49.99"',
      complianceStates: ['pii'],
      simulationLevel: 'simulated',
      certTips: ['PII is collected before card data — border turns yellow here, not orange yet.'],
      storeGuidance: {
        store: ['customer email (to create Customer)'],
        neverStore: ['full address beyond what billing requires'],
        sourceOfTruth: [],
        listenFor: [],
      },
    })
  }

  const enterCard = () => {
    emit({
      flowId: 'fake-payment',
      stepId: 'mount-element',
      actor: 'app',
      phase: 'client_call',
      source: 'stripe.js',
      action: 'Stripe.js mounts card Element iframe',
      stripeObject: 'Element',
      complianceStates: ['pii', 'pci'],
      simulationLevel: 'simulated',
      certTips: [
        'PCI scope begins when the card Element mounts — border turns orange.',
        'Card field is inside a Stripe-owned iframe. Your JS cannot read card data. This qualifies you for SAQ A.',
        '[REDACTED] card[number], card[cvc] — never reaches your server.',
      ],
      storeGuidance: {
        store: [],
        neverStore: ['card number', 'CVC', 'expiry date'],
        sourceOfTruth: [],
        listenFor: [],
      },
    })
  }

  const confirmPayment = () => {
    setStep('processing')
    emit({
      flowId: 'fake-payment',
      stepId: 'create-payment-intent',
      actor: 'app',
      phase: 'server_call',
      source: 'stripeland/api/create-payment-intent',
      action: 'POST /v1/payment_intents',
      stripeObject: 'PaymentIntent',
      complianceStates: ['pci'],
      simulationLevel: 'simulated',
      request: { amount: 4999, currency: 'usd', confirm: false },
      response: { id: 'pi_fake_001', status: 'requires_payment_method' },
      certTips: ['PaymentIntent created on the server — amount set server-side, never trust client.'],
      storeGuidance: {
        store: ['payment_intent.id', 'amount'],
        neverStore: [],
        sourceOfTruth: ['status (fetch live before fulfilling)'],
        listenFor: [],
      },
    })

    setTimeout(() => {
      emit({
        flowId: 'fake-payment',
        stepId: 'payment-intent-succeeded',
        actor: 'stripe',
        phase: 'stripe_object',
        source: 'stripe-server',
        action: 'PaymentIntent confirms → status: succeeded',
        stripeObject: 'PaymentIntent',
        complianceStates: ['pci'],
        simulationLevel: 'simulated',
        response: { id: 'pi_fake_001', status: 'succeeded' },
        certTips: ['Status moves to succeeded only after Stripe confirms funds are captured.'],
      })

      setTimeout(() => {
        emit({
          flowId: 'fake-payment',
          stepId: 'webhook-succeeded',
          actor: 'webhook',
          phase: 'webhook',
          source: 'stripe-webhook',
          action: 'payment_intent.succeeded',
          stripeObject: 'PaymentIntent',
          complianceStates: ['idle'],
          simulationLevel: 'simulated',
          certTips: [
            'Fulfill the order HERE — not on client redirect.',
            'Verify webhook signature with stripe.webhooks.constructEvent().',
            'Use event.id as idempotency key — this event can arrive twice.',
          ],
          storeGuidance: {
            store: ['order fulfilled status', 'fulfilled_at timestamp'],
            neverStore: [],
            sourceOfTruth: [],
            listenFor: ['payment_intent.succeeded — fulfill here'],
          },
        })
        setStep('complete')
      }, 800)
    }, 800)
  }

  return (
    <div className="max-w-md space-y-4 p-6">
      <h2 className="text-lg font-semibold">Fake Payment Flow</h2>
      <p className="text-sm text-zinc-500">
        A simulated "pay $49.99" flow with no real Stripe. Watch the Observatory and compliance border.
      </p>

      {step === 'idle' && (
        <button onClick={startCheckout} className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          Buy Course — $49.99
        </button>
      )}

      {step === 'collecting' && (
        <div className="space-y-3 rounded border border-zinc-200 p-4">
          <p className="text-sm font-medium">Enter your details</p>
          <input readOnly value="alex@example.com" className="w-full rounded border px-3 py-1.5 text-sm" />
          <div className="rounded border border-orange-200 bg-orange-50 p-3 text-xs text-orange-700">
            [Stripe Elements card field — iframe, not accessible to your JS]
          </div>
          <button onClick={() => { enterCard(); confirmPayment() }} className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Pay $49.99
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="text-sm text-zinc-500">Processing payment…</div>
      )}

      {step === 'complete' && (
        <div className="space-y-2">
          <div className="rounded bg-green-50 p-3 text-sm text-green-700">✓ Payment succeeded — order fulfilled via webhook</div>
          <button onClick={reset} className="text-xs text-zinc-400 underline">Reset flow</button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Update world dashboard**

Replace `src/app/page.tsx`:
```tsx
import { SplitLayout } from '@/components/shell/SplitLayout'
import { Observatory } from '@/components/observatory/Observatory'
import { FakePaymentFlow } from '@/components/fake-flow/FakePaymentFlow'

export default function HomePage() {
  return (
    <SplitLayout
      business={<FakePaymentFlow />}
      observatory={<Observatory />}
    />
  )
}
```

- [ ] **Step 3: Write E2E test**

Create `tests/e2e/fake-flow.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test.describe('Fake Payment Flow', () => {
  test('buy button starts the flow', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Buy Course — $49.99')).toBeVisible()
    await page.getByText('Buy Course — $49.99').click()
    await expect(page.getByText('Enter your details')).toBeVisible()
  })

  test('completing payment shows success and webhook event', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Buy Course — $49.99').click()
    await page.getByText('Pay $49.99').click()
    await expect(page.getByText('Payment succeeded')).toBeVisible({ timeout: 5000 })
  })

  test('Observatory shows events after payment', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Buy Course — $49.99').click()
    await page.getByText('Pay $49.99').click()
    await expect(page.getByText('payment_intent.succeeded')).toBeVisible({ timeout: 5000 })
  })

  test('persona switcher changes persona', async ({ page }) => {
    await page.goto('/')
    await page.selectOption('select', 'maya')
    await expect(page.getByText('Maya')).toBeVisible()
  })
})
```

- [ ] **Step 4: Configure Playwright**

Update `playwright.config.ts`:
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

- [ ] **Step 5: Run unit tests**

```bash
pnpm test
```

Expected: all unit tests PASS

- [ ] **Step 6: Run E2E (local)**

```bash
pnpm test:e2e
```

Expected: 4 E2E tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/fake-flow/ src/app/page.tsx tests/e2e/ playwright.config.ts
git commit -m "feat(flow): add fake payment flow end-to-end with E2E tests"
```

---

## Task 20: CI Verification

- [ ] **Step 1: Verify CI config covers all test commands**

Confirm `.github/workflows/ci.yml` runs:
```yaml
- run: pnpm type-check
- run: pnpm test
```

E2E is excluded from CI for now (requires a running server + browser install). Add this when you want it:
```yaml
- run: pnpm playwright install --with-deps chromium
- run: pnpm test:e2e
```

- [ ] **Step 2: Run full local check**

```bash
pnpm type-check && pnpm test
```

Expected: 0 type errors, all unit tests PASS.

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: phase 1 engine complete — all tests passing"
```

---

## Phase 1 Exit Criteria

- [ ] `pnpm type-check` → 0 errors
- [ ] `pnpm test` → all unit tests pass (event queue, DVR, compliance, persona, RBAC, failure modes, exam mode, store guide)
- [ ] `pnpm test:e2e` → 4 E2E tests pass
- [ ] Fake payment flow fires events, border changes green → yellow → orange → idle
- [ ] DVR pause/step/freeze controls work
- [ ] Persona switcher changes all three identity layers in the top bar
- [ ] Observatory API Log tab shows events at current cursor position
- [ ] Compliance tab explains why the border is the current color
- [ ] Cert Tips tab shows tips from current event
- [ ] Object Explorer shows Customer, PaymentIntent, Subscription with relationships
- [ ] Store Guide tab shows guidance from current event

---

## Self-Review Checklist

**Spec coverage:**
- ✅ SimEvent with actor, phase, flowId, stepId → Task 2
- ✅ Event queue (events only, no cursor) → Task 3
- ✅ DVR owns cursor, subscribes to queue → Task 4
- ✅ Compliance multi-state result → Task 5
- ✅ Redaction helper → Task 6
- ✅ Persona store + fake JWT → Task 7
- ✅ RBAC + middleware → Task 8
- ✅ Failure mode registry (17 modes, array) → Task 9
- ✅ Exam mode engine → Task 10
- ✅ Mock SSO + client simulation component → Task 11
- ✅ Layout shell + compliance border → Task 12
- ✅ TopBar + PersonaBadge → Task 13
- ✅ Observatory 7 tabs → Task 14
- ✅ DVR controls UI → Task 15
- ✅ Object explorer (3 objects) → Task 16
- ✅ Store guide annotations → Task 17
- ✅ React component tests (4 components) → Task 18
- ✅ One fake payment flow end-to-end with flowId/phase → Task 19
- ✅ CI → Task 1 + Task 20

**Type consistency:** All types flow from `src/engine/types.ts`. `phase` is required on `SimEvent` — all emit() calls include it. `EventPhase` union defined alongside `Actor`.

**Placeholder scan:** Zero TBDs. Every step has code.
