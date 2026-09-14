"""Verify SDK authentication with a read-only request; never creates a call or goal."""
import json
import os
import sys

from calle import CalleClient
from calle.errors import CalleAPIError


def main():
    key = os.environ.get("CALLE_API_KEY", "")
    if not key:
        print(json.dumps({"authenticated": False, "error": "key_not_configured"}))
        return 1
    try:
        with CalleClient(api_key=key, timeout=15) as client:
            # Discard account contents; only success/failure is reported.
            client.goals.list(limit=1)
        print(json.dumps({"authenticated": True, "check": "read_only_goals_list", "calls_created": 0}))
        return 0
    except CalleAPIError as exc:
        print(json.dumps({"authenticated": False, "http_status": exc.status_code,
                          "error_type": type(exc).__name__, "calls_created": 0}))
    except Exception as exc:
        # Never print request headers, credentials, raw responses or a traceback.
        print(json.dumps({"authenticated": False, "error_type": type(exc).__name__, "calls_created": 0}))
    return 1


if __name__ == "__main__":
    sys.exit(main())
