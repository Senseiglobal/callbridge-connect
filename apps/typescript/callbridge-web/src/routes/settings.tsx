import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/Page";
import { API_BASE_URL, USING_MOCK_API, api, queryKeys, setOperatorToken } from "@/lib/api-client";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — CallBridge" }] }),
  component: Settings,
});
function Settings() {
  const { data, error } = useQuery({ queryKey: queryKeys.health, queryFn: api.health });
  const queryClient = useQueryClient();
  const [token, setToken] = useState("");
  return (
    <AppShell>
      <PageHeader title="Settings" description="CALL-E credentials stay on the backend. This page shows configuration, not proof of a successful call." />
      <section className="card-surface mt-8 space-y-4 p-6">
        <h2 className="text-xl">Workspace status</h2>
        {error ? <p role="alert">{error.message}</p> : null}
        <p>Mode: {data?.public_demo ? "Public sample demo — no personal data or calls" : data?.mode === "live" ? "Live calls enabled, with operator confirmation" : "Preview — live calls locked"}</p>
        <p>Backend: {USING_MOCK_API ? "Browser-only sample (not persisted)" : API_BASE_URL || "Same-origin backend"}</p>
        <p>CALL-E API key: {data?.api_key_configured ? "Configured on server; not yet verified by this health check" : "Not configured"}</p>
        <p>Aura integration endpoint: {data?.webhook_ready ? "Bearer authentication configured" : "Disabled / not configured"}</p>
        <p>Version: {data?.version ?? "Checking…"}</p>
      </section>
      {!data?.public_demo ? (
        <form className="card-surface mt-6 space-y-4 p-6" onSubmit={async (event) => {
          event.preventDefault();
          setOperatorToken(token);
          try {
            await api.listHandoffs();
            queryClient.clear();
            setToken("");
            toast.success("Operator access saved for this browser tab");
          } catch (err) {
            setOperatorToken("");
            queryClient.clear();
            toast.error(err instanceof Error ? err.message : "Access failed");
          }
        }}>
          <h2 className="text-xl">Operator access</h2>
          <label htmlFor="operator-token" className="block text-sm">Operator access code — not your CALL-E API key</label>
          <input id="operator-token" type="password" autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} className="w-full rounded-lg border bg-card px-3 py-2" required />
          <p className="text-sm text-muted-foreground">Use the separate CALLBRIDGE_ADMIN_TOKEN configured on your backend. It is stored in session storage for this tab. Use HTTPS outside localhost and do not use a shared computer.</p>
          <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-primary-foreground">Unlock operator console</button>
          <button type="button" className="ml-3 rounded-lg border px-4 py-2" onClick={() => { setOperatorToken(""); queryClient.clear(); toast.success("Operator code cleared"); }}>Sign out</button>
        </form>
      ) : null}
      <p className="mt-6 text-sm text-muted-foreground">Creating a request never dials. Live calling additionally requires CALLE_DRY_RUN=false, a server API key, a 24+ character operator code, and CALLBRIDGE_ALLOWED_PHONES. No automatic redials or recurring calls.</p>
    </AppShell>
  );
}
