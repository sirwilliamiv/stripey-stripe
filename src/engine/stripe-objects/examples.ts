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
