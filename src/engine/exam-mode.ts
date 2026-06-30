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
