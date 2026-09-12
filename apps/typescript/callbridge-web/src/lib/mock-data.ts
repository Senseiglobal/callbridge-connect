import type { HandoffResult, TimelineEvent } from "./types";

export function baseTimeline(createdAt: string): TimelineEvent[] {
  return [
    { id: "created", label: "Sample request created", at: createdAt },
    { id: "previewed", label: "Sample preview generated", at: null },
    { id: "follow_up", label: "Operator marked resolved", at: null },
  ];
}
export function mockResult(_reason: string): HandoffResult {
  return {
    intent: "campaign_blocker", urgency: "medium", human_follow_up_requested: true,
    provider_status: "preview", deadline_risk: "Example: cover artwork may be late.",
    preferred_callback_window: "Example only: recipient would supply a time and timezone.",
    summary: "SAMPLE ONLY — no call occurred. This illustrates an artist who is blocked on cover artwork.",
    recommended_next_step: "Example: finish the artwork and have an operator review a requested follow-up.",
  };
}
