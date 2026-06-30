export type Actor = "user" | "app" | "stripe" | "idp" | "webhook"

export type EventPhase =
  | "user_action"
  | "client_call"
  | "server_call"
  | "stripe_object"
  | "webhook"
  | "db_write"
  | "compliance_transition"

export type ComplianceState = "idle" | "pii" | "pci" | "kyc_aml" | "crypto" | "banking"

export type SimulationLevel = "real_api" | "real_hosted" | "simulated" | "conceptual"

export type Role = "buyer" | "seller" | "freelancer" | "enterprise" | "platform_admin"

export type KycState = "not_required" | "pending" | "verified" | "rejected"

export type ConnectState = "none" | "onboarding" | "active" | "restricted"

export type ConnectType = "express" | "custom" | "platform"

export type PlaybackSpeed = 0.5 | 1 | 2

export type FailureModeType =
  | "card_declined"
  | "card_declined_insufficient_funds"
  | "card_declined_do_not_honor"
  | "three_d_secure_required"
  | "webhook_delayed"
  | "webhook_duplicated"
  | "webhook_out_of_order"
  | "subscription_payment_fails"
  | "invoice_past_due"
  | "connect_lost_capability"
  | "kyc_rejected"
  | "payout_failed"
  | "dispute_opened"
  | "refund_issued"
  | "partial_capture"
  | "checkout_session_expired"
  | "rate_limit_hit"

export interface StoreGuidance {
  store: string[]
  neverStore: string[]
  sourceOfTruth: string[]
  listenFor: string[]
}

export interface SimEvent {
  id: string
  flowId?: string
  stepId?: string
  timestamp: string
  actor: Actor
  phase: EventPhase
  source: string
  action: string
  stripeObject?: string
  complianceStates: ComplianceState[]
  request?: unknown
  response?: unknown
  certTips?: string[]
  storeGuidance?: StoreGuidance
  isFailureMode?: boolean
  failureModeType?: FailureModeType
  simulationLevel: SimulationLevel
}

export interface Persona {
  id: string
  name: string
  role: Role
  kycState: KycState
  connectState: ConnectState
  connectType?: ConnectType
  useSso?: boolean
}

export interface FailureModeConfig {
  type: FailureModeType
  label: string
  description: string
  affectedProducts: string[]
}

export interface ExamQuestion {
  id: string
  flowId: string
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  eventRef?: string
  certTracks: string[]
}

export interface StripeObjectRelationship {
  field: string
  objectType: string
  description: string
}

export interface StripeObjectExample {
  objectType: string
  id: string
  data: Record<string, unknown>
  relationships: StripeObjectRelationship[]
  webhookEvents: string[]
  storeGuidance: StoreGuidance
}
