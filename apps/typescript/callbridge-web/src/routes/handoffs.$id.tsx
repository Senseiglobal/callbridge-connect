import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, PhoneOutgoing, PlayCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { ErrorState } from "@/components/Page";
import { StatusBadge, UrgencyBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, queryKeys } from "@/lib/api-client";
import { formatDateTime, maskPhone } from "@/lib/format";
import type { DispatchMode, Handoff } from "@/lib/types";

export const Route = createFileRoute("/handoffs/$id")({
  head: () => ({
    meta: [
      { title: "Handoff detail — CallBridge" },
      {
        name: "description",
        content:
          "Review the visitor request, callback timeline, and CALL-E's structured handoff summary.",
      },
      { property: "og:title", content: "Handoff detail — CallBridge" },
      { property: "og:description", content: "Callback timeline and structured handoff summary." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: HandoffDetail,
});

function HandoffDetail() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const [confirmLive, setConfirmLive] = useState(false);
  const health = useQuery({ queryKey: queryKeys.health, queryFn: api.health });

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.handoff(id),
    queryFn: () => api.getHandoff(id),
  });

  const onUpdated = (h: Handoff, message: string) => {
    queryClient.setQueryData(queryKeys.handoff(id), h);
    void queryClient.invalidateQueries({ queryKey: queryKeys.handoffs });
    toast.success(message);
  };

  const dispatch = useMutation({
    mutationFn: (mode: DispatchMode) => api.dispatchHandoff(id, mode),
    onSuccess: (h, mode) =>
      onUpdated(h, mode === "preview" ? "Sample generated — no call placed" : h.status === "needs_review" || h.status === "failed" ? "Dispatch needs review — see status" : "Submitted to CALL-E — refresh for result"),
    onError: (err: Error) => toast.error("Dispatch failed", { description: err.message }),
  });

  const resolve = useMutation({
    mutationFn: () => api.resolveHandoff(id),
    onSuccess: (h) => onUpdated(h, "Marked as resolved"),
    onError: (err: Error) => toast.error("Could not resolve", { description: err.message }),
  });
  const refresh = useMutation({
    mutationFn: () => api.refreshHandoff(id),
    onSuccess: (h) => onUpdated(h, "Provider status refreshed"),
    onError: (err: Error) => toast.error(err.message),
  });

  if (isError) {
    return (
      <AppShell>
        <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />
      </AppShell>
    );
  }

  if (isPending) {
    return (
      <AppShell>
        <Skeleton className="h-8 w-64" />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </AppShell>
    );
  }

  const h = data;
  const busy = dispatch.isPending || resolve.isPending || refresh.isPending;
  const canDispatch = h.status === "requested" || h.status === "previewed";

  return (
    <AppShell>
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to dashboard
      </Link>

      <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-4 sm:flex sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-3xl sm:text-4xl">{h.visitor_name}</h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="font-mono">{maskPhone(h.phone)}</span>
            <span aria-hidden>·</span>
            <span>{h.business_name}</span>
            <span aria-hidden>·</span>
            <span className="font-mono text-xs">{h.id}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <StatusBadge status={h.status} />
          {h.result ? <UrgencyBadge urgency={h.result.urgency} /> : null}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          {h.error ? <p role="alert" className="card-surface border-live p-5">{h.error}</p> : null}
          {h.mode === "preview" ? <p className="card-surface border-primary p-5">Sample preview only. No phone call occurred; these answers are illustrative.</p> : null}
          <section className="card-surface p-6">
            <h2 className="text-lg">Original request</h2>
            <p className="mt-3 text-sm leading-relaxed text-foreground">“{h.reason}”</p>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <Meta label="Source page" value={h.page_url} mono />
              <Meta label="Requested" value={formatDateTime(h.created_at)} />
            </dl>
          </section>

          <section className="card-surface p-6">
            <h2 className="text-lg">Timeline</h2>
            <ol className="mt-5 space-y-0">
              {h.timeline.map((event, i) => {
                const done = Boolean(event.at);
                return (
                  <li key={event.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
                    <div className="flex flex-col items-center">
                      <span
                        className={`grid size-6 shrink-0 place-items-center rounded-full border ${
                          done
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card"
                        }`}
                        aria-hidden
                      >
                        {done ? <Check className="size-3.5" /> : null}
                      </span>
                      {i < h.timeline.length - 1 ? (
                        <span className={`w-px flex-1 ${done ? "bg-primary/40" : "bg-border"}`} />
                      ) : null}
                    </div>
                    <div className={`min-w-0 pb-6 ${done ? "" : "opacity-60"}`}>
                      <p className="text-sm font-medium">{event.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.at ? formatDateTime(event.at) : "Pending"}
                        {event.note ? ` · ${event.note}` : ""}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section aria-labelledby="result-heading">
            <h2 id="result-heading" className="text-lg">
              Structured result
            </h2>
            {h.result ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <ResultCard label="Intent" value={h.result.intent} />
                <ResultCard label="Urgency" value={h.result.urgency} capitalize />
                <ResultCard
                  label="Human follow-up requested"
                  value={h.result.human_follow_up_requested ? "Yes" : "No"}
                />
                <ResultCard
                  label="Preferred callback window"
                  value={h.result.preferred_callback_window}
                />
                <ResultCard label="Summary" value={h.result.summary} wide />
                <ResultCard label="Deadline risk" value={h.result.deadline_risk ?? "Not provided"} wide />
                <ResultCard
                  label="Recommended next step"
                  value={h.result.recommended_next_step}
                  wide
                />
              </div>
            ) : (
              <p className="card-surface mt-4 p-6 text-sm text-muted-foreground">
                No result yet. Run a preview callback to see the expected structured output before
                going live.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card-surface p-6">
            <h2 className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-4 text-primary" aria-hidden /> Permission &amp; context
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <Meta label="Consent" value={h.consent ? "Granted by visitor" : "Not granted"} />
              <Meta label="Release stage" value={h.context.project_phase ?? "—"} />
              <Meta label="Release window" value={h.context.release_window ?? "—"} />
              <Meta label="Source" value={h.context.source ?? "—"} mono />
              <Meta label="Dispatch mode" value={h.mode ?? "Not dispatched"} />
              <Meta label="CALL-E run ID" value={h.calle_run_id ?? "No live run"} mono />
            </dl>
            <p className="mt-4 border-t border-border pt-4 text-xs text-muted-foreground">
              Do not enter private lyrics, passwords, tokens, or Context Vault contents. Only the three listed context fields are accepted.
            </p>
          </section>

          <section className="card-surface space-y-3 p-6">
            <h2 className="text-lg">Actions</h2>
            <button
              onClick={() => dispatch.mutate("preview")}
              disabled={busy || !canDispatch}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-60"
            >
              <PlayCircle className="size-4" aria-hidden />
              {dispatch.isPending && dispatch.variables === "preview"
                ? "Previewing…"
                : "Preview callback"}
            </button>
            <button
              onClick={() => setConfirmLive(true)}
              disabled={busy || !canDispatch || health.data?.mode !== "live"}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-live px-4 py-2.5 text-sm font-medium text-card transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <PhoneOutgoing className="size-4" aria-hidden />
              {health.data?.mode !== "live" ? "Live calls locked" : dispatch.isPending && dispatch.variables === "live" ? "Submitting…" : "Place live call"}
            </button>
            {h.calle_run_id ? <button disabled={busy} onClick={() => refresh.mutate()} className="w-full rounded-lg border border-input px-4 py-2.5 text-sm">{refresh.isPending ? "Checking…" : "Refresh CALL-E result"}</button> : null}
            <button
              onClick={() => resolve.mutate()}
              disabled={busy || ["resolved", "calling", "needs_review"].includes(h.status)}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-60"
            >
              {h.status === "resolved"
                ? "Resolved"
                : resolve.isPending
                  ? "Saving…"
                  : "Mark as resolved"}
            </button>
          </section>
        </aside>
      </div>

      <AlertDialog open={confirmLive} onOpenChange={setConfirmLive}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Place a real phone call?</AlertDialogTitle>
            <AlertDialogDescription>
              CALL-E will dial {maskPhone(h.phone)} and speak with {h.visitor_name}. This is a live
              outbound call and cannot be undone. Confirm the visitor consented.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => dispatch.mutate("live")}
              className="bg-live text-card hover:opacity-90"
            >
              Yes, place live call
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className={`mt-1 break-words text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</dd>
    </div>
  );
}

function ResultCard({
  label,
  value,
  wide,
  capitalize,
}: {
  label: string;
  value: string;
  wide?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className={`card-surface p-5 ${wide ? "sm:col-span-2" : ""}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-2 text-sm leading-relaxed ${capitalize ? "capitalize" : ""}`}>{value}</p>
    </div>
  );
}
