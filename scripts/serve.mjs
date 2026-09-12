// One public port, two private services. Requires a TLS-terminating host outside localhost.
import http from "node:http";
import { spawn } from "node:child_process";

const publicDemo = process.env.CALLBRIDGE_PUBLIC_DEMO === "true";
if (!publicDemo && (process.env.CALLBRIDGE_ADMIN_TOKEN?.length ?? 0) < 24) {
  throw new Error("Private deployment requires a 24+ character operator access code");
}
const frontendEnv = { ...process.env, PORT: "3000", HOST: "127.0.0.1", NITRO_PORT: "3000", NITRO_HOST: "127.0.0.1" };
for (const key of Object.keys(frontendEnv)) {
  if (/^(CALLE_|CALLBRIDGE_ADMIN_TOKEN|AURA_INTEGRATION_TOKEN|GOOGLE_APPLICATION_CREDENTIALS)/.test(key)) delete frontendEnv[key];
}
const children = [
  spawn("python", ["backend/app.py"], { stdio: "inherit", env: { ...process.env, HOST: "127.0.0.1", PORT: "8081" } }),
  spawn("node", ["web/server/index.mjs"], { stdio: "inherit", env: frontendEnv }),
];
let stopping = false;
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  const isApi = pathname.startsWith("/api/") || pathname === "/healthz";
  const headers = { ...req.headers };
  if (!isApi) delete headers.authorization;
  const upstream = http.request({ hostname: "127.0.0.1", port: isApi ? 8081 : 3000,
    path: req.url, method: req.method, headers }, (reply) => {
      res.writeHead(reply.statusCode, { ...reply.headers, "X-Content-Type-Options": "nosniff", "Referrer-Policy": "same-origin" });
      reply.pipe(res);
    });
  upstream.on("error", () => {
    if (!res.headersSent) res.writeHead(503, { "Content-Type": "text/plain" });
    res.end("CallBridge is starting. Please refresh shortly.");
  });
  upstream.setTimeout(60000, () => upstream.destroy());
  req.on("aborted", () => upstream.destroy());
  req.pipe(upstream);
});
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  server.close();
  for (const child of children) child.kill("SIGTERM");
  setTimeout(() => process.exit(code), 1000).unref();
}
for (const child of children) {
  child.on("error", () => stop(1));
  child.on("exit", (code) => { if (!stopping) stop(code || 1); });
}
process.on("SIGTERM", () => stop());
process.on("SIGINT", () => stop());
server.listen(Number(process.env.PORT ?? 8080), "0.0.0.0", () => console.log("CallBridge gateway ready"));
