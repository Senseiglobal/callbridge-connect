# Verification status — September 14, 2026

## Verified live Aura pilot

One fresh, explicitly consented Aura request completed one operator-approved CALL-E SDK call on September 14. The conversation contained both the AI and tester's speech. The matching provider result was validated, saved through CallBridge's refresh route, and independently re-read from the same private Aura request. The customer page showed **Call task completed**. See [the precise evidence and limitations](VERIFIED-AURA-CALLBACK.md) and [2:57 demo video](https://www.youtube.com/watch?v=FKvPDZw4aMw).

This does not resolve the older uncertain SDK request, which remains locked and was not retried. It does not prove unattended production calling, broad regional support or completed human follow-up.

## Verified locally

- 29 Python tests passed on September 14, including strict consent, allowlisted context, URL cleanup, masked SQLite and mocked-Firestore reads, no-network preview with live configuration, concurrent dispatch claims, repeated-click blocking, timeout uncertainty, result validation, refresh timestamps, public-demo restrictions, HTTP authentication, Aura storage boundaries, creative-project profile, legacy deadline compatibility, safe error diagnostics and preserving a returned call ID after a storage failure.
- 11 Aura unit/route tests passed in the separate private Aura repository on September 14. They are not included in this public source tree.
- TypeScript `tsc --noEmit` passes.
- Browser verification: create fictional sample → preview → resolve; live button disabled; sample not recorded as a real call; no captured browser errors or warnings.
- Community repository `python scripts/validate_repository.py` passed again on September 14 after updating PR [#511](https://github.com/CALLE-AI/awesome-phone-call-agents/pull/511)'s entry and merging the latest fetched upstream catalogue.
- Production frontend build passed again on September 14 with the Node-server target. Windows sandbox initially denied Nitro's filesystem link tracing; the same build succeeded with the required filesystem access. The existing Vite paths-plugin notice is non-blocking.
- New Python helpers compile, and the Windows credential/startup helpers pass PowerShell syntax parsing. No live helper was executed during publication checks.
- Credential-pattern scans found no matches in the app's candidate source or commit history. Private `data/` and recording files are not tracked; this is a focused publication check, not a comprehensive security audit.

The test suite uses local stores and fake provider responses. These results do not prove a live telephone call or cloud Firestore deployment.

## Verified on Render

- Public URL: [callbridge-connect.onrender.com](https://callbridge-connect.onrender.com/).
- Docker image built and service became live on September 12, 2026 at 22:36 Lagos time, from app commit `6e4676a`.
- Free compute selected ($0/month); automatic deploys off. No paid resources or CALL-E credentials were added.
- Public health response: `ok=true`, `public_demo=true`, `dry_run=true`, `api_key_configured=false`, `call_e_connected=false`.
- Hosted browser flow: fictional create → preview → resolve passed; live calling stayed disabled; no captured browser warnings/errors.
- Free hosting is a demo environment: idle sleep, ephemeral records, and no production availability or real-customer evidence claimed.

## Pending / not claimed

- GitHub Actions verification workflow has not run successfully; the Render build above is separate from that workflow.
- Devpost final submission and the owner's eligibility/rules confirmations. A GitHub contribution and uploaded video are not a final Devpost entry.
- Automated human transfer, calendar booking, CRM or creative-project writeback. Private callback status/result persistence is implemented; broader business integrations are not.
- Real users, revenue or measured business impact.
- Production-grade authentication, retention tools and multi-tenant operation.

## Evidence handling for future authorized tests

Record the timestamp, app handoff ID, CALL-E run ID, final provider status, whether the task completed, and a redacted result screenshot. Review output against what was said. Keep raw recordings, phone numbers and transcripts out of GitHub. `evidence/private/` is ignored for private local artifacts; do not share its contents automatically.

Public evidence should show the genuine result, not the sample preview. Do not claim external actions such as a booked appointment or a completed project deliverable unless independently verified.
