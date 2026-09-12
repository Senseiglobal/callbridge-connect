# Aura Manager integration profile

Source: [Aura Manager's homepage](https://www.auramanager.app/), checked September 12, 2026, and the owner's clarification.

Aura is an AI workspace for creative projects. It serves creators, artists and founders across the creative process; music is one possible format, not its defining category. Do not describe it as a music-release app.

## CallBridge's role

CallBridge is the callback and human-handoff tool, not Aura's creative engine. The proposed integration offers an explicitly requested AI callback for a project blocker or product question and returns a brief for human follow-up. It does not impersonate the website's human support option or promise instant transfer.

The fictional demo is a creator asking for help with a short-film storyboard and production plan. New payloads use `project_phase`, `project_deadline` and `source`. For compatibility, the API accepts `release_window` as a deprecated deadline alias; old stored requests remain unchanged.

No live Aura website integration, plan-specific entitlement, pricing promise or automatic project writeback is claimed. Verify product details against Aura's current information before answering customer questions; otherwise defer to a human.
