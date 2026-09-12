# CallBridge Connect

Consent-first AI phone check-ins that turn a music-release blocker into a next-action brief.

Built for the CALL-E: Your Code Is Calling challenge. The first integration example is **Aura Manager**, a music-release strategy SaaS for independent artists. The Aura website integration is proposed; this repository does not modify or publish Aura's private code.

## What works

- Artist check-in request with explicit consent, release stage and release window.
- A clearly labelled, deterministic **sample preview that never contacts CALL-E**.
- A Python adapter using the official `calle-ai` SDK to create and fetch an authorized live call.
- Operator confirmation, approved-number allowlist, atomic dispatch claim and provider idempotency key.
- Structured intent, urgency, deadline risk, next action and requested human follow-up.
- Honest failure/uncertain states, provider run ID, real timestamps, masked phone displays.
- React dashboard, request/detail screens, settings and server-to-server Aura integration contract.

**Verification status:** no successful live call is claimed yet. Local tests use fake providers. Public demo results are illustrative, not customer evidence. The human follows up manually; no live transfer, account changes, calendar booking or automatic Aura writeback is implemented.

## Try the safe public demo

[Deploy the sample on Render](https://render.com/deploy?repo=https://github.com/Senseiglobal/callbridge-connect)

Review and approve the hosting configuration in your own account. The blueprint selects a free web service with live calls disabled. Availability and account requirements depend on Render. Demo records are fictional, in memory, and reset on restart. Do not enter customer information in a public demo. Deployment is not completed merely by this link existing.

For a local container:

```sh
docker build -t callbridge .
docker run --rm -p 8080:8080 callbridge
```

Open `http://localhost:8080`, select **New check-in → Create sample check-in → Preview callback**. Marking a sample resolved does not count as a completed real call.

## Develop locally

Requirements: Python 3.12+, Node.js 22+, Bun, two terminal windows. No API key is needed for preview.

From the repository root, start the backend:

```sh
python -m venv .venv
# Windows: .venv\Scripts\python.exe; macOS/Linux: .venv/bin/python
.venv\Scripts\python.exe -m pip install -r apps/python/callbridge/requirements.txt
.venv\Scripts\python.exe apps/python/callbridge/app.py
```

In the second terminal (PowerShell):

```powershell
cd apps/typescript/callbridge-web
bun install --frozen-lockfile
$env:VITE_CALLBRIDGE_API_URL = 'http://127.0.0.1:8080'
bun run dev -- --host 127.0.0.1 --port 3000
```

Open `http://localhost:3000`. The public demo container includes both frontend and backend; local development uses two ports. The old Python-only static page is a preview fallback, not the primary operator UI.

## Live calling — explicit side effect

Follow [the live test guide](docs/LIVE-TEST.md). Startup, preview, CI and integration requests never dial. Only an authenticated `mode: live` dispatch does. Calls can consume CALL-E credits. Use only an owned/authorized test number with the recipient's explicit consent.

CALL-E keys stay on the Python server. A separate operator access code protects the private console. Demo deployments never enable calls, even if a key is accidentally configured. The SDK uses `calls.create` and `calls.get`, not the CLI's OAuth credentials.

Once accepted by CALL-E, a call cannot be undone from this app. Close the confirmation before dispatch to cancel; after dispatch, check provider controls and do not assume stopping CallBridge hangs up the call. There are no recurring jobs or automatic redials. Ambiguous submissions stay locked for human reconciliation.

## Architecture and limits

Browser → authenticated Python API → CALL-E SDK → phone conversation → operator refresh → structured brief.

- `apps/typescript/callbridge-web`: Lovable-origin React/TanStack frontend, adapted for the Python API.
- `apps/python/callbridge`: backend, SDK boundary, SQLite and optional Firestore storage, tests.
- `scripts/serve.mjs`: container gateway and private service lifecycle.
- `render.yaml`: safe public demo deployment, no secrets required.
- `.github/workflows/verify.yml`: backend tests, TypeScript check, frontend build and Docker smoke checks. No CALL-E credentials.

Live pilot storage: SQLite requires a persistent disk and a single service instance. Firestore is optional and requires Google credentials/IAM; its real cloud deployment is not verified. The public demo is intentionally ephemeral. This is a single-operator hackathon MVP, not a production multi-tenant calling platform. Before real customers: add identity and role management, retention/deletion tooling, abuse protection, verified consent records and appropriate regional calling/recording review. Free-text input is not a secret detector; never paste secrets or private lyrics.

Google Cloud and revenue/P&L evidence belong to the separate 90-day business competition; they are not requirements of this CALL-E entry.

## Submission materials

- [Start here — nontechnical owner checklist](docs/START-HERE.md)
- [Live call checklist](docs/LIVE-TEST.md)
- [Devpost draft](docs/DEVPOST-DRAFT.md)
- [Three-minute video script](docs/DEMO-SCRIPT.md)
- [Verification and evidence status](docs/VERIFICATION.md)
- [CALL-E feedback draft](docs/CALLE-FEEDBACK.md)

Official references: [CALL-E challenge rules](https://call-e.devpost.com/rules), [CALL-E integration documentation](https://github.com/CALLE-AI/call-e-integrations), [community submission repository](https://github.com/CALLE-AI/awesome-phone-call-agents), [Render deployment documentation](https://render.com/docs/deploy-to-render).
