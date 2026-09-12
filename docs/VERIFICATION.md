# Verification status — September 12, 2026

## Verified locally

- 15 Python tests: strict consent, allowlisted context, URL cleanup, masked SQLite and mocked-Firestore reads, no-network preview with live configuration, concurrent dispatch claims, repeated-click blocking, timeout uncertainty, result validation, refresh timestamps, public-demo restrictions and HTTP authentication.
- TypeScript `tsc --noEmit` passes.
- Browser verification: create fictional sample → preview → resolve; live button disabled; sample not recorded as a real call; no captured browser errors or warnings.
- Community repository `python scripts/validate_repository.py` passed before opening draft PR [#511](https://github.com/CALLE-AI/awesome-phone-call-agents/pull/511).
- Production frontend build passes with the Node-server target. Windows sandbox initially denied Nitro's filesystem link tracing; the same build succeeded with the required filesystem access.

The test suite uses local stores and fake provider responses. These results do not prove a live telephone call or cloud Firestore deployment.

## Pending / not claimed

- First real CALL-E call and actual structured output.
- Public deployment and its hosted URL.
- Docker image build/runtime: configured but not yet executed; no local Docker runtime. Hosted CI has not run, so no hosted CI success is claimed.
- User video and Devpost final submission.
- Real Aura website integration, automated human transfer, calendar booking, CRM/Aura writeback.
- Real users, revenue or measured business impact.
- Production-grade authentication, retention tools and multi-tenant operation.

## Evidence to collect after the authorized test

Record the timestamp, app handoff ID, CALL-E run ID, final provider status, whether the task completed, and a redacted result screenshot. Review output against what was said. Keep raw recordings, phone numbers and transcripts out of GitHub. `evidence/private/` is ignored for private local artifacts; do not share its contents automatically.

Public evidence should show the genuine result, not the sample preview. Do not claim external actions such as a booked appointment or a completed release asset unless independently verified.
