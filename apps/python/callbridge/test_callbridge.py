"""All tests use local stores and fake providers. They NEVER dial."""
import concurrent.futures
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch
from http.server import ThreadingHTTPServer
from threading import Thread
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# Importing the service must not touch the developer's real database.
os.environ["CALLBRIDGE_PUBLIC_DEMO"] = "true"
import app
from calle_client import CalleClient
from storage import LocalStore, FirestoreStore, public_value


def tearDownModule():
    app.store.connection.close()


class CallBridgeTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.store = LocalStore(str(Path(self.directory.name) / "test.db"))
        self.store_patch = patch.object(app, "store", self.store)
        self.store_patch.start()
        self.env = patch.dict(os.environ, {"CALLBRIDGE_PUBLIC_DEMO": "false",
            "CALLE_API_KEY": "fake-test-key", "CALLE_DRY_RUN": "false",
            "CALLBRIDGE_ADMIN_TOKEN": "test-operator-code-at-least-24-chars",
            "CALLBRIDGE_ALLOWED_PHONES": "+12025550123"})
        self.env.start()
        self.client = CalleClient()
        self.client_patch = patch.object(app, "calle", self.client)
        self.client_patch.start()
        self.network = patch.object(CalleClient, "_sdk", side_effect=AssertionError("Network forbidden in tests"))
        self.network.start()
        self.handoff = self.store.create(app.validate(app.demo_payload()))
        self.id = self.handoff["id"]

    def tearDown(self):
        self.network.stop()
        self.client_patch.stop()
        self.env.stop()
        self.store_patch.stop()
        self.store.connection.close()
        self.directory.cleanup()

    def test_preview_never_calls_even_with_live_environment(self):
        result = app.dispatch(self.id, False)
        self.assertEqual(result["status"], "preview")
        self.assertIsNone(result["started_at"])
        self.assertIsNone(result["calle_run_id"])
        self.assertEqual(result["result"]["provider_status"], "preview")

    def test_consent_must_be_boolean_true(self):
        for value in [False, "false", "true", 1, None, [], {}]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                app.validate({**app.demo_payload(), "consent": value})

    def test_context_and_url_validation(self):
        with self.assertRaises(ValueError):
            app.validate({**app.demo_payload(), "context": {"vault": "private"}})
        with self.assertRaises(ValueError):
            app.validate({**app.demo_payload(), "page_url": "javascript:alert(1)"})
        safe = app.validate({**app.demo_payload(), "page_url": "https://example.org/?token=secret#private"})
        self.assertEqual(safe["page_url"], "https://example.org/")

    def test_phone_not_exposed_by_list_detail_or_notes(self):
        self.assertNotIn("phone", self.handoff)
        self.assertNotIn("+12025550123", json.dumps(self.store.list()))
        safe = public_value({"phone": "+12025550123", "result": {"summary": "Called +12025550123"}})
        self.assertNotIn("+12025550123", json.dumps(safe))

    def test_firestore_list_uses_same_privacy_boundary(self):
        store = FirestoreStore.__new__(FirestoreStore)
        store.collection = Mock()
        document = Mock()
        document.to_dict.return_value = {"id": "test", "phone": "+12025550123"}
        store.collection.order_by.return_value.limit.return_value.stream.return_value = [document]
        self.assertNotIn("+12025550123", json.dumps(store.list()))

    def test_one_atomic_claim_under_concurrent_clicks(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            claims = list(executor.map(lambda _: self.store.claim(self.id), range(16)))
        self.assertEqual(sum(claims), 1)

    def test_live_dispatch_is_locked_against_repeat(self):
        with patch.object(self.client, "start", return_value={"id": "call_test", "status": "queued"}) as start:
            first = app.dispatch(self.id, True)
            with self.assertRaises(ValueError):
                app.dispatch(self.id, True)
        start.assert_called_once()
        self.assertEqual(first["status"], "calling")
        self.assertEqual(first["calle_run_id"], "call_test")

    def test_uncertain_timeout_does_not_redial(self):
        with patch.object(self.client, "start", side_effect=TimeoutError("contains secret")):
            result = app.dispatch(self.id, True)
        self.assertEqual(result["status"], "needs_review")
        self.assertNotIn("secret", result["error"])
        with self.assertRaises(ValueError):
            app.dispatch(self.id, True)

    def test_preview_cannot_overwrite_a_live_attempt(self):
        self.store.claim(self.id)
        with self.assertRaises(ValueError):
            app.dispatch(self.id, False)

    def test_failed_or_invalid_result_not_reported_completed(self):
        self.assertEqual(CalleClient.interpret({"status": "failed"})[0], "failed")
        self.assertEqual(CalleClient.interpret({"status": "completed", "task_completed": False})[0], "needs_review")
        self.assertEqual(CalleClient.interpret({"status": "completed", "task_completed": True,
            "structured_result": {"intent": "invented"}})[0], "needs_review")

    def test_refresh_records_real_provider_completion_and_keeps_start(self):
        with patch.object(self.client, "start", return_value={"id": "call_test", "status": "queued"}):
            first = app.dispatch(self.id, True)
        structured = {k: v for k, v in self.client.preview({}).items()
                      if k not in {"provider_status", "completion_confidence", "call_id"}}
        with patch.object(self.client, "refresh", return_value={"id": "call_test",
                "status": "completed", "task_completed": True, "structured_result": structured}):
            result = app.refresh(self.id)
        self.assertEqual(result["status"], "completed")
        self.assertEqual(result["started_at"], first["started_at"])
        self.assertIsNotNone(result["completed_at"])

    def test_public_demo_cannot_dial(self):
        with patch.dict(os.environ, {"CALLBRIDGE_PUBLIC_DEMO": "true"}), self.assertRaises(ValueError):
            app.dispatch(self.id, True)

    def test_phone_allowlist(self):
        with patch.dict(os.environ, {"CALLBRIDGE_ALLOWED_PHONES": "+12025550124"}), self.assertRaises(ValueError):
            app.dispatch(self.id, True)

    def test_http_auth_and_public_demo_restrictions(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), app.Handler)
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_port}"
        try:
            with self.assertRaises(HTTPError) as denied:
                urlopen(base + "/api/handoffs")
            self.assertEqual(denied.exception.code, 401)
            denied.exception.close()
            with patch.dict(os.environ, {"CALLBRIDGE_PUBLIC_DEMO": "true"}):
                with urlopen(base + "/healthz") as response:
                    self.assertTrue(json.load(response)["dry_run"])
                request = Request(base + "/api/handoffs", data=b"{}", method="POST")
                with self.assertRaises(HTTPError) as rejected:
                    urlopen(request)
                self.assertEqual(rejected.exception.code, 401)
                rejected.exception.close()
        finally:
            server.shutdown()
            server.server_close()
            thread.join()

    def test_resolving_preview_does_not_fabricate_live_timestamps(self):
        app.dispatch(self.id, False)
        self.store.resolve(self.id)
        result = self.store.get(self.id)
        self.assertIsNone(result["started_at"])
        self.assertIsNone(result["completed_at"])
        self.assertIsNotNone(result["resolved_at"])


if __name__ == "__main__":
    unittest.main()
