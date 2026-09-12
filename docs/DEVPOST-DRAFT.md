# CallBridge Connect — draft submission

Owner review required. Do not claim a live call, hosted deployment or production Aura integration until verified. Replace the readiness note after the real test; never present preview output as evidence.

## Elevator pitch

Turn an artist's opted-in release check-in into an AI phone conversation and a clear next-action brief, powered by CALL-E.

## Inspiration

Independent artists can have a release plan and still get stuck between planning and taking the next step. Aura Manager is a music-release strategy SaaS for those artists. We wanted to explore a phone-based check-in that can clarify a blocker and identify when human help is needed, without pretending an AI is a human strategist.

## What it does

CallBridge receives an explicitly consented check-in request with minimal release context. An operator can inspect a no-call sample preview or confirm a real call to an approved test number. The CALL-E agent asks about the blocker, deadline risk, one concrete next action, and whether the artist wants human follow-up. CallBridge displays the structured result and provider run ID for operator review.

The public demonstration is deliberately safe: fictional inputs, labelled sample outputs and no live calling. The private operator workflow is separately gated. CallBridge does not promise live human transfer, automatically book appointments, change accounts or write a release strategy back into Aura.

## How we built it

The React/TanStack frontend began in Lovable and was adapted with Codex to a Python backend. The official CALL-E Python SDK creates calls with a result schema and stable idempotency key, then fetches the result. SQLite persists local pilot requests; optional Firestore support is included. A container packages the UI and API behind one public address. Tests use fake providers and require no telephony credentials.

## Challenges

The key challenge was keeping the state honest. A sample preview must never reach live code. Repeated clicks must not create repeated calls. A provider timeout must not become a silent retry, and an incomplete response must not be labelled completed. We added atomic dispatch claims, schema checks, uncertain-result handling, authenticated operator access and real event timestamps.

## Accomplishments

We built a focused consent-to-brief workflow, corrected the integration context to music-release strategy, protected the phone-number display boundary and added automated no-call tests. The reusable contribution includes setup documentation, safe defaults, deployment configuration and a clear boundary between AI conversation and human decisions.

## What we learned

Connecting a voice API is only one part of a reliable phone workflow. Consent, side effects, failure states and evidence deserve the same attention as the conversation itself. A provider saying a task is complete is still a report that a human should review, not a guarantee of real-world impact.

## What's next

Complete the first owned-number live test, add an opt-in CTA to Aura only with explicit approval, and run a small artist pilot. Future work includes human identity/roles, retention controls, consent verification and measuring useful follow-ups. No revenue, customer count or conversion improvement is claimed today.

## Fields to complete before submitting

- Public contest PR URL: https://github.com/CALLE-AI/awesome-phone-call-agents/pull/511 (currently draft).
- Public video URL: pending owner recording/upload.
- CALL-E account email: owner enters privately in Devpost.
- Hosted demo URL: pending hosting approval/verification.
- Real call evidence: pending consented test; include redacted run ID/result after verification.

Built with: CALL-E Python SDK, Python, React, TypeScript, TanStack Start/Query/Router, Tailwind CSS, SQLite, Docker; optional Google Cloud Firestore. Only include a hosting service in the final field after actually deploying there.
