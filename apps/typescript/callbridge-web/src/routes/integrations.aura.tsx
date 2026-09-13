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
          "A signed-in Aura callback pilot with explicit consent, private request storage and operator-approved AI calls.",
      },
      { property: "og:title", content: "Aura Manager integration — CallBridge" },
      {
        property: "og:description",
        content:
          "Owner request and private queue endpoints for Aura's consented AI callback pilot.",
      },
    ],
  }),
  component: AuraIntegration,
});

const PAYLOAD = `{
  "visitor_name": "Demo Creator (fictional)",
  "phone": "+12025550123",
  "reason": "I am blocked on the next action for my short-film project.",
  "consent": true
}`;

const STEPS = [
  {
    title: "Creator opts into a project check-in",
    body: "A signed-in Aura user enters their own approved test number and a short question, then explicitly agrees to one AI callback. This is not a human transfer.",
  },
  {
    title: "Aura saves a private request",
    body: "Aura verifies account ownership and saves the name, number, question and consent in its existing database. Users can check status and cancel before dispatch.",
  },
  {
    title: "CallBridge previews, then dispatches",
    body: "The private operator reads Aura's queue through a dedicated server credential. Preview never dials; a live call needs separate operator approval and an allowlisted number.",
  },
  {
    title: "A project action returns",
    body: "After a confirmed CALL-E result, CallBridge saves the outcome in Aura's queue. Unknown or failed calls are marked for review, not invented as successful or automatically redialled.",
  },
];

const NEVER_SEND = [
  "Private or unreleased project files",
  "Passwords or login credentials",
  "API tokens, session keys, or webhook secrets",
  "Full Context Vault records of any kind",
];

function AuraIntegration() {
  return (
    <AppShell>
      <PageHeader
        title="Aura Manager voice check-in"
        description="Aura Manager is an AI workspace for creators, artists, and founders to develop and finish creative projects. This focused pilot adds a signed-in, opt-in AI callback request and a private operator queue. Availability depends on pilot activation; a configured integration is not proof of a completed call."
      />

      <div className="card-surface mt-6 p-6">
        <p className="text-sm text-muted-foreground">
          The public CallBridge demo uses fictional samples and cannot read private Aura requests.
          For the pilot, use Aura's signed-in form and the private operator console. It is limited
          to approved test numbers, not ongoing marketing.
        </p>
        <a
          href="https://www.auramanager.app/callback"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm font-medium text-primary underline"
        >
          Open Aura's AI callback pilot
        </a>
      </div>

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
        <h2 className="text-lg">Two private boundaries</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The owner endpoints below run on Aura's website and require sign-in. The queue endpoint is
          server-only and requires a separate operator token. CallBridge never receives Aura's
          database master key. Creating a request never places a call.
        </p>
        <dl className="mt-5 space-y-4">
          <EndpointRow
            method="POST"
            path="/api/support/callback"
            note="Aura: signed-in, same-origin consented request"
          />
          <EndpointRow
            method="GET / DELETE"
            path="/api/support/callback"
            note="Aura: view your own requests or cancel an unused request"
          />
          <EndpointRow
            method="POST"
            path="/api/internal/callbridge"
            note="Aura: private queue commands with a dedicated server token"
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
          <h2 className="min-w-0 text-lg">Fictional request example — Aura owner API</h2>
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
