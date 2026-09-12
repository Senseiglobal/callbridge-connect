import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, Ban } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/Page";

export const Route = createFileRoute("/integrations/aura")({
  head: () => ({
    meta: [
      { title: "Aura Manager integration — CallBridge" },
      {
        name: "description",
        content:
          "Propose a release check-in CTA for Aura Manager, connected to CallBridge with a server-to-server webhook and a consented callback payload.",
      },
      { property: "og:title", content: "Aura Manager integration — CallBridge" },
      {
        property: "og:description",
        content:
          "Webhook endpoint, example payload, and data-handling rules for Aura's phone-native release check-in.",
      },
    ],
  }),
  component: AuraIntegration,
});

const PAYLOAD = `{
  "business_name": "Aura Manager",
  "visitor_name": "Demo Artist (fictional)",
  "phone": "+12025550123",
  "reason": "I am blocked on the next action for my upcoming single.",
  "page_url": "https://www.auramanager.app/",
  "consent": true,
  "context": {
    "project_phase": "pre-release",
    "release_window": "14 days",
    "source": "release_checkin_cta"
  }
}`;

const STEPS = [
  {
    title: "Artist opts into a release check-in",
    body: "Aura can offer a phone check-in when an artist is blocked or wants accountability on the next release action.",
  },
  {
    title: "Aura posts a minimal context packet",
    body: "Aura's backend posts the artist's phone, consent, release phase, deadline window, and blocker. The browser never touches CALL-E or any credential.",
  },
  {
    title: "CallBridge previews, then dispatches",
    body: "CallBridge stores the check-in in preview mode. An operator explicitly confirms before any live call.",
  },
  {
    title: "A release action returns",
    body: "After the consented callback, CallBridge returns the blocker, deadline risk, one next action, and whether a human strategist should follow up.",
  },
];

const NEVER_SEND = [
  "Private or unreleased lyrics",
  "Passwords or login credentials",
  "API tokens, session keys, or webhook secrets",
  "Full Context Vault records of any kind",
];

function AuraIntegration() {
  return (
    <AppShell>
      <PageHeader
        title="Aura Manager voice check-in"
        description="Aura Manager is a music-release strategy SaaS for independent artists. Aura helps artists plan and execute; CallBridge adds a proposed, consented, phone-native release check-in when they need momentum or human strategy support."
      />

      <section aria-label="Workflow" className="mt-8 grid gap-3 sm:grid-cols-2">
        {STEPS.map((step, i) => (
          <div key={step.title} className="card-surface p-6">
            <span className="text-display text-sm text-primary">0{i + 1}</span>
            <h2 className="mt-2 text-lg">{step.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
          </div>
        ))}
      </section>

      <section className="card-surface mt-6 p-6">
        <h2 className="text-lg">Webhook endpoint</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This is the proposed endpoint Aura Manager could call from its backend. Requests are
          authenticated with an integration bearer token held on Aura's server. This is not an HMAC-signed webhook. Creation alone never places a call.
        </p>
        <dl className="mt-5 space-y-4">
          <EndpointRow
            method="POST"
            path="/api/integrations/aura/handoff"
            note="Aura's server-to-server webhook"
          />
          <EndpointRow
            method="POST"
            path="/api/handoffs"
            note="Create a handoff from the operator console"
          />
          <EndpointRow method="GET" path="/api/handoffs" note="List handoffs" />
          <EndpointRow method="GET" path="/api/handoffs/:id" note="Fetch one handoff" />
          <EndpointRow
            method="POST"
            path="/api/handoffs/:id/dispatch"
            note="Body: { mode: preview | live }"
          />
          <EndpointRow method="GET" path="/healthz" note="Service health" />
        </dl>
      </section>

      <section className="card-surface mt-6 p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h2 className="min-w-0 text-lg">Example payload</h2>
          <CopyButton value={PAYLOAD} />
        </div>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-secondary p-4 font-mono text-xs leading-relaxed">
          <code>{PAYLOAD}</code>
        </pre>
      </section>

      <section className="card-surface mt-6 border-live/40 bg-live-soft p-6">
        <h2 className="flex items-center gap-2 text-lg">
          <Ban className="size-4 text-live" aria-hidden /> Never send this data
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          CALL-E only needs enough context to hold a short, useful conversation. Anything below must
          stay inside Aura Manager.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {NEVER_SEND.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-live" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function EndpointRow({ method, path, note }: { method: string; path: string; note: string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="rounded-md bg-accent px-2 py-0.5 font-mono text-xs font-medium text-accent-foreground">
        {method}
      </span>
      <div className="min-w-0">
        <dt className="truncate font-mono text-sm">{path}</dt>
        <dd className="text-xs text-muted-foreground">{note}</dd>
      </div>
    </div>
  );
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success("Copied to clipboard");
          setTimeout(() => setCopied(false), 2000);
        } catch {
          toast.error("Copy failed", { description: "Select the text and copy manually." });
        }
      }}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-input bg-card px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
    >
      {copied ? (
        <Check className="size-4 text-primary" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
