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
