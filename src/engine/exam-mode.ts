import type { ExamQuestion } from './types'

export const EXAM_QUESTIONS: ExamQuestion[] = [
  {
    id: 'q1',
    flowId: 'fake-payment',
    question: 'When a customer submits a payment form using Stripe.js, where is the raw card number sent?',
    options: [
      'Directly to your server, which forwards it to Stripe',
      'To Stripe servers only — your server never sees the PAN',
      'To both your server and Stripe simultaneously',
      'To the card network, which forwards to Stripe',
    ],
    correctIndex: 1,
    explanation:
      'Stripe.js tokenises the card in the browser and sends the PAN directly to Stripe over TLS. Your server only receives a token (PaymentMethod ID). This is what qualifies you for SAQ A.',
    eventRef: 'client_call',
    certTracks: ['stripe-associate', 'pci-dss'],
  },
  {
    id: 'q2',
    flowId: 'fake-payment',
    question: 'Which Stripe object represents the authoritative record of a payment attempt?',
    options: ['Charge', 'PaymentIntent', 'PaymentMethod', 'Invoice'],
    correctIndex: 1,
    explanation:
      'PaymentIntent is the canonical payment record. It tracks the full lifecycle — from created → requires_action → succeeded/failed. A Charge is created underneath it when funds actually move.',
    eventRef: 'stripe_object',
    certTracks: ['stripe-associate'],
  },
  {
    id: 'q3',
    flowId: 'fake-payment',
    question: 'Why must webhook handlers return a 2xx response before doing long-running work?',
    options: [
      'Stripe requires it for billing purposes',
      'To prevent Stripe from retrying the event while you process it',
      'Because webhooks time out after 100ms',
      "It's optional — Stripe doesn't retry on failure",
    ],
    correctIndex: 1,
    explanation:
      'Stripe retries events if your endpoint takes too long or returns non-2xx. Acknowledge immediately, then process asynchronously using a queue to avoid duplicate side effects.',
    certTracks: ['stripe-associate', 'stripe-developer'],
  },
  {
    id: 'q4',
    flowId: 'fake-payment',
    question: 'What is the safest way to confirm a payment amount in a webhook handler?',
    options: [
      'Trust the amount in the event payload',
      'Re-fetch the PaymentIntent from the Stripe API',
      'Store the amount in a session cookie',
      'Check the amount against a localStorage value',
    ],
    correctIndex: 1,
    explanation:
      'Never trust the amount from the payload alone — events can be replayed or spoofed. Re-fetch the object from Stripe to get the canonical state, then verify against your database.',
    certTracks: ['stripe-associate', 'stripe-developer'],
  },
]

export function getQuestionsForFlow(flowId: string): ExamQuestion[] {
  return EXAM_QUESTIONS.filter((q) => q.flowId === flowId)
}

export function getQuestionById(id: string): ExamQuestion | undefined {
  return EXAM_QUESTIONS.find((q) => q.id === id)
}
