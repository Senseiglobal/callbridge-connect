# Aura pilot: what is ready and how to switch it on

Updated 13 September 2026. This is the focused Aura integration, not self-service accounts for every business.

## Ready in code

- An Aura sign-in-protected callback API and a separate, clearly labelled AI form at `/callback`.
- An isolated durable queue in Aura's existing database. The migration has been applied; permissions and rollback-only transition checks passed.
- A private CallBridge storage adapter that talks to Aura's narrow queue API. It never needs Aura's database credentials.
- Explicit consent, masked numbers, owner-scoped status/cancellation, one active request per owner, expiring dispatch eligibility and single-claim protection.
- 27 Python tests and 11 Aura unit/route tests passed locally. Typechecking, focused lint and Aura's production build passed. The isolated build used placeholder credentials, not real API keys; it is not a live integration test. No real call was placed.

Aura source is kept in its own private repository/worktree; it is not copied into this public repository. Its deployment and enabled end-to-end workflow are still pending Vercel authorization and a consented test.

## In plain English

Aura collects and safely remembers the request. CallBridge is your private control desk. CALL-E makes the phone call only after you approve it. The free public Render demo remains a separate, fictional demonstration.

You do not need another paid service for this pilot. Aura keeps its existing hosting and database. CallBridge's private operator can run on your computer for the pilot. Do not leave it publicly exposed without its access code.

## Required configuration (no secrets in GitHub)

| Where | Name | Purpose |
| --- | --- | --- |
| Aura, server only | `CALLBRIDGE_STORAGE_TOKEN` | New random 32+ character secret for this queue only |
| Aura, server only | `CALLBRIDGE_CALLBACK_ENABLED` | Initially `false`; enable only when the private operator can read the deployed queue |
| Private CallBridge | `STORAGE_BACKEND` | `aura` |
| Private CallBridge | `AURA_STORAGE_URL` | `https://www.auramanager.app/api/internal/callbridge` |
| Private CallBridge | `AURA_STORAGE_TOKEN` | Same dedicated queue secret as Aura |
| Private CallBridge | `CALLBRIDGE_ADMIN_TOKEN` | A different random 24+ character operator access code |
| Private CallBridge | `CALLBRIDGE_PUBLIC_DEMO` | `false` |
| Private CallBridge | `CALLE_DRY_RUN` | Keep `true` until a real test is explicitly approved |
| Private CallBridge, live test only | `CALLE_API_KEY` | Enter privately, never in the frontend or this document |
| Private CallBridge, live test only | `CALLBRIDGE_ALLOWED_PHONES` | The explicitly consenting tester's own international-format number |

The Python app reads process environment variables, not `.env` files automatically. A queue token is not a CALL-E API key, an Aura login token, or a Supabase service-role key.

Once Aura is deployed and the queue secret is configured, run `powershell -ExecutionPolicy Bypass -File scripts/start-aura-pilot.ps1` from this project folder. This affects only that PowerShell process; it does not change the machine's saved execution policy. The script asks for hidden secrets and starts in preview mode. The existing CallBridge frontend must be running at port 3000 and pointed at the backend on port 8080. Stop the old backend first if port 8080 is occupied. Adding `-Live` explicitly enables the live-test configuration, but still does not itself place a call. Never invoke live mode until the recipient has consented.

## Acceptance checklist

1. Publish the tested Aura branch with the callback form disabled; verify missing operator credentials return 401.
2. Add the dedicated queue secret privately to both services. Start the private CallBridge operator with live calls disabled and confirm it can list the durable queue.
3. Enable Aura's callback form. Sign in to Aura and submit a consenting tester's request.
4. Refresh the private operator and restart it: the same request should remain.
5. Cancel the request from Aura: dispatch must be refused. Create a fresh consented request and preview it: no call should occur.
6. After explicit approval and private CALL-E setup, make exactly one live test. Refresh its returned call ID; verify the real structured result and that another dispatch is refused.
7. Record a short demonstration with personal information hidden. Update the contest contribution with verified results only, add the public video and complete Devpost submission.

The contest public demo must remain `CALLBRIDGE_PUBLIC_DEMO=true` and `CALLE_DRY_RUN=true`. That mode ignores `STORAGE_BACKEND` and uses a separate in-memory sample store; never put private Aura requests into it.

## Not claimed complete

Publicly enabled Aura integration, verified live call, broad customer-business accounts, CRM integrations, automated marketing and a general production SaaS are not complete. This work prioritizes a controlled end-to-end pilot for the deadline.
