# Verification status — September 12, 2026

## Verified locally

- 18 Python tests: strict consent, allowlisted context, URL cleanup, masked SQLite and mocked-Firestore reads, no-network preview with live configuration, concurrent dispatch claims, repeated-click blocking, timeout uncertainty, result validation, refresh timestamps, public-demo restrictions, HTTP authentication, creative-project profile and legacy deadline compatibility.
- TypeScript `tsc --noEmit` passes.
- Browser verification: create fictional sample → preview → resolve; live button disabled; sample not recorded as a real call; no captured browser errors or warnings.
- Community repository `python scripts/validate_repository.py` passed before opening draft PR [#511](https://github.com/CALLE-AI/awesome-phone-call-agents/pull/511).
- Production frontend build passes with the Node-server target. Windows sandbox initially denied Nitro's filesystem link tracing; the same build succeeded with the required filesystem access.

The test suite uses local stores and fake provider responses. These results do not prove a live telephone call or cloud Firestore deployment.

## Verified on Render

- Public URL: [callbridge-connect.onrender.com](https://callbridge-connect.onrender.com/).
- Docker image built and service became live on September 12, 2026 at 22:36 Lagos time, from app commit `6e4676a`.
- Free compute selected ($0/month); automatic deploys off. No paid resources or CALL-E credentials were added.
- Public health response: `ok=true`, `public_demo=true`, `dry_run=true`, `api_key_configured=false`, `call_e_connected=false`.
- Hosted browser flow: fictional create → preview → resolve passed; live calling stayed disabled; no captured browser warnings/errors.
- Free hosting is a demo environment: idle sleep, ephemeral records, and no production availability or real-customer evidence claimed.

## Pending / not claimed

- First real CALL-E call and actual structured output.
- GitHub Actions verification workflow has not run successfully; the Render build above is separate from that workflow.
- User video and Devpost final submission.
- Real Aura website integration, automated human transfer, calendar booking, CRM/Aura writeback.
- Real users, revenue or measured business impact.
- Production-grade authentication, retention tools and multi-tenant operation.

## Evidence to collect after the authorized test

Record the timestamp, app handoff ID, CALL-E run ID, final provider status, whether the task completed, and a redacted result screenshot. Review output against what was said. Keep raw recordings, phone numbers and transcripts out of GitHub. `evidence/private/` is ignored for private local artifacts; do not share its contents automatically.

Public evidence should show the genuine result, not the sample preview. Do not claim external actions such as a booked appointment or a completed project deliverable unless independently verified.
