# CallBridge Python backend

The backend for CallBridge Connect, an opted-in music-release check-in workflow using the official CALL-E Python SDK.

See the [project README](../../../README.md) for the full frontend, container and deployment instructions, [live-test guide](../../../docs/LIVE-TEST.md) for explicit call setup, and [verification status](../../../docs/VERIFICATION.md) for tested versus unverified behavior.

## Safe local run

Install Python 3.12+ and run from the repository root:

```sh
python -m pip install -r apps/python/callbridge/requirements.txt
python apps/python/callbridge/app.py
```

By default this binds to localhost:8080 in preview mode. The primary frontend runs separately on localhost:3000. The legacy page on port 8080 is a preview fallback.

## Tests (never dial)

```sh
python -m unittest discover -s apps/python/callbridge -v
```

## API

GET /healthz reports configuration, not proof of a verified CALL-E session.

Operator endpoints require the separate CALLBRIDGE_ADMIN_TOKEN bearer token when configured:

- POST /api/handoffs: validate and store consented request; no call.
- POST /api/demo: create fictional sample; no call.
- GET /api/handoffs and GET /api/handoffs/:id: masked request/result views.
- POST /api/handoffs/:id/dispatch: mode must be preview or live. Preview is always local; live has all server-side gates.
- POST /api/handoffs/:id/refresh: query the stored CALL-E run; does not create a call.
- POST /api/handoffs/:id/resolve: operator closes a non-running request; does not assert another call occurred.
- POST /api/integrations/aura/handoff: authenticated using AURA_INTEGRATION_TOKEN, accepts the same request shape, never auto-dispatches.

```json
{
  "business_name": "Aura Manager",
  "visitor_name": "Demo Artist (fictional)",
  "phone": "+12025550123",
  "reason": "I am blocked on cover artwork for my upcoming single.",
  "page_url": "https://www.auramanager.app/",
  "consent": true,
  "context": {
    "project_phase": "pre-release",
    "release_window": "14 days",
    "source": "release_checkin_cta"
  }
}
```

The sample number is reserved for fiction, not a live test target. URLs lose query strings/fragments; unknown context keys are rejected. Never submit passwords, keys, private lyrics or full vault records.

## Side effects, persistence and cancellation

Only live dispatch calls CALL-E. It uses an atomic per-request claim and idempotency key. Unknown provider outcomes require manual reconciliation; no automatic retry, recurring schedule or background dialing exists. There is no post-dispatch hang-up API in this app.

CALLE_API_KEY stays server-side. Live calls also require CALLE_DRY_RUN=false, a 24+ character CALLBRIDGE_ADMIN_TOKEN, and CALLBRIDGE_ALLOWED_PHONES. A private hosted service needs HTTPS. Public demo mode uses a separate in-memory store, accepts fictional requests only and cannot dial.

SQLite stores the full number privately because it is needed to dial; API list/detail and summaries mask phone displays. Keep its data directory private, on a persistent disk for a live pilot. Optional STORAGE_BACKEND=firestore uses Google Cloud service credentials and IAM and is not live-cloud verified. No encryption-at-rest or full lifecycle/retention feature is claimed by this app itself.
