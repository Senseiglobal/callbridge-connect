# One authorized live test

This procedure can lead to one real outbound call and use CALL-E credits. Do not use the fictional sample number. Use a phone you own, or a recipient who has clearly consented to this specific AI call.

## Windows helper

First install dependencies and start the frontend as described in the root README. Stop the old Python backend with Ctrl+C in its terminal (do not stop unrelated programs).

Open PowerShell in this repository and run:

```powershell
./scripts/start-live.ps1
```

The script privately prompts for your CALL-E API key and a **separate** operator access code of at least 24 characters. Choose an access code you can enter again in the Settings screen. It also asks for your permitted test number in international format, e.g. `+234...` for Nigeria. It does not place a call.

1. Open `http://localhost:3000/settings`. Enter only the separate operator access code — never your CALL-E API key.
2. Create a new check-in with your real permitted number and recorded consent. Use fictional, nonsensitive release context.
3. Preview if desired. It remains a sample even with live mode enabled.
4. Select **Place live call**, verify the masked number and consent, then confirm.
5. Answer your phone. CALL-E should identify itself as AI. Describe the blocker and confirm a next action. Do not give passwords, payment details or private lyrics.
6. Press **Refresh CALL-E result** after the conversation. A queued call is not completed; an unknown/failed result is not a success.
7. Save the handoff ID, CALL-E run ID, timestamps and a redacted screenshot of the result for judging. Keep recordings/transcripts private unless the speaker agreed to publication.
8. Stop the backend with Ctrl+C after testing. The helper removes its process-level secrets when it exits. Sign out of operator Settings. No recurring calls are created.

## If something fails

- 401/authentication: check the API key in the CALL-E dashboard. CLI login is not the SDK key.
- Live button locked: check the four gates: API key, live flag, 24+ character operator code, number allowlist. The public demo cannot dial.
- Needs review / no run ID: the provider might have accepted the call before a timeout. Check CALL-E's dashboard before creating another request. This app intentionally blocks an automatic repeat.
- Completed but incomplete answers: retain the result honestly; do not fill unknown answers as though the artist said them.

There is no in-app hang-up command. Stopping this server after CALL-E accepts a call may not stop the phone call. Before confirmation, cancel the dialog to avoid the side effect.

For a private cloud pilot, use HTTPS, an authenticated console, secret environment variables and persistent SQLite on one instance or properly configured Firestore. **Do not turn the shared free sample demo into a real-customer database.**
