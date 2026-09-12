# CallBridge frontend

React / TypeScript / TanStack Start UI, initially generated with Lovable and adapted to the CallBridge Python backend. See the [root README](../../../README.md) and [owner checklist](../../../docs/START-HERE.md).

```powershell
bun install --frozen-lockfile
$env:VITE_CALLBRIDGE_API_URL = 'http://127.0.0.1:8080'
bun run dev -- --host 127.0.0.1 --port 3000
```

The backend must be started separately. For production, the root Dockerfile builds with VITE_CALLBRIDGE_API_URL=/ and proxies API calls on the same origin.

Without that environment variable the browser uses fictional sample state only. It cannot place a call. Never put CALLE_API_KEY in a VITE_ variable. Only the separate operator access code is entered in Settings; it is stored in session storage and must be used over HTTPS outside localhost.

```sh
bunx tsc --noEmit
bun run build
```

Live buttons require backend readiness and confirmation. Sample previews are marked as such, and metrics do not count resolved samples as completed CALL-E calls.
