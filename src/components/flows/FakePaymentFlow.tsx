"use client"
import { useState } from 'react'
import { emit } from '@/engine/event-emitter'
import { useEventQueue } from '@/engine/event-queue'
import { useDVR } from '@/engine/dvr'

type FlowState = 'idle' | 'running' | 'done' | 'failed'

const DELAY = (ms: number) => new Promise((r) => setTimeout(r, ms))

export function FakePaymentFlow() {
  const [state, setState] = useState<FlowState>('idle')
  const clear = useEventQueue((s) => s.clear)
  const pause = useDVR((s) => s.pause)

  async function runFlow() {
    clear()
    pause()
    setState('running')

    emit({
      actor: 'user',
      phase: 'user_action',
      source: 'Browser / Checkout Form',
      action: 'User clicks Pay $20.00',
      complianceStates: ['pii', 'pci'],
      simulationLevel: 'simulated',
      certTips: [
        'Stripe Elements isolates card fields in an iframe — PANs never reach your server.',
        'This qualifies you for PCI SAQ A compliance.',
      ],
      storeGuidance: {
        store: ['customer email', 'order amount', 'order metadata'],
        neverStore: ['card number', 'CVC', 'expiry date'],
        sourceOfTruth: ['Do not fulfill until payment_intent.succeeded webhook arrives'],
        listenFor: ['payment_intent.succeeded', 'payment_intent.payment_failed'],
      },
    })

    await DELAY(800)

    emit({
      actor: 'app',
      phase: 'client_call',
      source: 'Stripe.js',
      action: 'stripe.confirmCardPayment()',
      stripeObject: 'PaymentIntent',
      complianceStates: ['pci'],
      simulationLevel: 'simulated',
      request: { type: 'card', amount: 2000, currency: 'usd' },
      certTips: [
        'stripe.confirmCardPayment() sends the card token directly to Stripe over TLS.',
        'Your server never sees the raw card number.',
      ],
    })

    await DELAY(800)

    emit({
      actor: 'stripe',
      phase: 'server_call',
      source: 'Stripe API',
      action: 'POST /v1/payment_intents',
      stripeObject: 'PaymentIntent',
      complianceStates: ['pci'],
      simulationLevel: 'simulated',
      request: { amount: 2000, currency: 'usd', confirm: true },
      response: {
        id: 'pi_3OqXXXXXXXXXXXXX',
        status: 'succeeded',
        amount: 2000,
        currency: 'usd',
      },
    })

    await DELAY(800)

    emit({
      actor: 'stripe',
      phase: 'stripe_object',
      source: 'Stripe',
      action: 'PaymentIntent created',
      stripeObject: 'PaymentIntent',
      complianceStates: ['pci'],
      simulationLevel: 'simulated',
      certTips: [
        'PaymentIntent is the canonical record for a payment. Store its `id` as your FK.',
        "Always check `status === 'succeeded'` before fulfilling the order.",
      ],
      storeGuidance: {
        store: ['PaymentIntent.id', 'PaymentIntent.status', 'PaymentIntent.amount'],
        neverStore: ['raw PaymentMethod object', 'card number'],
        sourceOfTruth: ["Use PaymentIntent.status from the webhook, not from the client's return URL"],
        listenFor: ['payment_intent.succeeded', 'payment_intent.payment_failed'],
      },
    })

    await DELAY(800)

    emit({
      actor: 'webhook',
      phase: 'webhook',
      source: 'Stripe → Your Server',
      action: 'payment_intent.succeeded',
      stripeObject: 'PaymentIntent',
      complianceStates: ['pci'],
      simulationLevel: 'simulated',
      response: {
        type: 'payment_intent.succeeded',
        data: { object: { id: 'pi_3OqXXXXXXXXXXXXX', status: 'succeeded', amount: 2000 } },
      },
      certTips: [
        'Always return 2xx immediately then process webhooks asynchronously.',
        'Verify webhook signatures with stripe.webhooks.constructEvent().',
        'Make handlers idempotent — Stripe may retry the same event multiple times.',
      ],
    })

    await DELAY(400)

    emit({
      actor: 'app',
      phase: 'db_write',
      source: 'Your Server',
      action: 'ORDER marked fulfilled in DB',
      complianceStates: ['idle'],
      simulationLevel: 'simulated',
      storeGuidance: {
        store: ['order.status = "fulfilled"', 'order.stripe_payment_intent_id'],
        neverStore: ['card details of any kind'],
        sourceOfTruth: ['payment_intent.succeeded is the trigger for fulfillment — not the client redirect'],
        listenFor: ['payment_intent.payment_failed (to revert)'],
      },
    })

    setState('done')
  }

  function reset() {
    clear()
    setState('idle')
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">Fake Payment Flow</h2>
        <p className="text-zinc-500 text-sm max-w-sm">
          Simulates a complete Stripe payment: card tokenization, PaymentIntent creation, and webhook fulfillment.
          Watch the Observatory panel on the right.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-zinc-400">Card number</label>
          <div className="flex gap-1 items-center rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-500">
            <span className="text-zinc-600">🔒</span>
            <span className="ml-2">4242 4242 4242 4242</span>
            <span className="ml-auto text-xs text-violet-400">Stripe iframe</span>
          </div>
          <p className="text-xs text-zinc-600">Card field is isolated in a Stripe-hosted iframe (simulated)</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">Expiry</label>
            <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-500">
              12 / 28
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">CVC</label>
            <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-500">
              •••
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-zinc-400 text-sm">Total</span>
          <span className="text-zinc-100 font-semibold">$20.00</span>
        </div>

        {state === 'idle' && (
          <button
            onClick={runFlow}
            className="w-full py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
          >
            Pay $20.00
          </button>
        )}
        {state === 'running' && (
          <button disabled className="w-full py-3 rounded-lg bg-zinc-700 text-zinc-400 font-semibold">
            Processing…
          </button>
        )}
        {state === 'done' && (
          <div className="space-y-2">
            <div className="w-full py-3 rounded-lg bg-green-800/50 text-green-300 font-semibold text-center border border-green-700">
              ✓ Payment succeeded
            </div>
            <button
              onClick={reset}
              className="w-full py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-sm transition-colors"
            >
              Reset & run again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
