"""SQLite persistence with atomic dispatch claims; optional Firestore equivalent."""
from __future__ import annotations

import json
import os
import re
import sqlite3
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

TIMES = ("updated_at", "previewed_at", "started_at", "completed_at", "resolved_at")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def mask_phone(phone: str) -> str:
    return f"{phone[:-4]}••••" if len(phone) >= 5 else "••••"


def public_value(value: dict[str, Any]) -> dict[str, Any]:
    value = dict(value)
    phone = value.pop("phone", "")
    value["phone_masked"] = mask_phone(phone)
    # Provider summaries and caller-entered notes can repeat a phone number.
    def scrub(item):
        if isinstance(item, str):
            if phone:
                item = item.replace(phone, mask_phone(phone))
            return re.sub(r"\+[1-9]\d{7,14}", lambda m: mask_phone(m[0]), item)
        if isinstance(item, dict):
            return {key: scrub(val) for key, val in item.items()}
        if isinstance(item, list):
            return [scrub(val) for val in item]
        return item
    return scrub(value)


def changes(status, result=None, calle_run_id=None, error=None):
    timestamp = now_iso()
    values = {"status": status, "result": result, "error": error, "updated_at": timestamp}
    field = {"preview": "previewed_at", "calling": "started_at",
             "completed": "completed_at", "resolved": "resolved_at"}.get(status)
    if field:
        values[field] = timestamp
    if calle_run_id:
        values["calle_run_id"] = calle_run_id
    return values


class LocalStore:
    def __init__(self, path: str | None = None) -> None:
        database = Path(path or os.environ.get("CALLBRIDGE_DB", "data/callbridge.db"))
        database.parent.mkdir(parents=True, exist_ok=True)
        self.lock = threading.RLock()
        self.connection = sqlite3.connect(database, check_same_thread=False)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("""
            CREATE TABLE IF NOT EXISTS handoffs (
              id TEXT PRIMARY KEY, created_at TEXT NOT NULL,
              business_name TEXT NOT NULL, visitor_name TEXT NOT NULL, phone TEXT NOT NULL,
              reason TEXT NOT NULL, page_url TEXT NOT NULL, context_json TEXT NOT NULL,
              consent INTEGER NOT NULL, status TEXT NOT NULL, result_json TEXT,
              calle_run_id TEXT, error TEXT
            )
        """)
        existing = {row[1] for row in self.connection.execute("PRAGMA table_info(handoffs)")}
        for name in TIMES:
            if name not in existing:
                self.connection.execute(f"ALTER TABLE handoffs ADD COLUMN {name} TEXT")
        self.connection.commit()

    def create(self, handoff: dict[str, Any]) -> dict[str, Any]:
        with self.lock, self.connection:
            self.connection.execute(
                """INSERT INTO handoffs
                (id,created_at,business_name,visitor_name,phone,reason,page_url,context_json,consent,status,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                (handoff["id"], handoff["created_at"], handoff["business_name"], handoff["visitor_name"],
                 handoff["phone"], handoff["reason"], handoff["page_url"], json.dumps(handoff["context"]),
                 1, "ready", handoff["created_at"]),
            )
        return self.get(handoff["id"])

    def list(self) -> list[dict[str, Any]]:
        with self.lock:
            rows = self.connection.execute("SELECT * FROM handoffs ORDER BY created_at DESC LIMIT 200").fetchall()
        return [self._row(row) for row in rows]

    def get(self, handoff_id: str) -> dict[str, Any] | None:
        with self.lock:
            row = self.connection.execute("SELECT * FROM handoffs WHERE id = ?", (handoff_id,)).fetchone()
        return self._row(row) if row else None

    def get_phone(self, handoff_id: str) -> str | None:
        with self.lock:
            row = self.connection.execute("SELECT phone FROM handoffs WHERE id = ?", (handoff_id,)).fetchone()
        return row["phone"] if row else None

    def claim(self, handoff_id: str) -> bool:
        with self.lock, self.connection:
            stamp = now_iso()
            result = self.connection.execute(
                """UPDATE handoffs SET status='calling', result_json=NULL, error=NULL, started_at=?, updated_at=?
                   WHERE id=? AND status IN ('ready','preview') AND started_at IS NULL AND calle_run_id IS NULL""",
                (stamp, stamp, handoff_id))
            return result.rowcount == 1

    def preview(self, handoff_id, result):
        with self.lock, self.connection:
            stamp = now_iso()
            updated = self.connection.execute(
                """UPDATE handoffs SET status='preview', result_json=?, previewed_at=?, updated_at=?
                   WHERE id=? AND status IN ('ready','preview') AND started_at IS NULL""",
                (json.dumps(result), stamp, stamp, handoff_id))
            if not updated.rowcount:
                raise ValueError("Cannot preview a dispatched or resolved request")

    def update(self, handoff_id, status, result=None, calle_run_id=None, error=None):
        values = changes(status, result, calle_run_id, error)
        values.pop("result")
        values["result_json"] = json.dumps(result) if result is not None else None
        # Keep the original live start time, including across refreshes.
        values.pop("started_at", None)
        with self.lock, self.connection:
            self.connection.execute(
                "UPDATE handoffs SET " + ", ".join(f"{key}=?" for key in values) + " WHERE id=?",
                (*values.values(), handoff_id))

    def resolve(self, handoff_id):
        with self.lock, self.connection:
            stamp = now_iso()
            updated = self.connection.execute(
                """UPDATE handoffs SET status='resolved', resolved_at=?, updated_at=?
                   WHERE id=? AND status NOT IN ('calling','needs_review')""", (stamp, stamp, handoff_id))
            if not updated.rowcount:
                raise ValueError("Refresh or review the live call before resolving it")

    @staticmethod
    def _row(row):
        value = dict(row)
        value["context"] = json.loads(value.pop("context_json"))
        result = value.pop("result_json")
        value["result"] = json.loads(result) if result else None
        value["consent"] = bool(value["consent"])
        return public_value(value)


class FirestoreStore:
    def __init__(self):
        from google.cloud import firestore
        self.client = firestore.Client(project=os.environ.get("GOOGLE_CLOUD_PROJECT"))
        self.collection = self.client.collection("callbridge_handoffs")

    def create(self, handoff):
        self.collection.document(handoff["id"]).create({
            **handoff, "status": "ready", "updated_at": handoff["created_at"]})
        return self.get(handoff["id"])

    def list(self):
        from google.cloud import firestore
        docs = self.collection.order_by("created_at", direction=firestore.Query.DESCENDING).limit(200).stream()
        return [public_value(doc.to_dict()) for doc in docs]

    def get(self, handoff_id):
        doc = self.collection.document(handoff_id).get()
        return public_value(doc.to_dict()) if doc.exists else None

    def get_phone(self, handoff_id):
        doc = self.collection.document(handoff_id).get()
        return doc.to_dict().get("phone") if doc.exists else None

    def transition(self, handoff_id, allowed, values, require_unused=False):
        from google.cloud import firestore
        ref = self.collection.document(handoff_id)
        @firestore.transactional
        def transact(transaction):
            doc = ref.get(transaction=transaction)
            data = doc.to_dict() if doc.exists else {}
            if data.get("status") not in allowed:
                return False
            if require_unused and (data.get("started_at") or data.get("calle_run_id")):
                return False
            transaction.update(ref, values)
            return True
        return transact(self.client.transaction())

    def claim(self, handoff_id):
        return self.transition(handoff_id, {"ready", "preview"}, changes("calling"), True)

    def preview(self, handoff_id, result):
        if not self.transition(handoff_id, {"ready", "preview"}, changes("preview", result), True):
            raise ValueError("Cannot preview a dispatched or resolved request")

    def update(self, handoff_id, status, result=None, calle_run_id=None, error=None):
        values = changes(status, result, calle_run_id, error)
        values.pop("started_at", None)
        self.collection.document(handoff_id).update(values)

    def resolve(self, handoff_id):
        values = changes("resolved")
        values.pop("result")
        if not self.transition(handoff_id, {"ready", "preview", "completed", "failed", "resolved"}, values):
            raise ValueError("Refresh or review the live call before resolving it")


def build_store():
    backend = os.environ.get("STORAGE_BACKEND", "local").lower()
    if backend == "aura":
        from aura_store import AuraRemoteStore
        return AuraRemoteStore()
    if backend == "firestore":
        return FirestoreStore()
    if backend != "local":
        raise ValueError("STORAGE_BACKEND must be local, firestore, or aura")
    return LocalStore()
