# Stripe Demo App — Design Spec
_2026-06-28, revised 2026-06-29_

## Core Architectural Principle

**The Observatory is the product. Stripe demos are modules that feed it.**

Build the simulator engine first. Every Stripe product is a lesson module that plugs into it. This keeps the build incremental and prevents 29 parallel half-finished demos.

---

## The Simulator Engine

The engine has eight components. Every lesson module depends on them. Nothing gets built before the engine exists.

### 1. Standardized Event Shape

Every action in the app — user clicks, API calls, webhook deliveries, state changes — emits one shape:

```ts
interface SimEvent {
  id: string
  timestamp: string
  actor: "user" | "app" | "stripe" | "idp" | "webhook"
  source: string          // e.g. "stripeland/checkout", "stripe/payment_intents"
  action: string          // e.g. "POST /v1/payment_intents", "webhook: payment_intent.succeeded"
  stripeObject?: string   // e.g. "PaymentIntent", "Subscription"
  complianceStates: string[]  // e.g. ["pci", "pii"] — drives border color
  request?: unknown
  response?: unknown
  certTips?: string[]
  storeGuidance?: StoreGuidance
  isFailureMode?: boolean
  failureModeType?: string
  simulationLevel: "real_api" | "real_hosted" | "simulated" | "conceptual"
}
```

### 2. Event Queue / DVR

- All events are queued, not auto-played. Default state: **paused**.
- Controls: ◀◀ (start) ◀ (step back) ❚❚ (pause/play) ▶ (step forward) ▶▶ (end)
- Speed: 0.5x / 1x / 2x
- Freeze: locks entire UI (both business panel and Observatory) at current state indefinitely
- Step delay in play mode: 3 seconds default, configurable per module

### 3. Compliance State Machine

- Derives border color from `complianceStates` array of the current event
- States: `idle` | `pii` | `pci` | `kyc_aml` | `crypto` | `banking`
- When multiple states active: border cycles through all as a gradient
- On state change: holds previous color 3s with overlay label, then transitions

| State | Color | Regulation |
|---|---|---|
| `idle` | `#22C55E` green | — |
| `pii` | `#EAB308` yellow | GDPR / CCPA |
| `pci` | `#F97316` orange | PCI-DSS SAQ A |
| `kyc_aml` | `#3B82F6` blue | BSA / FinCEN |
| `crypto` | `#A855F7` purple | FinCEN MSB rules |
| `banking` | `#EF4444` red | Banking reg / BaaS |

### 4. Persona State Manager

Three completely independent identity layers, always visible in the top bar:

**Layer 1 — App Auth** `[YOUR APP]`
Fake JWT in a cookie. Persona switcher swaps instantly. No real auth provider.

**Layer 2 — App RBAC** `[YOUR APP MIDDLEWARE]`
Roles: `buyer` | `seller` | `freelancer` | `enterprise` | `platform_admin`
Route guards fire server-side.

**Layer 3 — Stripe Identity / KYC** `[STRIPE]`
Orthogonal to login. Authenticated users can be unverified. Observatory labels these separately.

**Layer 4 — SSO / OIDC** `[IDENTITY PROVIDER → YOUR APP]`
Dana (enterprise) logs in via simulated Google Workspace OAuth. Observatory shows the token exchange and explains: SSO tells your app who someone is. KYC tells Stripe who they are. Different systems.

**Pre-seeded Personas:**

| Name | Role | KYC | Connect | Notes |
|---|---|---|---|---|
| Alex | `buyer` | not required | none | Happy path buyer |
| Maya | `seller` | ✓ verified | ✓ express active | Fully onboarded seller |
| Jordan | `seller` | ⏳ pending | ⏳ onboarding | Mid-onboarding |
| Sam | `freelancer` | ✓ verified | ✓ custom active | Full custom Connect account |
| Dana | `enterprise` | not required | none | SSO login, B2B invoicing |
| Billy | `platform_admin` | n/a | platform account | Sees all accounts |

### 5. Stripe Object Explorer

A dedicated Observatory tab. Lets you inspect the live Stripe object graph for the current flow.

Objects exposed:
`Customer` · `PaymentIntent` · `SetupIntent` · `PaymentMethod` · `CheckoutSession` · `Subscription` · `Invoice` · `Price` · `Product` · `Account` · `Transfer` · `Payout` · `BalanceTransaction` · `FinancialAccount` · `IssuingCard` · `Dispute` · `TaxCalculation` · `IdentityVerificationSession`

Purpose: learn Stripe's nouns. Certifications quiz object relationships constantly. For each object, the explorer shows: fields, relationships to other objects, which webhook events reference it, and what your app should store from it.

### 6. "What Should My App Store?" Panel

For every flow, an always-visible annotation panel shows:

| Column | Meaning |
|---|---|
| ✅ Store this | IDs and states your DB needs |
| ❌ Never store this | PCI/PII data that must stay in Stripe |
| 📡 Use Stripe as source of truth | Fetch live instead of caching |
| 🎣 Listen for this webhook | The event that should trigger your side effect |

Example for Checkout flow:
- ✅ `customer.id`, `checkout_session.id`, `payment_intent.id`, `order.id`
- ❌ Card number, CVC, expiry — never touches your server
- 📡 Subscription status — always fetch live from Stripe
- 🎣 Fulfill on `checkout.session.completed`, not on client redirect

### 7. Failure Mode Toggles

Every flow has a failure mode panel. Toggles are per-flow, not global. When a failure mode is active, events are tagged `isFailureMode: true` and Observatory explains what should happen and why.

**Available failure modes:**
- Card declined (generic / insufficient funds / do not honor)
- 3D Secure required
- Webhook delayed (arrives 5 minutes late)
- Webhook duplicated (same event ID delivered twice)
- Webhook out of order (succeeded arrives before created)
- Subscription payment fails → past_due
- Invoice becomes past_due → uncollectible
- Connect account loses capability
- KYC rejected
- Payout failed
- Dispute opened
- Refund issued (full / partial)
- Partial capture
- Checkout Session expired
- Rate limit hit

### 8. Exam Mode

After completing any flow, Exam Mode activates. The app asks 3–5 questions about the flow just run:

- "Which webhook should fulfill this order?"
- "Did card data touch your server?"
- "Which object represents the merchant receiving funds?"
- "Is this a transfer or a payout?"
- "What happens if this webhook fires twice?"
- "What system owns this identity claim?"

User answers, then sees: correct answer, explanation, a link back to the specific event in the timeline that proves it, and which cert track this question belongs to.

---

## Layout Shell

```
┌─────────────────────────────────────────────────────────────┐  ← compliance border (4px animated)
│  [STRIPELAND ▼]  [product view | flow view]  [test mode]   │
│  AUTH: Maya ● session  ROLE: seller  KYC: ✓  CONNECT: ✓   │
├────────────────────────────────┬────────────────────────────┤
│                                │  OBSERVATORY               │
│  BUSINESS UI                   │  ┌──────────────────────┐  │
│                                │  │ Tabs:                │  │
│  (Left: 60%)                   │  │ API Log              │  │
│                                │  │ Webhooks             │  │
│                                │  │ Object Explorer      │  │
│                                │  │ Money Flow           │  │
│                                │  │ Compliance           │  │
│                                │  │ Store Guide          │  │
│                                │  │ Cert Tips            │  │
│                                │  └──────────────────────┘  │
│                                │  ◀◀ ◀ ❚❚ ▶ ▶▶  0.5x 1x 2x │
└────────────────────────────────┴────────────────────────────┘
```

---

## Two Learning Paths

The top nav has two modes:

**Product View** — click "Billing" → see every Billing demo (create subscription, upgrade, dunning, cancel). Organized by Stripe product family. Good for product-specific cert questions.

**Flow View** — click "Freelancer subscribes to Stackd" → see a full business journey end to end. Good for scenario-based cert questions.

Same underlying demos. Two entry points.

---

## Simulation Level Badges

Every demo card and every Observatory event is labeled with one of:

| Badge | Meaning |
|---|---|
| 🟢 Real API demo | Live Stripe test mode API call |
| 🔵 Real hosted Stripe flow | Redirects to Stripe-hosted UI (Checkout, Identity, Connect onboarding, Atlas) |
| 🟡 Simulated with real object model | Uses real Stripe object shapes but mocked responses — for products requiring account approval, dashboard setup, or capabilities not available in basic test mode (Treasury, Issuing, Capital, Data Pipeline, Sigma) |
| ⚪ Conceptual only | Diagram + explanation + real docs link — for Atlas, Managed Payments, Global Payouts edge cases |

---

## Build Phases

### Phase 1 — The Engine (build first, no Stripe products yet)

1. Next.js 15 + TypeScript project scaffold
2. Tailwind CSS + shadcn/ui base components
3. Standardized `SimEvent` type + event emitter
4. Event queue with Zustand store
5. DVR playback controls (pause/play/step/freeze/speed)
6. Compliance state machine → border color
7. Persona switcher + fake JWT (6 personas)
8. Fake RBAC middleware
9. Mock SSO flow (Dana / OIDC simulation)
10. Observatory shell (all 7 tabs, empty)
11. Stripe Object Explorer (hardcoded example objects)
12. "What to store" annotation system
13. Failure mode toggle registry
14. Exam mode question engine (hardcoded example questions)
15. One fully wired fake payment flow (no real Stripe) to prove the whole engine works end to end
16. Seeded fake Stripe-shaped objects for the explorer
17. Vitest unit tests for state machine, event queue, DVR logic
18. GitHub Actions CI (type-check + unit tests)

**Exit criteria:** The engine works. A fake "pay $10" flow fires events, the border changes through pii → pci → idle, the DVR lets you step through, Exam Mode asks questions. No real Stripe calls yet.

### Phase 2 — Real Stripe: Payments + Billing

1. Stripe SDK setup (server + client)
2. Webhook receiver + signature verification
3. Stripe CLI integration for local webhook forwarding
4. **Stripeland demos:** Checkout, Elements, Payment Links, PaymentIntent, Customer, Radar, Link, Tax, Climate, Authorization Boost
5. **Stackd demos:** Billing (subscription lifecycle), Usage-based billing, Invoicing, Revenue Recognition
6. Test Clock integration for subscription time travel
7. All failure modes wired for payment/billing flows
8. Object Explorer live data for payment/billing objects
9. Webhook handler patterns documented as first-class teaching for each event
10. Playwright E2E tests for payment and billing golden paths
11. Exam mode questions for Phase 2 flows

**Exit criteria:** Can run a full subscription lifecycle (create → upgrade → payment fail → dunning → cancel), step through every event in DVR, answer exam questions correctly.

### Phase 3 — Platform + Money Movement

1. **Stripeland:** Connect (Express), Identity (seller KYC), Managed Payments, Global Payouts, Crypto Onramp, Terminal (simulated)
2. **Flowlance:** Connect (Custom), Identity (freelancer KYC), Financial Connections, Treasury, Issuing, Capital, Global Payouts
3. **Stackd:** Sigma (simulated), Data Pipeline (simulated), Atlas (hosted redirect)
4. All four cross-business flows (`/flows/*`)
5. Full Money Flow animated graph
6. All failure modes wired for platform flows
7. Simulation level badges on all demos
8. Exam mode questions for Phase 3 flows
9. Full Playwright E2E suite including cross-business flows

---

## The Three Businesses

Business names stay as-is for now (Stripeland, Stackd, Flowlance). Will rename to cleaner case-study names later.

### Stripeland — Creator Marketplace

| Product | Demo | Level |
|---|---|---|
| Connect | Express accounts, payment splitting, payout routing | 🟢 Real API |
| Checkout | Stripe-hosted checkout page | 🔵 Real hosted |
| Elements | Embedded card form | 🟢 Real API |
| Payment Links | No-code shareable link | 🔵 Real hosted |
| Radar | Fraud rules panel, block toggles | 🟢 Real API |
| Link | Returning buyer autofill | 🟢 Real API |
| Tax | Auto-calculated at checkout, threshold monitoring | 🟢 Real API |
| Climate | 1% carbon removal toggle | 🟢 Real API |
| Identity | Seller KYC — gov ID + selfie | 🔵 Real hosted |
| Managed Payments | Toggle seller to Stripe as MoR | 🟡 Simulated |
| Global Payouts | Pay seller in EUR/GBP/stablecoin | 🟡 Simulated |
| Crypto Onramp | Buyer purchases with crypto | 🔵 Real hosted |
| Authorization Boost | Retry panel, recovered payment log | 🟡 Simulated |
| Terminal | Simulated reader, in-person flow | 🟡 Simulated |

### Stackd — SaaS Platform for SMBs

| Product | Demo | Level |
|---|---|---|
| Billing | Create/upgrade/downgrade/cancel + proration | 🟢 Real API |
| Usage-based billing | Meter API calls, charge at period close | 🟢 Real API |
| Invoicing | Send B2B invoice, auto-reminder, mark paid | 🟢 Real API |
| Tax | VAT/GST on SaaS subscriptions | 🟢 Real API |
| Revenue Recognition | Deferred revenue waterfall for annual plans | 🟡 Simulated |
| Sigma | SQL query panel against test data | 🟡 Simulated |
| Data Pipeline | Snowflake sync config panel | ⚪ Conceptual |
| Atlas | Company formation flow | 🔵 Real hosted |

### Flowlance — Global Freelance Platform

| Product | Demo | Level |
|---|---|---|
| Connect | Custom accounts, full KYC, payout control | 🟢 Real API |
| Identity | Gov ID + selfie before first payout | 🔵 Real hosted |
| Financial Connections | Bank account link + verification | 🔵 Real hosted |
| Treasury | FinancialAccount — balance, transactions, transfers | 🟡 Simulated |
| Issuing | Virtual card against Treasury balance | 🟡 Simulated |
| Capital | Loan offer + draw/repay | 🟡 Simulated |
| Global Payouts | 100+ countries, fiat + stablecoin | 🟡 Simulated |

---

## Cross-Business Flows (Phase 3)

| Flow | Route | Products chained |
|---|---|---|
| Stripeland hires Flowlance designer | `/flows/hire` | Connect transfer → Treasury deposit → Issuing card spend |
| Stackd pays Flowlance contractor | `/flows/contractor-invoice` | Invoice → PaymentIntent → Connect payout → Treasury deposit |
| Flowlance freelancer buys Stripeland course | `/flows/freelancer-buys` | Checkout → Tax → Climate → Revenue Recognition |
| Flowlance freelancer subscribes to Stackd | `/flows/freelancer-subscribes` | Billing → Usage meter → Dunning → Revenue Recognition |

---

## Webhook Handler Patterns (first-class teaching, Phase 2+)

For every webhook event, the Observatory Webhooks tab shows:

1. **Signature verification** — how `stripe.webhooks.constructEvent` works, what happens if signature fails
2. **Idempotency** — how to use event ID as idempotency key, why it matters
3. **Database transaction** — wrap handler in a transaction, mark event processed atomically
4. **Replay safety** — what happens if the same event fires twice, how to handle it
5. **Ordering risk** — events can arrive out of order; never assume `created` arrives before `updated`
6. **What to do** — concrete handler pseudocode
7. **What not to do** — common mistakes (fulfilling on client redirect, storing card data, not verifying signature)

---

## Route Structure

```
/                                  → World dashboard
/stripeland                        → Marketplace home
/stripeland/checkout               → Hosted Checkout
/stripeland/elements               → Embedded Elements
/stripeland/payment-links          → Payment Links
/stripeland/radar                  → Radar rules panel
/stripeland/sellers/onboard        → Connect + Identity KYC
/stripeland/sellers/payouts        → Global Payouts + Managed Payments
/stripeland/terminal               → Terminal (simulated)
/stripeland/crypto                 → Crypto Onramp
/stackd                            → SaaS home
/stackd/subscribe                  → Billing lifecycle
/stackd/usage                      → Usage-based billing
/stackd/invoice                    → Invoicing
/stackd/revenue                    → Revenue Recognition
/stackd/sigma                      → Sigma SQL panel
/flowlance                         → Freelance platform home
/flowlance/onboard                 → Connect Custom + Identity + Financial Connections
/flowlance/wallet                  → Treasury
/flowlance/cards                   → Issuing
/flowlance/capital                 → Capital
/flows/hire                        → Cross-business: Stripeland → Flowlance
/flows/contractor-invoice          → Cross-business: Stackd → Flowlance
/flows/freelancer-buys             → Cross-business: Flowlance → Stripeland
/flows/freelancer-subscribes       → Cross-business: Flowlance → Stackd
/api/stripe/[...handler]           → Stripe API route handlers
/api/webhooks/stripe               → Webhook receiver
```

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15, App Router, TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animation | Framer Motion (border transitions, money flow graph) |
| Stripe | `stripe` (Node SDK) + `@stripe/stripe-js` + `@stripe/react-stripe-js` |
| Engine state | Zustand (event queue, DVR, persona, compliance state) |
| Real-time events | Server-Sent Events (stream webhook events → Observatory) |
| Testing | Vitest (unit) + Playwright (E2E) |
| Dev webhooks | Stripe CLI (`stripe listen --forward-to`) |
| CI | GitHub Actions: type-check → unit → E2E |

---

## Compliance Boundary Summary

| What | Owner | Notes |
|---|---|---|
| App session / JWT | Your app | Fake in this app |
| SSO / OIDC tokens | Identity Provider | Mocked OIDC flow |
| Card PANs | Stripe (Elements iframe) | Never touches your server — SAQ A |
| KYC documents | Stripe Identity | BSA / AML |
| Bank account data | Stripe Financial Connections | GLBA |
| Treasury balances | Stripe / partner bank | Banking regulation |
| Issued card spend | Stripe Issuing / Visa | Card network rules |
| Tax calculations | Stripe Tax | Local tax law per jurisdiction |
