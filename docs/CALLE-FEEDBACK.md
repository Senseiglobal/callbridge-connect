# CALL-E feedback draft — owner review before survey submission

These are observed integration issues and suggestions, not an invented live-call evaluation.

## Brokered login expiry

Observed during setup: the authorization page displayed `session_expired` / “The brokered login session has expired.” A later local auth-status check reported usable cached credentials, while a remote MCP initialization returned HTTP 401.

Expected: status distinguishes a locally cached token from a successfully verified remote session, and provides a direct restart-login action on expiry.

Suggested reproduction: start browser login, let the brokered session expire, revisit the authorization page, then compare local auth status with a remote MCP tool-list request. Do not include raw authorization URLs, codes or tokens in the report.

## Clarify SDK key versus CLI OAuth

The app uses the official Python SDK with `CALLE_API_KEY`; the portable skill uses CLI OAuth. A successful CLI browser login does not by itself supply the application's SDK key. A short side-by-side setup table would help new builders.

## Safe state-handling examples

We would benefit from small official examples showing `calls.create`, persisted call ID, idempotency, `calls.get`, uncertain submission recovery and validated structured results. Examples should explicitly separate deterministic sample preview from real calls, and distinguish provider completion from a successfully achieved task.

One operator-approved Aura SDK callback was verified on September 14, 2026, with two-way audio and a structured result persisted to the same request. See [the bounded evidence record](VERIFIED-AURA-CALLBACK.md). This does not establish a call-quality benchmark, latency guarantee, conversion rate or production reliability.
