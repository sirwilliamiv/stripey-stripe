import type { StripeObjectExample } from '../types'

export const STRIPE_OBJECT_EXAMPLES: StripeObjectExample[] = [
  {
    objectType: 'PaymentIntent',
    id: 'pi_3OqXXXXXXXXXXXXX',
    data: {
      id: 'pi_3OqXXXXXXXXXXXXX',
      object: 'payment_intent',
      amount: 2000,
      currency: 'usd',
      status: 'succeeded',
      payment_method: 'pm_XXXXXXXXXXXXXXXX',
      customer: 'cus_XXXXXXXXXXXXXXXX',
      metadata: { order_id: 'ord_001' },
      created: 1706745600,
      livemode: false,
    },
    relationships: [
      { field: 'payment_method', objectType: 'PaymentMethod', description: 'The card or bank used' },
      { field: 'customer', objectType: 'Customer', description: 'Who is paying' },
      { field: 'invoice', objectType: 'Invoice', description: 'Set when created by a subscription' },
    ],
    webhookEvents: [
      'payment_intent.created',
      'payment_intent.requires_action',
      'payment_intent.succeeded',
      'payment_intent.payment_failed',
    ],
    storeGuidance: {
      store: ['id (your DB FK)', 'status', 'amount', 'currency', 'metadata.order_id'],
      neverStore: ['card number (PAN)', 'CVC', 'full PaymentMethod object'],
      sourceOfTruth: ['Listen to payment_intent.succeeded before fulfilling'],
      listenFor: ['payment_intent.succeeded', 'payment_intent.payment_failed'],
    },
  },
  {
    objectType: 'Subscription',
    id: 'sub_XXXXXXXXXXXXXXXX',
    data: {
      id: 'sub_XXXXXXXXXXXXXXXX',
      object: 'subscription',
      status: 'active',
      customer: 'cus_XXXXXXXXXXXXXXXX',
      current_period_end: 1709337600,
      items: {
        data: [
          {
            price: { id: 'price_XXXXXXXXXXXXXXXX', unit_amount: 2900, currency: 'usd', recurring: { interval: 'month' } },
          },
        ],
      },
      metadata: {},
      created: 1706745600,
      livemode: false,
    },
    relationships: [
      { field: 'customer', objectType: 'Customer', description: 'Subscriber' },
      { field: 'items.data[].price', objectType: 'Price', description: 'The recurring price' },
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
      store: ['id', 'status', 'current_period_end', 'customer'],
      neverStore: ['raw subscription object (cache stales quickly)'],
      sourceOfTruth: ['current_period_end from invoice.payment_succeeded', 'status from subscription.updated'],
      listenFor: ['customer.subscription.updated', 'invoice.payment_failed'],
    },
  },
  {
    objectType: 'Customer',
    id: 'cus_XXXXXXXXXXXXXXXX',
    data: {
      id: 'cus_XXXXXXXXXXXXXXXX',
      object: 'customer',
      email: 'alice@example.com',
      name: 'Alice Buyer',
      metadata: { internal_user_id: 'user_001' },
      created: 1706745600,
      livemode: false,
    },
    relationships: [
      { field: 'default_source', objectType: 'PaymentMethod', description: 'Default payment method' },
      { field: 'subscriptions', objectType: 'Subscription', description: 'Active subscriptions' },
    ],
    webhookEvents: ['customer.created', 'customer.updated', 'customer.deleted'],
    storeGuidance: {
      store: ['id (map to your user ID in metadata)', 'email', 'metadata.internal_user_id'],
      neverStore: ['email in plain text without encryption at rest'],
      sourceOfTruth: ['Always re-fetch customer from Stripe if you need fresh data'],
      listenFor: ['customer.deleted (revoke access)'],
    },
  },
]

export function getExampleByType(objectType: string): StripeObjectExample | undefined {
  return STRIPE_OBJECT_EXAMPLES.find((e) => e.objectType === objectType)
}
