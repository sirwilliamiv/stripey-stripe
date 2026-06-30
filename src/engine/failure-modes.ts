import type { FailureModeConfig, FailureModeType } from './types'

export const FAILURE_MODES: FailureModeConfig[] = [
  {
    type: 'card_declined',
    label: 'Card Declined',
    description: 'Generic card decline. The card network rejected the charge without a specific reason.',
    affectedProducts: ['payments', 'checkout'],
  },
  {
    type: 'card_declined_insufficient_funds',
    label: 'Insufficient Funds',
    description: "The card's available balance is lower than the charge amount.",
    affectedProducts: ['payments', 'checkout', 'subscriptions'],
  },
  {
    type: 'card_declined_do_not_honor',
    label: 'Do Not Honor',
    description: 'The issuing bank refused the transaction without providing a reason.',
    affectedProducts: ['payments', 'checkout'],
  },
  {
    type: 'three_d_secure_required',
    label: '3DS Required',
    description: 'The issuer requires Strong Customer Authentication. The payment needs a redirect.',
    affectedProducts: ['payments', 'checkout'],
  },
  {
    type: 'webhook_delayed',
    label: 'Webhook Delayed',
    description: 'Stripe attempted webhook delivery but your endpoint was slow to respond.',
    affectedProducts: ['payments', 'subscriptions', 'connect'],
  },
  {
    type: 'webhook_duplicated',
    label: 'Webhook Duplicated',
    description: 'Stripe retried a webhook and your server received the same event twice.',
    affectedProducts: ['payments', 'subscriptions', 'connect'],
  },
  {
    type: 'webhook_out_of_order',
    label: 'Webhook Out of Order',
    description: 'Events arrived in a different order than they were created.',
    affectedProducts: ['subscriptions', 'invoicing'],
  },
  {
    type: 'subscription_payment_fails',
    label: 'Subscription Payment Fails',
    description: 'A renewal attempt for a subscription was declined.',
    affectedProducts: ['subscriptions', 'billing'],
  },
  {
    type: 'invoice_past_due',
    label: 'Invoice Past Due',
    description: 'An invoice has not been paid by its due date.',
    affectedProducts: ['invoicing', 'subscriptions'],
  },
  {
    type: 'connect_lost_capability',
    label: 'Connect Lost Capability',
    description: 'A connected account lost a capability (e.g., card_payments) due to missing verification.',
    affectedProducts: ['connect'],
  },
  {
    type: 'kyc_rejected',
    label: 'KYC Rejected',
    description: 'Identity verification failed. The account cannot proceed without re-submission.',
    affectedProducts: ['connect', 'identity', 'treasury'],
  },
  {
    type: 'payout_failed',
    label: 'Payout Failed',
    description: "A bank transfer to the connected account's bank account was rejected.",
    affectedProducts: ['connect', 'treasury'],
  },
  {
    type: 'dispute_opened',
    label: 'Dispute Opened',
    description: 'A cardholder filed a chargeback. Funds are held until the dispute is resolved.',
    affectedProducts: ['payments', 'radar'],
  },
  {
    type: 'refund_issued',
    label: 'Refund Issued',
    description: 'A full or partial refund was issued back to the cardholder.',
    affectedProducts: ['payments', 'checkout'],
  },
  {
    type: 'partial_capture',
    label: 'Partial Capture',
    description: 'An authorized payment was captured for less than the authorized amount.',
    affectedProducts: ['payments'],
  },
  {
    type: 'checkout_session_expired',
    label: 'Checkout Session Expired',
    description: 'The customer did not complete checkout within the session TTL.',
    affectedProducts: ['checkout'],
  },
  {
    type: 'rate_limit_hit',
    label: 'Rate Limit Hit',
    description: 'Your integration exceeded Stripe API rate limits. Implement exponential backoff.',
    affectedProducts: ['payments', 'connect', 'subscriptions', 'invoicing'],
  },
]

export function getFailureMode(type: FailureModeType): FailureModeConfig | undefined {
  return FAILURE_MODES.find((m) => m.type === type)
}

export function getFailureModesByProduct(product: string): FailureModeConfig[] {
  return FAILURE_MODES.filter((m) => m.affectedProducts.includes(product))
}
