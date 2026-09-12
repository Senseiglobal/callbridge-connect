from __future__ import annotations

import json
import hmac
import os
import re
import uuid
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from calle_client import CalleClient
from storage import LocalStore, build_store, now_iso


ROOT = Path(__file__).parent
STATIC = ROOT / "static"
PHONE_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")
store = LocalStore(":memory:") if os.environ.get("CALLBRIDGE_PUBLIC_DEMO", "false").lower() == "true" else build_store()
calle = CalleClient()


def demo_payload() -> dict[str, Any]:
    return {
        "business_name": "Aura Manager",
        "visitor_name": "Demo Artist (fictional)",
        "phone": "+12025550123",
        "reason": "I am blocked on the next action for my upcoming single and want a release check-in.",
        "page_url": "https://www.auramanager.app/",
        "consent": True,
        "context": {"project_phase": "pre-release", "release_window": "14 days", "source": "release_checkin_cta"},
    }


def validate(payload: dict[str, Any], business_name: str = "Aura Manager") -> dict[str, Any]:
    required = ["visitor_name", "phone", "reason", "page_url", "consent"]
    missing = [key for key in required if key not in payload]
    if missing:
        raise ValueError(f"Missing required fields: {', '.join(missing)}")
    if payload["consent"] is not True:
        raise ValueError("The visitor must explicitly consent to a callback")
    phone = str(payload["phone"]).strip()
    if not PHONE_PATTERN.match(phone):
        raise ValueError("Phone must be in E.164 format, for example +12025550123")
    for key in ("visitor_name", "reason", "page_url"):
        if not isinstance(payload[key], str) or not 1 <= len(payload[key].strip()) <= 1500:
            raise ValueError(f"{key} must be non-empty text, at most 1500 characters")
    page = urlparse(payload["page_url"])
    if page.scheme not in {"https", "http"} or not page.hostname or page.username or page.password:
        raise ValueError("page_url must be an HTTP(S) URL without credentials")
    context = payload.get("context", {})
    if not isinstance(context, dict) or set(context) - {"project_phase", "release_window", "source"}:
        raise ValueError("Only project_phase, release_window and source are permitted context")
    if any(not isinstance(value, str) or len(value) > 200 for value in context.values()):
        raise ValueError("Context values must be short text (at most 200 characters)")
    name = payload.get("business_name", business_name)
    if not isinstance(name, str) or not 1 <= len(name.strip()) <= 100:
        raise ValueError("business_name must be 1–100 characters")
    return {
        "id": f"handoff_{uuid.uuid4().hex[:10]}",
        "created_at": now_iso(),
        "business_name": str(payload.get("business_name", business_name)).strip(),
        "visitor_name": str(payload["visitor_name"]).strip(),
        "phone": phone,
        "reason": str(payload["reason"]).strip(),
        "page_url": page._replace(query="", fragment="").geturl(),
        "context": context,
        "consent": True,
    }


def authorize_aura(handler: BaseHTTPRequestHandler) -> None:
    expected = os.environ.get("AURA_INTEGRATION_TOKEN")
    if not expected or not hmac.compare_digest(handler.headers.get("Authorization", ""), f"Bearer {expected}"):
        raise PermissionError("Invalid Aura integration token")


def public_demo() -> bool:
    return os.environ.get("CALLBRIDGE_PUBLIC_DEMO", "false").lower() == "true"


def authorize_console(handler: BaseHTTPRequestHandler) -> None:
    expected = os.environ.get("CALLBRIDGE_ADMIN_TOKEN")
    if expected and not hmac.compare_digest(handler.headers.get("Authorization", ""), f"Bearer {expected}"):
        raise PermissionError("Open Settings and enter the operator access code")


def live_enabled() -> bool:
    return (not public_demo() and not calle.dry_run and bool(os.environ.get("CALLE_API_KEY"))
            and len(os.environ.get("CALLBRIDGE_ADMIN_TOKEN", "")) >= 24
            and bool(os.environ.get("CALLBRIDGE_ALLOWED_PHONES")))


def save_provider(handoff_id: str, response: dict[str, Any]) -> dict[str, Any]:
    status, result = calle.interpret(response)
    run_id = response.get("id") or response.get("call_id")
    if not isinstance(run_id, str) or not run_id:
        status, result, run_id = "needs_review", None, None
    error = None if status in {"calling", "completed"} else (
        "CALL-E did not confirm a successful task. Review this run in the CALL-E dashboard; do not redial automatically.")
    store.update(handoff_id, status, result, run_id, error)
    return store.get(handoff_id)


def refresh(handoff_id: str) -> dict[str, Any]:
    handoff = store.get(handoff_id)
    if not handoff:
        raise KeyError("Handoff not found")
    if public_demo() or handoff["status"] not in {"calling", "needs_review"}:
        return handoff
    if not handoff.get("calle_run_id"):
        raise ValueError("No call ID was received. Check the CALL-E dashboard before any further call.")
    return save_provider(handoff_id, calle.refresh(handoff["calle_run_id"]))


def dispatch(handoff_id: str, live: bool) -> dict[str, Any]:
    handoff = store.get(handoff_id)
    if not handoff:
        raise KeyError("Handoff not found")
    if not live:
        store.preview(handoff_id, calle.preview(handoff))
        return store.get(handoff_id)
    if not live_enabled():
        raise ValueError("Live calls are locked. Configure server credentials, operator access code and permitted test numbers first.")
    phone = store.get_phone(handoff_id)
    allowed = {item.strip() for item in os.environ.get("CALLBRIDGE_ALLOWED_PHONES", "").split(",")}
    if phone not in allowed or not handoff.get("consent"):
        raise ValueError("This recipient is not an approved, consented test number")
    if not store.claim(handoff_id):
        raise ValueError("This request was already dispatched or resolved. Refresh its status instead of redialing.")
    try:
        return save_provider(handoff_id, calle.start({**handoff, "phone": phone}))
    except Exception:
        # The provider may have accepted a call before the connection failed.
        store.update(handoff_id, "needs_review", error="Call submission was not confirmed. Check the CALL-E dashboard before retrying; this request is locked against duplicate calls.")
        return store.get(handoff_id)


class Handler(BaseHTTPRequestHandler):
    server_version = "CallBridge/0.1"

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(HTTPStatus.NO_CONTENT)
        self.send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path.startswith("/api/") and not public_demo():
            try:
                authorize_console(self)
            except PermissionError as exc:
                return self.json_response({"error": str(exc)}, HTTPStatus.UNAUTHORIZED)
        if path == "/":
            return self.file_response(STATIC / "index.html", "text/html; charset=utf-8")
        if path == "/static/app.js":
            return self.file_response(STATIC / "app.js", "text/javascript; charset=utf-8")
        if path == "/static/styles.css":
            return self.file_response(STATIC / "styles.css", "text/css; charset=utf-8")
        if path == "/healthz":
            return self.json_response({"ok": True, "dry_run": not live_enabled(),
                "public_demo": public_demo(), "api_key_configured": bool(os.environ.get("CALLE_API_KEY")),
                "call_e_connected": False, "auth_required": bool(os.environ.get("CALLBRIDGE_ADMIN_TOKEN")) and not public_demo(),
                "webhook_ready": bool(os.environ.get("AURA_INTEGRATION_TOKEN")) and not public_demo(), "version": "0.2.0"})
        if path == "/api/handoffs":
            return self.json_response({"handoffs": store.list()})
        if path.startswith("/api/handoffs/"):
            handoff = store.get(path.rsplit("/", 1)[-1])
            return self.json_response(handoff or {"error": "Handoff not found"}, HTTPStatus.OK if handoff else HTTPStatus.NOT_FOUND)
        return self.json_response({"error": "Not found"}, HTTPStatus.NOT_FOUND)

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        try:
            if path == "/api/integrations/aura/handoff":
                authorize_aura(self)
            elif not public_demo():
                authorize_console(self)
            payload = self.read_json()
            if path == "/api/demo":
                if len(store.list()) >= 100:
                    raise ValueError("Demo request limit reached. Please reuse an existing request.")
                handoff = store.create(validate(demo_payload()))
                return self.json_response(handoff, HTTPStatus.CREATED)
            if public_demo() and path in {"/api/handoffs", "/api/integrations/aura/handoff"}:
                raise PermissionError("Public demo accepts fictional sample requests only. Do not enter personal information.")
            if path == "/api/handoffs":
                handoff = store.create(validate(payload, payload.get("business_name", "CallBridge")))
                return self.json_response(handoff, HTTPStatus.CREATED)
            if path == "/api/integrations/aura/handoff":
                authorize_aura(self)
                handoff = store.create(validate(payload, "Aura Manager"))
                return self.json_response(handoff, HTTPStatus.CREATED)
            if path.startswith("/api/handoffs/") and path.endswith("/dispatch"):
                handoff_id = path.split("/")[3]
                if payload.get("mode") not in {"preview", "live"}:
                    raise ValueError("mode must be preview or live")
                return self.json_response(dispatch(handoff_id, payload.get("mode") == "live"))
            if path.startswith("/api/handoffs/") and path.endswith("/refresh"):
                return self.json_response(refresh(path.split("/")[3]))
            if path.startswith("/api/handoffs/") and path.endswith("/resolve"):
                handoff_id = path.split("/")[3]
                if not store.get(handoff_id):
                    raise KeyError("Handoff not found")
                store.resolve(handoff_id)
                return self.json_response(store.get(handoff_id))
            return self.json_response({"error": "Not found"}, HTTPStatus.NOT_FOUND)
        except PermissionError as exc:
            return self.json_response({"error": str(exc)}, HTTPStatus.UNAUTHORIZED)
        except KeyError as exc:
            return self.json_response({"error": str(exc)}, HTTPStatus.NOT_FOUND)
        except ValueError as exc:
            return self.json_response({"error": str(exc)}, HTTPStatus.BAD_REQUEST)
        except Exception:
            return self.json_response({"error": "The service could not complete this request. Check backend configuration; no automatic retry was made."}, HTTPStatus.INTERNAL_SERVER_ERROR)

    def read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length < 0 or length > 10_000:
            raise ValueError("Request is too large")
        raw = self.rfile.read(length) if length else b"{}"
        value = json.loads(raw.decode("utf-8"))
        if not isinstance(value, dict):
            raise ValueError("Expected a JSON object")
        return value

    def file_response(self, path: Path, content_type: str) -> None:
        if not path.exists():
            return self.json_response({"error": "Asset not found"}, HTTPStatus.NOT_FOUND)
        body = path.read_bytes()
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def json_response(self, value: dict[str, Any], status: HTTPStatus = HTTPStatus.OK) -> None:
        body = json.dumps(value).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.send_cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def send_cors_headers(self) -> None:
        allowed = os.environ.get("CALLBRIDGE_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
        origin = self.headers.get("Origin", "")
        if origin in allowed:
            self.send_header("Access-Control-Allow-Origin", origin)
            self.send_header("Vary", "Origin")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def log_message(self, format: str, *args: Any) -> None:
        print(f"[{self.log_date_time_string()}] {format % args}")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    bind = os.environ.get("HOST", "127.0.0.1")
    if bind not in {"127.0.0.1", "localhost"} and not public_demo() and len(os.environ.get("CALLBRIDGE_ADMIN_TOKEN", "")) < 24:
        raise SystemExit("Public binding requires a 24+ character CALLBRIDGE_ADMIN_TOKEN or a separate public demo database.")
    print(f"CallBridge listening on http://127.0.0.1:{port} (dry_run={calle.dry_run})")
    ThreadingHTTPServer((bind, port), Handler).serve_forever()
