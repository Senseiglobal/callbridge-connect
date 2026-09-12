import { cn } from "@/lib/utils";
import type { HandoffStatus, Urgency } from "@/lib/types";

const statusMap: Record<HandoffStatus, { label: string; className: string }> = {
  failed: { label: "Call failed", className: "bg-live-soft text-live" },
  needs_review: { label: "Needs review", className: "bg-live-soft text-live" },
  requested: { label: "Requested", className: "bg-secondary text-secondary-foreground" },
  previewed: { label: "Previewed", className: "bg-accent text-accent-foreground" },
  calling: { label: "Calling", className: "bg-live-soft text-live" },
  completed: { label: "Completed", className: "bg-accent text-accent-foreground" },
  awaiting_human: { label: "Awaiting human", className: "bg-live-soft text-live" },
  resolved: { label: "Resolved", className: "bg-secondary text-muted-foreground" },
};

export function StatusBadge({ status, className }: { status: HandoffStatus; className?: string }) {
  const s = statusMap[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        s.className,
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {s.label}
    </span>
  );
}

const urgencyMap: Record<Urgency, string> = {
  low: "border-border text-muted-foreground",
  medium: "border-primary/40 text-accent-foreground bg-mint-soft",
  high: "border-live/40 text-live bg-live-soft",
};

export function UrgencyBadge({ urgency }: { urgency: Urgency }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
        urgencyMap[urgency],
      )}
    >
      {urgency}
    </span>
  );
}
