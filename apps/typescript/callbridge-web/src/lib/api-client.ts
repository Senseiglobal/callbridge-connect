/**
 * Typed CallBridge API client.
 *
 * The browser never talks to CALL-E directly. When no backend URL is set,
 * the mock adapter keeps the Lovable UI usable as a standalone preview.
 */
import { baseTimeline, mockResult } from "./mock-data";
import type {
  CreateHandoffInput,
  DispatchMode,
  Handoff,
  HandoffResult,
  HealthResponse,
} from "./types";

export const API_BASE_URL: string =
  (import.meta.env["VITE_CALLBRIDGE_API_URL"] as string | undefined)?.replace(/\/$/, "") ?? "";

export const USING_MOCK_API = !import.meta.env["VITE_CALLBRIDGE_API_URL"];
export function setOperatorToken(token: string) {
  if (token) sessionStorage.setItem("callbridge-operator", token);
  else sessionStorage.removeItem("callbridge-operator");
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/* ------------------------------ mock adapter ----------------------------- */

let store: Handoff[] = []; // Never present synthetic completed calls as live evidence.
const delay = (ms = 420) => new Promise((resolve) => setTimeout(resolve, ms));

function stamp(h: Handoff, id: string, note?: string): Handoff {
  return {
    ...h,
    updated_at: new Date().toISOString(),
    timeline: h.timeline.map((event) =>
      event.id === id
        ? { ...event, at: new Date().toISOString(), ...(note ? { note } : {}) }
        : event,
    ),
  };
}

const mock = {
  async health(): Promise<HealthResponse> {
    await delay(220);
    return {
      status: "ok",
      mode: "preview",
      call_e_connected: false,
      webhook_ready: false,
      public_demo: true,
      version: "0.4.2-mock",
    };
  },
  async list(): Promise<Handoff[]> {
    await delay();
    return [...store].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
  async get(id: string): Promise<Handoff> {
    await delay(320);
    const found = store.find((h) => h.id === id);
    if (!found) throw new ApiError("Handoff not found", 404);
    return found;
  },
  async create(input: CreateHandoffInput): Promise<Handoff> {
    await delay(700);
    if (!input.consent)
      throw new ApiError("Consent is required before a callback can be created", 422);
    const createdAt = new Date().toISOString();
    const handoff: Handoff = {
      id: `hdf_${Math.random().toString(36).slice(2, 8)}`,
      ...input,
      status: "requested",
      mode: null,
      created_at: createdAt,
      updated_at: createdAt,
      timeline: baseTimeline(createdAt),
      result: null,
    };
    store = [handoff, ...store];
    return handoff;
  },
  async dispatch(id: string, mode: DispatchMode): Promise<Handoff> {
    if (mode === "live") throw new ApiError("Live calls are unavailable in the standalone preview");
    await delay(900);
    const idx = store.findIndex((h) => h.id === id);
    if (idx === -1) throw new ApiError("Handoff not found", 404);
    let next = store[idx]!;
    if (mode === "preview") {
      next = stamp(
        { ...next, status: "previewed", mode: "preview" },
        "previewed",
        "Dry run — no call placed",
      );
      next.result = next.result ?? mockResult(next.reason);
    }
    store = store.map((h, i) => (i === idx ? next : h));
    return next;
  },
  async resolve(id: string): Promise<Handoff> {
    await delay(500);
    const idx = store.findIndex((h) => h.id === id);
    if (idx === -1) throw new ApiError("Handoff not found", 404);
    const next = stamp(
      { ...store[idx]!, status: "resolved" },
      "follow_up",
      "Marked resolved by operator",
    );
    store = store.map((h, i) => (i === idx ? next : h));
    return next;
  },
};

/* ------------------------------ backend normalization -------------------- */

type BackendHandoff = Record<string, unknown>;

function normalizeResult(value: unknown): HandoffResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as BackendHandoff;
  return {
    deadline_risk: String(result["deadline_risk"] ?? "Not provided"),
    provider_status: String(result["provider_status"] ?? "unknown"),
    intent: String(result["intent"] ?? "unknown"),
    urgency:
      result["urgency"] === "high" || result["urgency"] === "low" ? result["urgency"] : "medium",
    human_follow_up_requested: Boolean(
      result["human_follow_up_requested"] ?? result["human_followup_requested"] ?? false,
    ),
    preferred_callback_window: String(result["preferred_callback_window"] ?? "Not provided"),
    summary: String(result["summary"] ?? "No summary returned."),
    recommended_next_step: String(
      result["recommended_next_step"] ?? result["next_step"] ?? "Human review required.",
    ),
  };
}

function normalizeStatus(raw: BackendHandoff, result: HandoffResult | null): Handoff["status"] {
  const status = String(raw["status"] ?? "ready");
  if (status === "resolved") return "resolved";
  if (status === "preview") return "previewed";
  if (status === "calling") return "calling";
  if (status === "failed" || status === "needs_review") return status;
  if (status === "completed")
    return result?.human_follow_up_requested ? "awaiting_human" : "completed";
  return "requested";
}

function normalizeTimeline(
  raw: BackendHandoff,
  status: Handoff["status"],
  result: HandoffResult | null,
) {
  const created = String(raw["created_at"] ?? new Date().toISOString());
  const previewed = raw["previewed_at"] ? String(raw["previewed_at"]) : null;
  const started = raw["started_at"] ? String(raw["started_at"]) : null;
  const completed = raw["completed_at"] ? String(raw["completed_at"]) : null;
  const followUp = raw["resolved_at"] ? String(raw["resolved_at"]) : null;
  return [
    { id: "created", label: "Request created", at: created },
    {
      id: "previewed",
      label: "Callback previewed",
      at: previewed,
      note: status === "previewed" ? "Dry run — no call placed" : undefined,
    },
    {
      id: "started",
      label: "Live dispatch attempted",
      at: started,
      note: started ? "Check provider status for confirmation" : undefined,
    },
    { id: "completed", label: "Callback completed", at: completed },
    {
      id: "follow_up",
      label: "Operator marked resolved",
      at: followUp,
      note: followUp ? "Operator action; not proof of another call" : undefined,
    },
  ];
}

function normalizeHandoff(input: unknown): Handoff {
  const raw = input as BackendHandoff;
  const result = normalizeResult(raw["result"]);
  const status = normalizeStatus(raw, result);
  return {
    id: String(raw["id"]),
    calle_run_id: raw["calle_run_id"] ? String(raw["calle_run_id"]) : undefined,
    error: raw["error"] ? String(raw["error"]) : undefined,
    business_name: String(raw["business_name"] ?? "CallBridge"),
    visitor_name: String(raw["visitor_name"] ?? "Visitor"),
    phone: String(raw["phone_masked"] ?? raw["phone"] ?? "••••"),
    reason: String(raw["reason"] ?? ""),
    page_url: String(raw["page_url"] ?? ""),
    consent: Boolean(raw["consent"]),
    context: (raw["context"] as Handoff["context"]) ?? {},
    status,
    mode: raw["started_at"] ? "live" : result?.provider_status === "preview" ? "preview" : null,
    created_at: String(raw["created_at"] ?? new Date().toISOString()),
    updated_at: String(raw["updated_at"] ?? raw["created_at"] ?? new Date().toISOString()),
    timeline: normalizeTimeline(raw, status, result),
    result,
  };
}

/* ------------------------------ http adapter ----------------------------- */

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("callbridge-operator") : null;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? `Request failed (${res.status})`, res.status);
  }
  return (await res.json()) as T;
}

/* -------------------------------- client --------------------------------- */

export const api = {
  createDemo: async (): Promise<Handoff> => USING_MOCK_API
    ? mock.create({ business_name: "Aura Manager", visitor_name: "Demo Creator (fictional)", phone: "+1202555••••", reason: "Fictional example: I need help finishing my storyboard before my project deadline.", page_url: "https://www.auramanager.app/", consent: true, context: { project_phase: "drafting", project_deadline: "14 days", source: "sample_demo" } })
    : normalizeHandoff(await http("/api/demo", { method: "POST", body: "{}" })),
  refreshHandoff: async (id: string): Promise<Handoff> => USING_MOCK_API ? mock.get(id)
    : normalizeHandoff(await http(`/api/handoffs/${id}/refresh`, { method: "POST", body: "{}" })),
  health: async (): Promise<HealthResponse> => {
    if (USING_MOCK_API) return mock.health();
    const raw = await http<Record<string, unknown>>("/healthz");
    return {
      status: "ok",
      mode: raw["dry_run"] === false ? "live" : "preview",
      public_demo: Boolean(raw["public_demo"]),
      auth_required: Boolean(raw["auth_required"]),
      api_key_configured: Boolean(raw["api_key_configured"]),
      call_e_connected: Boolean(raw["call_e_connected"] ?? false),
      webhook_ready: Boolean(raw["webhook_ready"]),
      version: String(raw["version"] ?? "unknown"),
    };
  },
  listHandoffs: async (): Promise<Handoff[]> => {
    if (USING_MOCK_API) return mock.list();
    const raw = await http<unknown>("/api/handoffs");
    const values = Array.isArray(raw) ? raw : ((raw as { handoffs?: unknown[] }).handoffs ?? []);
    return values.map(normalizeHandoff);
  },
  getHandoff: async (id: string): Promise<Handoff> =>
    USING_MOCK_API ? mock.get(id) : normalizeHandoff(await http(`/api/handoffs/${id}`)),
  createHandoff: async (input: CreateHandoffInput): Promise<Handoff> =>
    USING_MOCK_API
      ? mock.create(input)
      : normalizeHandoff(
          await http("/api/handoffs", { method: "POST", body: JSON.stringify(input) }),
        ),
  dispatchHandoff: async (id: string, mode: DispatchMode): Promise<Handoff> =>
    USING_MOCK_API
      ? mock.dispatch(id, mode)
      : normalizeHandoff(
          await http(`/api/handoffs/${id}/dispatch`, {
            method: "POST",
            body: JSON.stringify({ mode }),
          }),
        ),
  resolveHandoff: async (id: string): Promise<Handoff> =>
    USING_MOCK_API
      ? mock.resolve(id)
      : normalizeHandoff(await http(`/api/handoffs/${id}/resolve`, { method: "POST", body: "{}" })),
};

export const queryKeys = {
  health: ["health"] as const,
  handoffs: ["handoffs"] as const,
  handoff: (id: string) => ["handoffs", id] as const,
};
