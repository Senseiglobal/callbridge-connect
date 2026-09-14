# Aura pilot: what is ready and how to switch it on

Updated 14 September 2026. This is the focused Aura integration, not self-service accounts for every business.

## Latest verified result

On 14 September, a fresh, explicitly approved Aura request completed one SDK-driven call to the tester's own receiving number. Both speakers were audible, and an operator refresh saved the structured result to that same durable Aura request; an independent read confirmed it. See the [redacted verification record](VERIFIED-AURA-CALLBACK.md) and [2:57 demonstration](https://www.youtube.com/watch?v=FKvPDZw4aMw). No further test call is required to reproduce this submission evidence.

This is one verified operator-run pilot, not a production reliability claim. The historical September 13 attempts below remain separate; the older uncertain request was not retried, reset, or relabelled as successful.

## Built and connected

- An Aura sign-in-protected callback API and a separate, clearly labelled AI form at `/callback`.
- An isolated durable queue in Aura's existing database. The migration has been applied; permissions and rollback-only transition checks passed.
- A private CallBridge storage adapter that talks to Aura's narrow queue API. It never needs Aura's database credentials.
- Explicit consent, masked numbers, owner-scoped status/cancellation, one active request per owner, expiring dispatch eligibility and single-claim protection.
- 29 Python tests and 11 Aura unit/route tests passed locally, rerun at approximately 20:20 Lagos time on 13 September. Use `.venv/Scripts/python.exe` for the Python tests; the system Python does not have the optional Firestore dependency installed. These tests use doubles and never dial. Earlier typechecking, focused lint and Aura's production build passed with placeholder credentials; they do not prove a live integration.

Aura source is kept in its own private repository/worktree; it is not copied into this public repository. Its callback form is now live at https://www.auramanager.app/callback. The private local operator has successfully read the production queue with a dedicated credential. Anonymous GET and POST requests returned 401. A signed-in tester's consented request was saved, read by the private operator, and remained available after a backend restart. The tester then cancelled it and submitted a new request; the old request is closed and was not dispatched.

The user's encrypted CALL-E API key has been loaded by the restarted private backend. The local health check confirms `api_key_configured=true`, `dry_run=true`, `public_demo=false` and `storage_backend=aura`. A read-only authenticated SDK request (`goals.list(limit=1)`) also succeeded without placing a call. It confirms read access, not successful outbound calling.

## Historical September 13 Aura SDK submission: unconfirmed — do not retry

At approximately 19:05 Lagos time on 13 September 2026, the user explicitly approved one live test using the new request. A one-shot private worker invoked CallBridge's existing consent/allowlist/atomic-claim dispatch logic. The regular web console stayed calls-locked. The new request was claimed, but dispatch returned `needs_review` with no confirmed provider call ID. The SDK/submission exception was handled by the existing generic safety error; its exact cause was not retained. The provider's signed-in call-records page was refreshed and showed zero records, but that alone cannot prove that no call was accepted. No retry was made.

Keep this older request locked. Do not repeat the worker, reset the request, or create another call to work around its unknown outcome. Reconcile with CALL-E first. This particular request's outcome remains unverified; the separately approved September 14 request has its own verified evidence above. The worker returns a nonzero exit status for an unconfirmed submission. The tester confirmed that their phone did not ring for the September 13 attempt, and the dashboard showed no recent calls at that time. That does not provide a definitive server-side outcome for that API submission.

After this attempt, local error handling was improved to retain safe HTTP status/error codes, distinguish timeouts from storage failures, and preserve an observed provider ID if the first storage update fails. Exception messages, credentials and raw error bodies are not copied into these diagnostics. These changes were present for the successful fresh September 14 test, but cannot retroactively recover the older attempt's missing error details.

## Historical September 13 CLI test: provider connected, recipient not reached

The separate CALL-E CLI browser authorization subsequently completed. One explicitly approved direct CLI test to the tester's own US Sonetel trial number ran at approximately 20:00 Lagos time on 13 September. CALL-E returned a call ID and a terminal `COMPLETED` state after approximately 46 seconds. Its summary and transcript show an automated Sonetel trial/forwarding announcement, not a conversation with the tester. No redial or follow-up was made. Process completion is not evidence of a successful customer conversation.

This direct CLI test did not originate from the Aura queue and its result was not saved as an Aura callback completion. Do not attach its call ID to the earlier uncertain Aura request. The dashboard now shows the one separate US test record; that does not reconcile the earlier API submission.

Receiving-side inspection found blocked notification permission, failure to obtain Sonetel's notification token for its phone connection, and an unexpectedly closed SIP WebSocket in the embedded browser. These are likely contributing problems, not proof of the only cause. The tester must open Sonetel in a regular browser, sign in, allow microphone and notification access, and keep the Calls page open. No trial-number purchase or paid forwarding was enabled.

At approximately 20:19 Lagos time, the private operator remained healthy, authenticated and connected to Aura's durable queue in dry-run mode. It listed one closed request and one `needs_review` request with a dispatch timestamp but no provider ID. No queue state was changed during this check.

## Gates for any future test — not required for the submission video

1. Obtain a new, specific purpose and explicit approval for exactly one call to the recipient's own supported receiving number. Previous one-call approvals have been consumed; no automatic redials are allowed.
2. Reconcile an uncertain submission before repeating its intent. Never reset a started request, change its destination, or create a replacement to bypass an unknown outcome. The older September 13 request remains locked.
3. Use a fresh eligible request only for a separately authorized test, with current consent and no previous dispatch. The one-shot helper requires its exact ID and an explicit approval flag, then checks age, consent and status and binds the worker's allowlist to that saved destination.
4. Run through CallBridge's SDK adapter; retain the returned provider ID, retrieve that same call, and verify a genuine conversation plus a valid structured result persisted to the matching Aura request.
5. Record only verified behavior with permission and personal details hidden. Keep sample output labelled as fictional; a provider's terminal state alone is not proof of a two-way conversation.

Provider reconciliation question (send privately only after owner approval): "Our Python SDK submission at approximately 18:05 UTC on 13 September 2026 returned no confirmed call ID. It used a stable CallBridge idempotency key, and we have not retried it. Can you confirm whether that submission created a call and return its ID/terminal outcome, or confirm rejection? A separate successful connection to a US trial-number announcement at approximately 19:00 UTC is not the submission we need reconciled." Supply the original request's idempotency key only through the authenticated support channel; never send API keys or authorization tokens.

Verified Aura release: `dpl_31ZZFbyeXpug6YtBEAjPUuBbXd5V` (source `ea563cf`). The previous disabled pilot release is `dpl_FyGYDZUSxRi6jyA4ZVF5BaTd2tzc`. The earlier pre-pilot production URL was `aura-manager-57wzgbj0d-auramanager.vercel.app`; retain it for an emergency rollback. The public Render sample demo remains independent.

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

CallBridge's Python SDK uses a CALL-E API key. The optional `calle` command-line browser login is a separate connection: it does not configure the app's key and is not a prerequisite for the SDK-backed app. Being signed into the CALL-E dashboard or adding credits also does not configure this key.

After creating a key in CALL-E's **API keys** page, run `powershell -ExecutionPolicy Bypass -File scripts/save-calle-key.ps1` from this project folder. Paste only at its masked prompt, never into chat, source code or a screenshot. The helper makes no network requests and saves a Windows-user-encrypted SecureString to `data/calle-api-key.xml`, excluded from Git and Docker. It refuses to overwrite an existing key. Clear the clipboard afterwards. Saving a key is not proof that CALL-E has accepted it, and does not enable or place calls.

The queue secret and operator code are already stored under `data/aura-pilot-credentials.xml`, encrypted for this Windows user and excluded from Git and Docker. They are not printed in chat or kept in a plaintext secret file. Do not copy this credential file to another machine expecting it to work; do not rerun the setup helper to rotate a working credential.

To restart the private backend, run `powershell -ExecutionPolicy Bypass -File scripts/start-aura-pilot.ps1` from this project folder. This affects only that PowerShell process; it does not change the machine's saved execution policy. The script reuses encrypted local credentials, loads the saved CALL-E key if present, and starts in preview mode with calls locked. Without a saved queue credential file, it asks for hidden secrets. The CallBridge frontend must be running at port 3000 and pointed at the backend on port 8080. Stop an old backend first if port 8080 is occupied. Adding `-Live` explicitly enables the live-test configuration and prompts for an approved number (and a hidden CALL-E key only if none is saved), but still does not itself place a call. Never invoke live mode until the recipient has consented.

To unlock the browser console, run `powershell -ExecutionPolicy Bypass -File scripts/copy-aura-access-code.ps1`, paste into http://localhost:3000/settings and click **Unlock operator console**. This copies only the operator code to your clipboard; do not paste it into chat or the public demo. Clear the clipboard afterwards.

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

Broad customer-business accounts, CRM integrations, automated marketing and a general production SaaS are not complete. One owned-number Aura callback is verified, with manual operator dispatch and result refresh. Existing Aura sign-in is reused; no new cross-business account platform was built. The successful test did not change account limits or book a human follow-up.
