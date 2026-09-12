import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, PhoneCall } from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { EmptyState, ErrorState, PageHeader } from "@/components/Page";
import { StatusBadge, UrgencyBadge } from "@/components/StatusBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { api, queryKeys } from "@/lib/api-client";
import { formatDateTime, hostFromUrl, maskPhone, relativeTime } from "@/lib/format";
import type { Handoff } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CallBridge — Voice activation for music releases" },
      {
        name: "description",
        content:
          "Turn an artist's opted-in release check-in into a consented AI callback and a structured next-action brief.",
      },
      { property: "og:title", content: "CallBridge — Voice activation for music releases" },
      {
        property: "og:description",
        content:
          "Phone-native accountability and human-strategist escalation for Aura Manager artists.",
      },
    ],
  }),
  component: Dashboard,
});

function metricsFrom(handoffs: Handoff[]) {
  return [
    { label: "Release check-ins", value: handoffs.length, hint: "All sources" },
    {
      label: "Awaiting strategist",
      value: handoffs.filter((h) => h.status === "awaiting_human").length,
      hint: "Needs an operator",
      accent: true,
    },
    {
      label: "Completed check-ins",
      value: handoffs.filter((h) => h.mode === "live" && h.result?.provider_status === "completed")
        .length,
      hint: "CALL-E finished",
    },
    {
      label: "High urgency",
      value: handoffs.filter((h) => h.mode === "live" && h.result?.urgency === "high").length,
      hint: "Flagged by CALL-E",
    },
  ];
}

function Dashboard() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: queryKeys.handoffs,
    queryFn: api.listHandoffs,
  });

  return (
    <AppShell>
      <PageHeader
        title="Release check-in dashboard"
        description="Every opted-in artist check-in, the CALL-E conversation, and the next release action it uncovered."
        action={
          <Link
            to="/handoffs/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            <PhoneCall className="size-4" aria-hidden />
            New check-in
          </Link>
        }
      />

      <section aria-label="Metrics" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isPending
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card-surface p-5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-4 h-8 w-12" />
              </div>
            ))
          : metricsFrom(data ?? []).map((m) => (
              <div key={m.label} className="card-surface p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </p>
                <p
                  className={`mt-3 text-display text-4xl ${m.accent ? "text-live" : "text-foreground"}`}
                >
                  {m.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
              </div>
            ))}
      </section>

      <section aria-label="Recent handoffs" className="mt-10">
        <h2 className="text-xl">Recent handoffs</h2>

        {isError ? (
          <div className="mt-4">
            <ErrorState message={(error as Error).message} onRetry={() => void refetch()} />
          </div>
        ) : isPending ? (
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="No release check-ins yet"
              description="When an artist opts into a release check-in, the request will appear here."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {data!.map((h) => (
              <li key={h.id}>
                <Link
                  to="/handoffs/$id"
                  params={{ id: h.id }}
                  className="card-surface group block p-5 transition-colors hover:border-primary/50"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium">{h.visitor_name}</span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {maskPhone(h.phone)}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                        {h.result?.intent ?? h.reason}
                      </p>
                      <p className="mt-2 truncate font-mono text-xs text-muted-foreground">
                        {hostFromUrl(h.page_url)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <StatusBadge status={h.status} />
                      {h.result ? <UrgencyBadge urgency={h.result.urgency} /> : null}
                      <span
                        className="text-xs text-muted-foreground"
                        title={formatDateTime(h.created_at)}
                      >
                        {relativeTime(h.created_at)}
                      </span>
                      <ArrowUpRight
                        className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                        aria-hidden
                      />
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
