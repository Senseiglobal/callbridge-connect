"""Private Aura queue adapter. Holds a narrow queue token, not database credentials."""
from __future__ import annotations

import json
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener


class _NoRedirect(HTTPRedirectHandler):
    # Never forward the operator credential to a redirect destination.
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class AuraRemoteStore:
    def __init__(self, url=None, token=None):
        self.url = url or os.environ.get('AURA_STORAGE_URL', '')
        self.token = token or os.environ.get('AURA_STORAGE_TOKEN', '')
        parsed = urlparse(self.url)
        if (parsed.scheme != 'https' or not parsed.hostname or parsed.username or parsed.password
                or parsed.query or parsed.fragment or parsed.path != '/api/internal/callbridge'):
            raise ValueError('AURA_STORAGE_URL must be the HTTPS Aura /api/internal/callbridge endpoint without credentials or query parameters')
        if len(self.token) < 32:
            raise ValueError('AURA_STORAGE_TOKEN must contain at least 32 characters')
        if len(os.environ.get('CALLBRIDGE_ADMIN_TOKEN', '')) < 24:
            raise ValueError('The private Aura queue requires a 24+ character CALLBRIDGE_ADMIN_TOKEN, even on localhost')
        self.opener = build_opener(_NoRedirect())

    def _request(self, action, **values):
        request = Request(self.url, data=json.dumps({'action': action, **values}).encode('utf-8'),
                          headers={'Authorization': f'Bearer {self.token}', 'Content-Type': 'application/json'}, method='POST')
        try:
            with self.opener.open(request, timeout=20) as response:
                raw = response.read(2_000_001)
                if len(raw) > 2_000_000:
                    raise RuntimeError('Aura queue response was too large')
                payload = json.loads(raw)
                if not isinstance(payload, dict) or 'value' not in payload:
                    raise RuntimeError('Invalid Aura queue response')
                return payload['value']
        except HTTPError as exc:
            if exc.code == 409:
                raise ValueError('Request state changed. Refresh the queue before continuing.') from None
            raise RuntimeError('Aura queue unavailable or access denied. No automatic retry was made.') from None
        except (URLError, TimeoutError, OSError, ValueError):
            raise RuntimeError('Aura queue response was not confirmed. Refresh before retrying; never automatically redial.') from None

    def create(self, handoff):
        raise ValueError('Private Aura requests must be created by a signed-in user at Aura /callback. Use the public demo for fictional samples.')

    def list(self):
        return self._request('list')

    def get(self, handoff_id):
        return self._request('get', id=handoff_id)

    def get_phone(self, handoff_id):
        return self._request('phone', id=handoff_id)

    def claim(self, handoff_id):
        value = self._request('claim', id=handoff_id)
        if not isinstance(value, bool):
            raise RuntimeError('Invalid dispatch claim response; no call permitted')
        return value

    def preview(self, handoff_id, result):
        self._request('preview', id=handoff_id, result=result)

    def update(self, handoff_id, status, result=None, calle_run_id=None, error=None):
        self._request('update', id=handoff_id, status=status, result=result, calle_run_id=calle_run_id, error=error)

    def resolve(self, handoff_id):
        self._request('resolve', id=handoff_id)
