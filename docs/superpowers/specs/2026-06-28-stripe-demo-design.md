# Stripe Demo App — Design Spec
_2026-06-28_

## Purpose

A single Next.js 15 + TypeScript application that demos all 29 Stripe products in context, structured as three fictional businesses that are customers of each other. Optimized for Stripe certification prep across all cert tracks (Developer, Connect, Billing/Revenue, Payments Architect).

---

## 1. Layout Shell

Every page shares one root layout:

- **Compliance border** — 4px animated ring around the entire viewport. Color encodes the current data/regulatory state (see table below). On state change: holds previous color for 3 seconds with a labeled overlay ("entering PCI scope"), then transitions. Configurable per-session.
- **Top bar** — business switcher (Stripeland / Stackd / Flowlance), active persona display (auth layer + KYC state + Connect state), test-mode badge, Stripe CLI connection indicator.
- **Split view** — left ~60% is the business UI, right ~40% is the Observatory panel.
- **Observatory DVR controls** — pause/play, step back, step forward, speed (0.5x / 1x / 2x), freeze. Default state is **paused** — events queue and wait for user to step through. Both halves of the screen can be frozen together.

### Compliance Border Colors

| Color | State | Regulation |
|---|---|---|
| `#22C55E` green | Idle / safe | — |
| `#EAB308` yellow | PII in flight (name, email, address) | GDPR / CCPA |
| `#F97316` orange | PCI scope — card data in Elements/Checkout, PaymentIntent active | PCI-DSS SAQ A |
| `#3B82F6` blue | KYC/AML — Identity verification, Financial Connections | BSA / FinCEN |
| `#A855F7` purple | Crypto flow | FinCEN MSB rules |
| `#EF4444` red | Regulated banking — Treasury, Issuing, Capital | Banking reg / BaaS licensing |
| gradient cycle | Multiple active states | All applicable |

---

## 2. Identity Layers (Auth vs KYC — always visible)

Three completely independent layers, each labeled in Observatory with distinct source tags:

### Layer 1 — App Authentication `[YOUR APP]`
- Fake JWT stored in a cookie. No real auth provider.
- Persona switcher in top bar swaps the cookie instantly.
- Observatory shows this as `[YOUR APP]` in grey.

### Layer 2 — App Authorization `[YOUR APP MIDDLEWARE]`
- RBAC roles: `buyer`, `seller`, `freelancer`, `enterprise`, `platform_admin`.
- Route guards fire server-side. Observatory shows blocked routes as `[YOUR APP MIDDLEWARE — 403]`.

### Layer 3 — Stripe Identity / KYC / Connect Onboarding `[STRIPE]`
- Completely separate from login. A user can be authenticated (Layer 1 ✓) but unverified (Layer 3 ✗).
- Observatory labels Stripe Identity calls `[STRIPE — KYC]` in blue.
- Observatory labels Connect onboarding `[STRIPE — CONNECT ONBOARDING]` in indigo.

### Layer 4 — SSO (mock OAuth / OIDC) `[IDENTITY PROVIDER → YOUR APP]`
- Dana (enterprise persona) logs in via simulated Google Workspace OAuth flow.
- Observatory shows the OIDC token exchange, claims, and the handoff to app session.
- Makes explicit: SSO = who you are to your app. KYC = who you are in the real world to Stripe. Different systems.

### Pre-seeded Personas

| Name | Role | KYC | Connect | Notes |
|---|---|---|---|---|
| Alex | `buyer` | not required | none | Happy path buyer |
| Maya | `seller` | ✓ verified | ✓ express active | Fully onboarded seller |
| Jordan | `seller` | ⏳ pending | ⏳ onboarding | Mid-onboarding — shows incomplete state |
| Sam | `freelancer` | ✓ verified | ✓ custom active | Full custom Connect account |
| Dana | `enterprise` | not required | none | SSO login, B2B invoicing |
| Billy | `platform_admin` | n/a | platform account | Can see all accounts |

---

## 3. The Three Businesses

### 3a. Stripeland — Creator Marketplace

Sellers list digital goods, physical merch, and courses. Buyers checkout, subscribe to creator tiers, tip in crypto.

**Products covered:**

| Product | Demo |
|---|---|
| Connect | Sellers are Express accounts. Marketplace splits and routes payouts |
| Checkout | Stripe-hosted checkout page for digital goods |
| Elements | Embedded card form for course purchases |
| Payment Links | No-code shareable link for merch |
| Radar | Fraud rules panel — toggle rules, watch blocks fire in Observatory |
| Link | Returning buyer autofills card |
| Tax | Auto-calculated at checkout, threshold monitoring panel |
| Climate | "Add 1% to remove carbon" toggle at checkout |
| Identity | Seller onboarding — gov ID + selfie flow |
| Managed Payments | Toggle a seller to Stripe as merchant of record |
| Global Payouts | Pay seller in EUR, GBP, stablecoin |
| Crypto Onramp | Buyer purchases with crypto |
| Authorization Boost | Retry panel showing recovered failed payments |
| Terminal | Simulated in-person reader for physical goods seller |

### 3b. Stackd — SaaS Platform for SMBs

Sells monthly/annual subscription plans, meters API usage, invoices enterprise clients.

**Products covered:**

| Product | Demo |
|---|---|
| Billing | Create / upgrade / downgrade / cancel subscription with proration shown |
| Usage-based billing | API call meter charges at billing period close |
| Invoicing | Send B2B invoice, auto-reminder, mark paid |
| Tax | VAT/GST on SaaS across countries |
| Revenue Recognition | Deferred revenue waterfall for annual plans |
| Sigma | Live SQL query panel against test Stripe data |
| Data Pipeline | Config panel showing Snowflake sync setup |
| Atlas | "Incorporate your startup" flow (links to Stripe-hosted) |

### 3c. Flowlance — Global Freelance Platform

Freelancers onboard with KYC, get a financial account, spend via virtual cards, access financing.

**Products covered:**

| Product | Demo |
|---|---|
| Connect | Freelancers are Custom accounts — full KYC, payout control |
| Identity | Gov ID + selfie before first payout |
| Financial Connections | Link bank account to verify ownership before withdrawal |
| Treasury | Each freelancer gets a `FinancialAccount` — balance, transactions, inbound transfers |
| Issuing | Virtual card issued against Treasury balance |
| Capital | Loan offer based on payout history — draw and repay flow |
| Global Payouts | Pay out in 100+ countries, fiat + stablecoin |

---

## 4. Cross-Business Flows

Dedicated pages at `/flows/[name]` showing both business UIs side by side, Observatory tracking the full event chain.

| Flow | Route | Products chained |
|---|---|---|
| Stripeland hires Flowlance designer | `/flows/hire` | Connect transfer → Treasury deposit → Issuing card spend |
| Stackd pays Flowlance contractor | `/flows/contractor-invoice` | Invoice → PaymentIntent → Connect payout → Treasury deposit |
| Flowlance freelancer buys Stripeland course | `/flows/freelancer-buys` | Checkout → Tax → Climate → Revenue Recognition |
| Flowlance freelancer subscribes to Stackd | `/flows/freelancer-subscribes` | Billing → Usage meter → Dunning → Revenue Recognition |

---

## 5. Observatory Panel

Five tabs. Playback controls (◀◀ ◀ ❚❚ ▶ ▶▶ + speed + freeze) at the top of every tab.

### Tab 1 — API Log
- Every Stripe SDK call in sequence: method, endpoint, request body, response, latency.
- PCI fields shown as `[REDACTED — never touches your server]` with tokenization boundary explanation.
- PII fields highlighted yellow with GDPR/CCPA tooltip.
- Each call tagged by source: `[YOUR APP]`, `[STRIPE SDK CLIENT]`, `[STRIPE SERVER]`.

### Tab 2 — Webhook Stream
- Events queued as they fire.
- Each entry shows event type, previous vs current state, and what the handler should do.
- Cert tip inline: common traps per event type.

### Tab 3 — Money Flow
- Animated SVG graph. Nodes: Customer, PaymentIntent, Transfer, Payout, FinancialAccount, IssuingCard.
- Edges show funds moving with amounts labeled.
- Cross-business flows show all three companies' accounts on the same graph.
- Steps forward/backward in sync with DVR controls.

### Tab 4 — Compliance
- Current data classification, active regulations, why the border is this color.
- Which data leaves your app vs. stays in Stripe's vault.
- SAQ type indicator (SAQ A vs SAQ A-EP explanation when relevant).

### Tab 5 — Cert Tip
- Dedicated panel per flow. Maps current flow to specific cert question categories.
- Lists: concepts covered, common exam traps, the specific API objects involved.

---

## 6. Route Structure

```
/                                  → World dashboard — ecosystem map, money flowing between 3 businesses
/stripeland                        → Marketplace home
/stripeland/checkout               → Hosted Checkout demo
/stripeland/elements               → Embedded Elements demo
/stripeland/payment-links          → Payment Links demo
/stripeland/radar                  → Radar rules panel
/stripeland/sellers/onboard        → Connect + Identity KYC onboarding
/stripeland/sellers/payouts        → Global Payouts + Managed Payments
/stripeland/terminal               → Terminal simulated reader
/stripeland/crypto                 → Crypto Onramp
/stackd                            → SaaS home
/stackd/subscribe                  → Billing — subscription lifecycle
/stackd/usage                      → Usage-based billing meter
/stackd/invoice                    → Invoicing — B2B invoice flow
/stackd/revenue                    → Revenue Recognition waterfall
/stackd/sigma                      → Sigma SQL panel
/flowlance                         → Freelance platform home
/flowlance/onboard                 → Connect Custom + Identity + Financial Connections
/flowlance/wallet                  → Treasury financial account
/flowlance/cards                   → Issuing virtual card
/flowlance/capital                 → Capital loan offer + draw/repay
/flows/hire                        → Cross-business: Stripeland → Flowlance
/flows/contractor-invoice          → Cross-business: Stackd → Flowlance
/flows/freelancer-buys             → Cross-business: Flowlance → Stripeland
/flows/freelancer-subscribes       → Cross-business: Flowlance → Stackd
/api/stripe/[...handler]           → All Stripe API route handlers
/api/webhooks/stripe               → Webhook receiver
```

---

## 7. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15, App Router, TypeScript | Full-stack in one repo, familiar from inbox-admin |
| Styling | Tailwind CSS + shadcn/ui | Fast UI, consistent components |
| Animation | Framer Motion | Observatory flow animations, border transitions |
| Stripe | `stripe` (Node SDK) + `@stripe/stripe-js` + `@stripe/react-stripe-js` | Full SDK surface |
| Observatory state | Zustand | Lightweight global event queue for DVR |
| Real-time events | Server-Sent Events (SSE) | Stream webhook events to Observatory without WebSocket complexity |
| Testing | Vitest + Playwright | Unit tests for API handlers, E2E for flows |
| Dev webhooks | Stripe CLI (`stripe listen`) | Forward test webhooks locally |

---

## 8. Testing Strategy

- **Unit tests (Vitest)** — every API route handler tested with mocked Stripe responses. Webhook signature verification tested with valid and tampered payloads.
- **Integration tests** — key flows (subscription lifecycle, Connect onboarding, Treasury account creation) tested against Stripe test mode with real API calls.
- **E2E tests (Playwright)** — golden path for each business: buy a course (Stripeland), subscribe to a plan (Stackd), onboard as freelancer (Flowlance), and all four cross-business flows.
- **Test clocks** — Stripe Test Clocks used in integration tests for subscription aging, dunning, and trial expiration without waiting real time.
- **CI** — GitHub Actions: `type-check → unit tests → integration tests → E2E` on every push.

---

## 9. Compliance Boundaries — Summary

| What | Who owns it | In scope for |
|---|---|---|
| App session / JWT | Your app | Your auth infrastructure |
| SSO / OIDC tokens | Identity Provider (mocked) | Your app's auth layer |
| Card PANs | Stripe (via Elements iframe) | PCI-DSS — but SAQ A because you never touch PANs |
| KYC documents | Stripe Identity | BSA / AML |
| Bank account data | Stripe Financial Connections | GLBA |
| Treasury balances | Stripe / partner bank | Banking regulation |
| Issued card spend | Stripe Issuing / Visa | Card network rules |
| Tax calculations | Stripe Tax | Local tax law per jurisdiction |

---

## Open Questions

None — all design decisions resolved in brainstorm session.
