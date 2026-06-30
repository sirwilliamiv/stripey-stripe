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
