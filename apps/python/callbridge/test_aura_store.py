import io
import json
import os
import unittest
from unittest.mock import Mock, patch
from urllib.error import HTTPError, URLError

from aura_store import AuraRemoteStore, _NoRedirect
from storage import build_store


class AuraStoreTests(unittest.TestCase):
    def setUp(self):
        self.environment = patch.dict(os.environ, {'CALLBRIDGE_ADMIN_TOKEN': 'unit-test-operator-token-1234567890'})
        self.environment.start()
        self.addCleanup(self.environment.stop)
        self.store = AuraRemoteStore('https://www.auramanager.app/api/internal/callbridge', 'unit-test-storage-token-1234567890')
        self.store.opener = Mock()

    def respond(self, value):
        self.store.opener.open.return_value.__enter__ = Mock(return_value=io.BytesIO(json.dumps({'value': value}).encode()))
        self.store.opener.open.return_value.__exit__ = Mock(return_value=False)

    def test_https_fixed_path_and_strong_tokens_required(self):
        for url in ['http://example.org/api/internal/callbridge', 'https://example.org/other', 'https://name:pass@example.org/api/internal/callbridge', 'https://example.org/api/internal/callbridge?token=x']:
            with self.assertRaises(ValueError):
                AuraRemoteStore(url, 'x' * 32)
        with self.assertRaises(ValueError):
            AuraRemoteStore(self.store.url, 'short')
        with patch.dict(os.environ, {'CALLBRIDGE_ADMIN_TOKEN': ''}):
            with self.assertRaises(ValueError):
                AuraRemoteStore(self.store.url, 'x' * 32)

    def test_no_redirect_for_credentials(self):
        self.assertIsNone(_NoRedirect().redirect_request(None, None, 307, '', {}, 'https://other.example'))

    def test_narrow_command_with_bearer_header(self):
        self.respond([])
        self.assertEqual(self.store.list(), [])
        request = self.store.opener.open.call_args.args[0]
        self.assertEqual(json.loads(request.data), {'action': 'list'})
        self.assertEqual(request.get_header('Authorization'), f'Bearer {self.store.token}')
        self.assertNotIn(self.store.token, request.full_url)

    def test_claim_requires_literal_boolean_confirmation(self):
        self.respond(True)
        self.assertIs(self.store.claim('handoff_test'), True)
        self.respond(False)
        self.assertIs(self.store.claim('handoff_test'), False)
        self.respond('true')
        with self.assertRaises(RuntimeError):
            self.store.claim('handoff_test')

    def test_no_retry_on_ambiguous_network_failure(self):
        self.store.opener.open.side_effect = URLError('sensitive provider detail')
        with self.assertRaisesRegex(RuntimeError, 'not confirmed') as caught:
            self.store.claim('handoff_test')
        self.assertNotIn('sensitive', str(caught.exception))
        self.assertEqual(self.store.opener.open.call_count, 1)

    def test_state_conflict_is_safe_error(self):
        self.store.opener.open.side_effect = HTTPError(self.store.url, 409, 'private detail', {}, None)
        with self.assertRaisesRegex(ValueError, 'state changed'):
            self.store.resolve('handoff_test')

    def test_auth_errors_do_not_leak_body(self):
        self.store.opener.open.side_effect = HTTPError(self.store.url, 401, 'secret', {}, None)
        with self.assertRaisesRegex(RuntimeError, 'access denied') as caught:
            self.store.list()
        self.assertNotIn('secret', str(caught.exception))

    def test_private_queue_rejects_manual_or_fictional_creation(self):
        with self.assertRaisesRegex(ValueError, 'signed-in user'):
            self.store.create({})
        self.store.opener.open.assert_not_called()

    def test_unknown_storage_never_falls_back_to_temporary_database(self):
        with patch.dict(os.environ, {'STORAGE_BACKEND': 'misspelled'}):
            with self.assertRaises(ValueError):
                build_store()


if __name__ == '__main__':
    unittest.main()
