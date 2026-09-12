import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-[minmax(0,1fr)] gap-4 sm:flex sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {description ? (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card-surface flex flex-col items-center gap-3 px-6 py-14 text-center">
      <h3 className="text-lg">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="card-surface flex flex-col items-center gap-3 border-destructive/30 px-6 py-12 text-center"
    >
      <h3 className="text-lg">Something went wrong</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry ? (
        <button
          onClick={onRetry}
          className="rounded-md border border-input px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
