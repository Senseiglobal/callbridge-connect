import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, queryKeys } from "@/lib/api-client";
import { PhoneOutgoing, LayoutDashboard, PlusCircle, Plug, Settings2 } from "lucide-react";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/handoffs/new", label: "New handoff", icon: PlusCircle },
  { to: "/integrations/aura", label: "Aura integration", icon: Plug },
  { to: "/settings", label: "Settings", icon: Settings2 },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="CallBridge home">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <PhoneOutgoing className="size-4.5" aria-hidden />
            </span>
            <span className="truncate text-display text-lg">CallBridge</span>
          </Link>
          <ModeChip />
        </div>
        <nav aria-label="Main" className="mx-auto max-w-6xl overflow-x-auto px-4 sm:px-6">
          <ul className="flex gap-1 pb-1">
            {nav.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="flex items-center gap-2 whitespace-nowrap rounded-t-md border-b-2 border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{
                    className: "border-primary! text-foreground! font-medium",
                  }}
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-muted-foreground sm:px-6">
        CallBridge never calls CALL-E from the browser and never places a call automatically.
      </footer>
    </div>
  );
}

export function ModeChip() {
  const { data } = useQuery({ queryKey: queryKeys.health, queryFn: api.health });
  return (
    <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      {data ? data.public_demo ? "Public demo · fictional data" : data.mode === "live" ? "Live calls enabled · confirmation required" : "Preview mode · no calls" : "Checking backend…"}
    </span>
  );
}
