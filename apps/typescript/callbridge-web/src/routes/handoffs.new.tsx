import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/Page";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { api, queryKeys } from "@/lib/api-client";
import type { CreateHandoffInput } from "@/lib/types";

export const Route = createFileRoute("/handoffs/new")({
  head: () => ({
    meta: [
      { title: "New handoff — CallBridge" },
      {
        name: "description",
        content:
          "Create a consented project check-in with creator details, blocker, and project context.",
      },
      { property: "og:title", content: "New handoff — CallBridge" },
      { property: "og:description", content: "Create a consented callback request in CallBridge." },
    ],
  }),
  component: NewHandoff,
});

const E164 = /^\+[1-9]\d{7,14}$/;

function NewHandoff() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const health = useQuery({ queryKey: queryKeys.health, queryFn: api.health });
  const demo = useMutation({
    mutationFn: api.createDemo,
    onSuccess: (handoff) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.handoffs });
      void navigate({ to: "/handoffs/$id", params: { id: handoff.id } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const mutation = useMutation({
    mutationFn: (input: CreateHandoffInput) => api.createHandoff(input),
    onSuccess: (handoff) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.handoffs });
      toast.success("Handoff created", { description: "No call has been placed." });
      void navigate({ to: "/handoffs/$id", params: { id: handoff.id } });
    },
    onError: (err: Error) => toast.error("Could not create handoff", { description: err.message }),
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (k: string) => String(form.get(k) ?? "").trim();

    const next: Record<string, string> = {};
    if (!value("business_name")) next["business_name"] = "Business name is required.";
    if (!value("visitor_name")) next["visitor_name"] = "Visitor name is required.";
    if (!E164.test(value("phone"))) next["phone"] = "Use E.164 format, e.g. +12025550123.";
    if (value("reason").length < 8) next["reason"] = "Add a little more detail (8+ characters).";
    try {
      new URL(value("page_url"));
    } catch {
      next["page_url"] = "Enter the full source page URL.";
    }
    if (!consent) next["consent"] = "Consent is required before any callback.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    mutation.mutate({
      business_name: value("business_name"),
      visitor_name: value("visitor_name"),
      phone: value("phone"),
      reason: value("reason"),
      page_url: value("page_url"),
      consent: true,
      context: {
        project_phase: value("project_phase") || "unknown",
        project_deadline: value("project_deadline") || "unknown",
        source: value("source") || "project_checkin_cta",
      },
    });
  }

  if (health.data?.storage_backend === "aura")
    return (
      <AppShell>
        <PageHeader
          title="Request a callback through Aura"
          description="Private pilot requests come from a signed-in Aura user, with their own explicit consent."
        />
        <section className="card-surface mt-8 space-y-4 p-6">
          <p>
            Use Aura's callback form with your own approved test number. The request is saved to the
            private queue and appears on this dashboard after refresh. Creating it does not place a
            call.
          </p>
          <a
            className="inline-block rounded-lg bg-primary px-4 py-3 text-primary-foreground"
            href="https://www.auramanager.app/callback"
            target="_blank"
            rel="noreferrer"
          >
            Open Aura's callback form
          </a>
          <p className="text-sm text-muted-foreground">
            For fictional samples, use the separate public demo. Do not put sample requests or
            someone else's phone number into the private queue.
          </p>
        </section>
      </AppShell>
    );

  if (health.data?.public_demo)
    return (
      <AppShell>
        <PageHeader
          title="Try a fictional project check-in"
          description="This public demo never calls anyone or accepts personal information. It uses an in-memory sample and resets when the service restarts."
        />
        <section className="card-surface mt-8 space-y-4 p-6">
          <h2 className="text-xl">A creator is stuck on a storyboard</h2>
          <p>
            See how a check-in request becomes a structured next-action brief. All preview answers
            are illustrative, not real conversations.
          </p>
          <button
            className="rounded-lg bg-primary px-4 py-3 text-primary-foreground disabled:opacity-50"
            disabled={demo.isPending}
            onClick={() => demo.mutate()}
          >
            {demo.isPending ? "Creating sample…" : "Create sample check-in"}
          </button>
        </section>
      </AppShell>
    );

  return (
    <AppShell>
      <PageHeader
        title="New handoff"
        description="Capture the creator's project blocker. Creating a check-in never places a call — dispatch happens on the detail screen."
      />

      <div
        role="note"
        className="card-surface mt-8 flex gap-3 border-live/40 bg-live-soft p-4 text-sm"
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-live" aria-hidden />
        <p className="text-foreground">
          <strong className="font-semibold">Live mode places a real outbound phone call</strong> to
          the number below. Only continue with explicit, recorded consent from the visitor.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        noValidate
        className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        <div className="card-surface space-y-5 p-6">
          <Field id="business_name" label="Business name" error={errors["business_name"]}>
            <Input
              id="business_name"
              name="business_name"
              defaultValue="Aura Manager"
              autoComplete="organization"
            />
          </Field>
          <Field id="visitor_name" label="Creator name" error={errors["visitor_name"]}>
            <Input
              id="visitor_name"
              name="visitor_name"
              placeholder="Creator name"
              autoComplete="name"
            />
          </Field>
          <Field
            id="phone"
            label="Phone number (E.164)"
            hint="Shown in full only on this form. Masked everywhere else."
            error={errors["phone"]}
          >
            <Input
              id="phone"
              name="phone"
              inputMode="tel"
              placeholder="+12025550123"
              className="font-mono"
              autoComplete="tel"
            />
          </Field>
          <Field
            id="reason"
            label="What is blocking the next project action?"
            error={errors["reason"]}
          >
            <Textarea
              id="reason"
              name="reason"
              rows={3}
              placeholder="I am blocked on the next action for my short-film project."
            />
          </Field>
          <Field id="page_url" label="Source page URL" error={errors["page_url"]}>
            <Input
              id="page_url"
              name="page_url"
              placeholder="https://www.auramanager.app/"
              className="font-mono"
            />
          </Field>

          <div className="rounded-lg border border-border bg-secondary/60 p-4">
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent"
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                aria-describedby="consent-help"
              />
              <div>
                <Label htmlFor="consent" className="font-medium">
                  The creator consented to an AI project check-in by phone
                </Label>
                <p id="consent-help" className="mt-1 text-xs text-muted-foreground">
                  Required. CallBridge will not dispatch any callback without it.
                </p>
              </div>
            </div>
            {errors["consent"] ? (
              <p role="alert" className="mt-2 text-xs text-destructive">
                {errors["consent"]}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-6">
          <fieldset className="card-surface space-y-5 p-6">
            <legend className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Optional context
            </legend>
            <Field id="project_phase" label="Project stage">
              <Input id="project_phase" name="project_phase" placeholder="drafting" />
            </Field>
            <Field id="project_deadline" label="Project deadline">
              <Input id="project_deadline" name="project_deadline" placeholder="14 days" />
            </Field>
            <Field id="source" label="Source">
              <Input id="source" name="source" placeholder="project_checkin_cta" />
            </Field>
          </fieldset>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-60"
          >
            {mutation.isPending ? "Creating handoff…" : "Create handoff"}
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Creating a handoff does not call anyone.
          </p>
        </div>
      </form>
    </AppShell>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
