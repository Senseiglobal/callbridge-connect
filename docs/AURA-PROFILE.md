# Aura Manager integration profile

Source: [Aura Manager's homepage](https://www.auramanager.app/), checked September 13, 2026, and the owner's clarification.

Aura is an AI workspace for creative projects. It serves creators, artists and founders across the creative process; music is one possible format, not its defining category. Do not describe it as a music-release app.

## CallBridge's role

CallBridge is the callback and human-handoff tool, not Aura's creative engine. The deployed pilot at [Aura's callback form](https://www.auramanager.app/callback) collects a signed-in user's explicit request for one AI callback about a project blocker or product question. The intended call result is a brief for human follow-up. It does not impersonate the website's human support option or promise instant transfer.

The fictional demo is a creator asking for help with a short-film storyboard and production plan. Manual/demo payloads can use `project_phase`, `project_deadline` and `source`. For compatibility, the local API accepts `release_window` as a deprecated deadline alias; old stored requests remain unchanged. Aura's pilot form only collects name, phone, a short question and explicit consent; it does not copy private project records.

The website form, server-only database queue and local operator's authenticated queue connection were verified on September 13. The first consented end-to-end submission and actual CALL-E call remain pending. No plan-specific entitlement, pricing promise, completed customer call or automatic project writeback is claimed. Verify product details against Aura's current information before answering customer questions; otherwise defer to a human.
