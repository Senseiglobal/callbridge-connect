export type Urgency = "low" | "medium" | "high";

export type HandoffStatus =
  | "requested"
  | "previewed"
  | "calling"
  | "completed"
  | "awaiting_human"
  | "resolved"
  | "failed"
  | "needs_review";

export type DispatchMode = "preview" | "live";

export interface HandoffContext {
  project_phase?: string;
  project_deadline?: string;
  /** Legacy payload alias; new requests use project_deadline. */
  release_window?: string;
  account_stage?: string;
  plan?: string;
  source?: string;
}

export interface HandoffResult {
  deadline_risk?: string;
  provider_status?: string;
  intent: string;
  urgency: Urgency;
  human_follow_up_requested: boolean;
  preferred_callback_window: string;
  summary: string;
  recommended_next_step: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  at: string | null;
  note?: string | undefined;
}

export interface Handoff {
  calle_run_id?: string | undefined;
  error?: string | undefined;
  id: string;
  business_name: string;
  visitor_name: string;
  phone: string;
  reason: string;
  page_url: string;
  consent: boolean;
  context: HandoffContext;
  status: HandoffStatus;
  mode: DispatchMode | null;
  created_at: string;
  updated_at: string;
  timeline: TimelineEvent[];
  result: HandoffResult | null;
}

export interface CreateHandoffInput {
  business_name: string;
  visitor_name: string;
  phone: string;
  reason: string;
  page_url: string;
  consent: boolean;
  context: HandoffContext;
}

export interface HealthResponse {
  storage_backend?: string;
  public_demo?: boolean;
  auth_required?: boolean;
  api_key_configured?: boolean;
  status: "ok" | "degraded";
  mode: DispatchMode;
  call_e_connected: boolean;
  webhook_ready: boolean;
  version: string;
}
