"""Run one explicitly approved request through CallBridge without unlocking its web console."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--request-id", required=True)
    parser.add_argument("--approve-real-call", action="store_true")
    args = parser.parse_args()
    if not args.approve_real_call or not re.fullmatch(r"handoff_[a-f0-9]{32}", args.request_id):
        parser.error("An exact Aura request ID and explicit --approve-real-call are required.")
    if os.environ.get("STORAGE_BACKEND") != "aura" or os.environ.get("CALLBRIDGE_PUBLIC_DEMO") != "false":
        raise RuntimeError("Only the private Aura queue is permitted.")
    if not os.environ.get("CALLE_API_KEY") or len(os.environ.get("CALLBRIDGE_ADMIN_TOKEN", "")) < 24:
        raise RuntimeError("Private credentials are missing.")

    sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "apps/python/callbridge"))
    # This process is the only live operator; the separately running web server remains locked.
    os.environ["CALLE_DRY_RUN"] = "false"
    import app

    request = app.store.get(args.request_id)
    if (not request or request.get("consent") is not True
            or request.get("status") not in {"ready", "preview"}
            or request.get("calle_run_id") or request.get("started_at")):
        raise RuntimeError("Request is not an unused, consented callback. No dispatch was attempted.")
    created = datetime.fromisoformat(request["created_at"])
    age = (datetime.now(timezone.utc) - created).total_seconds()
    if not 0 <= age < 86400:
        raise RuntimeError("Request is outside its 24-hour consent window. No dispatch was attempted.")
    phone = app.store.get_phone(args.request_id)
    if not isinstance(phone, str) or not app.PHONE_PATTERN.fullmatch(phone):
        raise RuntimeError("The saved phone number is invalid. No dispatch was attempted.")
    os.environ["CALLBRIDGE_ALLOWED_PHONES"] = phone
    # dispatch() repeats the consent/allowlist checks and atomically claims before calling.
    # Never retry this operation, including after a local timeout or storage error.
    result = app.dispatch(args.request_id, live=True)
    print(json.dumps({key: result.get(key) for key in
                      ("id", "status", "calle_run_id", "result", "error")}))
    return 0 if result.get("status") in {"calling", "completed"} and result.get("calle_run_id") else 2


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as exc:
        # Do not leak credentials, raw provider responses, or customer records in tracebacks.
        print(json.dumps({"error": "Worker did not confirm completion; inspect the queue and provider before retrying.",
                          "error_type": type(exc).__name__}))
        sys.exit(1)
