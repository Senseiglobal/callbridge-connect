# Verified Aura callback pilot — September 14, 2026

[Watch the 2:57 demonstration](https://www.youtube.com/watch?v=FKvPDZw4aMw).

This is the author's documented single-call pilot, not a production reliability claim. The public video combines an AI-narrated introduction, the actual Aura form, the real recorded conversation, and the completed result. Background noise was reduced without replacing either speaker's words. The public Render sample is a separate no-call demonstration.

## Verified sequence

1. At 14:54:31 WAT, the signed-in tester saved a new Aura callback request with explicit consent about increasing daily image generation.
2. The operator approved exactly one call, with no retries. The one-shot CallBridge worker checked the unused request, its consent window and its saved owned/test destination, then used the existing atomic-claim dispatch path and official CALL-E Python SDK.
3. CALL-E returned a provider call ID linked to the same Aura request. The provider reported one attempt, from 15:08:01 to 15:10:06 WAT (125 seconds including setup/ringing). Its events contained both AI and recipient speech. The tester confirmed both voices in the recording.
4. After the conversation, CallBridge fetched that same call and validated its genuine structured result. The operator-triggered refresh saved it to Aura's private queue at 15:11:18 WAT.
5. A separate authenticated read confirmed the matching call ID, completed status and nonempty result. Aura's customer page displayed **Call task completed**.

No unrelated direct CLI call or fictional preview result was attached to this request. Private request IDs, provider IDs, phone numbers, credentials and raw call records are deliberately excluded from this public note.

## Outcome and limits

The call clarified a short-film storyboard image-generation request and captured requested human follow-up. No account allowance was changed, no custom price was promised, and no human appointment was booked or automatically scheduled. Any product limit mentioned by the tester is customer-provided context, not independently verified pricing information.

- This verifies one operator-approved callback with manual result refresh, not unattended calling or all failure cases.
- The regular local web server remained preview/live-locked. Only the specifically approved worker process enabled live dispatch.
- An older uncertain SDK submission remains locked for reconciliation. It was not retried or overwritten.
- The private operator can see the saved brief; the customer page currently displays status, not the full brief.
- Supported destinations and receiving-app reliability remain provider-dependent. The successful test used the owner's US virtual number, not direct Nigerian-number delivery or UK forwarding.
- There are no recurring jobs or automatic redials. Public sample mode cannot call or read private Aura records.
