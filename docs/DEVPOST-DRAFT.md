# CallBridge Connect — draft submission

Owner review required. The public no-call demo is deployed on Render. One private, operator-approved Aura callback was verified on September 14, 2026; see [the evidence record](VERIFIED-AURA-CALLBACK.md). This is a single controlled pilot, not a production reliability claim. Never present preview output as evidence of a real call.

## Elevator pitch

Turn a creator's opted-in project check-in into an AI phone conversation and a clear next-action brief, powered by CALL-E.

## Inspiration

Creative work can stall even with a project plan. Aura Manager is an AI workspace for creative projects. We wanted to explore a phone-based check-in that can clarify a blocker or product question and identify when human help is needed, without pretending an AI is a human team member.

## What it does

CallBridge receives an explicitly consented check-in request with minimal project context. An operator can inspect a no-call sample preview or confirm a real call to an approved test number. The CALL-E agent asks about the blocker, deadline risk, one concrete next action, and whether the creator wants human follow-up. CallBridge displays the structured result and provider run ID for operator review.

The public demonstration is deliberately safe: fictional inputs, labelled sample outputs and no live calling. The private operator workflow is separately gated. CallBridge does not promise live human transfer, automatically book appointments, change accounts or write a project plan back into Aura.

## How we built it

The React/TanStack frontend began in Lovable and was adapted with Codex to a Python backend. The official CALL-E Python SDK creates calls with a result schema and stable idempotency key, then fetches the result. The connected Aura pilot reuses Aura's existing sign-in and durable database through a narrow private queue API. Local SQLite and optional Firestore adapters are also included. A container packages the separate no-call sample UI and API behind one public address. Tests use fake providers and require no telephony credentials.

## Challenges

The key challenge was keeping the state honest. A sample preview must never reach live code. Repeated clicks must not create repeated calls. A provider timeout must not become a silent retry, and an incomplete response must not be labelled completed. We added atomic dispatch claims, schema checks, uncertain-result handling, authenticated operator access and real event timestamps.

## Accomplishments

We built a focused consent-to-brief workflow, corrected the integration context to creative-project support, protected the phone-number display boundary and added automated no-call tests. A fresh Aura request led to one approved SDK call with two-way audio. An operator refresh saved the structured result to that same request, and an independent read confirmed persistence. The demonstration shows the actual request, real recorded exchange and completed status. No account limits were changed and no human appointment was booked. The reusable contribution includes setup documentation, safe defaults, deployment configuration and a clear boundary between AI conversation and human decisions.

## What we learned

Connecting a voice API is only one part of a reliable phone workflow. Consent, side effects, failure states and evidence deserve the same attention as the conversation itself. A provider saying a task is complete is still a report that a human should review, not a guarantee of real-world impact.

## What's next

Extend the verified single-user pilot only after further consent, operational review and reconciliation of older uncertain submissions. Future work includes broader operator roles, retention controls, consent verification and measuring useful follow-ups. No revenue, customer count, conversion improvement or general production reliability is claimed today.

## Fields to complete before submitting

- Public contest PR URL: https://github.com/CALLE-AI/awesome-phone-call-agents/pull/511.
- Publicly viewable video URL: https://www.youtube.com/watch?v=FKvPDZw4aMw (2:57).
- CALL-E account email: owner enters privately in Devpost.
- Hosted demo URL: https://callbridge-connect.onrender.com/ — fictional no-call demo, verified September 12, 2026.
- Real call evidence: [verified single Aura callback](VERIFIED-AURA-CALLBACK.md); private identifiers, raw recordings and credentials are not committed.

Built with: CALL-E Python SDK, Python, React, TypeScript, TanStack Start/Query/Router, Tailwind CSS, SQLite, Docker, Render; Aura's existing Supabase-backed sign-in/database through its private API; optional Google Cloud Firestore (not verified against a real cloud project).
