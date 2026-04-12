#!/usr/bin/env python3
"""
iMessage → n8n Webhook Sync

Reads inbound iMessages from ~/Library/Messages/chat.db,
tracks last processed ROWID, and POSTs new messages to the
n8n webhook at imessage-sync.

Runs every 5 minutes via launchd.
"""

import sqlite3
import os
import json
import urllib.request
import urllib.error
from datetime import datetime

DB_PATH = os.path.expanduser("~/Library/Messages/chat.db")
STATE_FILE = os.path.expanduser("~/.imessage-sync-state.json")
WEBHOOK_URL = "https://styer.app.n8n.cloud/webhook/imessage-sync"

# Apple Core Data epoch: 2001-01-01 00:00:00 UTC
APPLE_EPOCH_OFFSET = 978307200


def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE, "r") as f:
            return json.load(f)
    return {"last_rowid": 0}


def save_state(state):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f)


def apple_timestamp_to_iso(ns_timestamp):
    if ns_timestamp is None or ns_timestamp == 0:
        return datetime.utcnow().isoformat() + "Z"
    seconds = ns_timestamp / 1_000_000_000
    unix_seconds = seconds + APPLE_EPOCH_OFFSET
    return datetime.utcfromtimestamp(unix_seconds).isoformat() + "Z"


def get_new_messages(last_rowid):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    query = """
        SELECT
            m.ROWID,
            m.text,
            m.date,
            m.is_from_me,
            h.id AS handle_id,
            c.chat_identifier
        FROM message m
        LEFT JOIN handle h ON m.handle_id = h.ROWID
        LEFT JOIN chat_message_join cmj ON m.ROWID = cmj.message_id
        LEFT JOIN chat c ON cmj.chat_id = c.ROWID
        WHERE m.ROWID > ?
          AND m.text IS NOT NULL
          AND m.text != ''
        ORDER BY m.ROWID ASC
        LIMIT 50
    """

    cursor.execute(query, (last_rowid,))
    rows = cursor.fetchall()
    conn.close()
    return rows


def post_to_webhook(payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        WEBHOOK_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.status
    except urllib.error.HTTPError as e:
        print(f"HTTP error {e.code}: {e.read().decode()}")
        return e.code
    except urllib.error.URLError as e:
        print(f"URL error: {e.reason}")
        return None


def main():
    state = load_state()
    last_rowid = state["last_rowid"]

    messages = get_new_messages(last_rowid)
    if not messages:
        return

    max_rowid = last_rowid
    sent = 0

    for row in messages:
        rowid, text, date_ns, is_from_me, handle_id, chat_id = row

        # handle_id is the phone number or email
        sender_phone = handle_id or ""

        payload = {
            "sender_phone": sender_phone,
            "message_text": text,
            "message_date": apple_timestamp_to_iso(date_ns),
            "is_from_me": bool(is_from_me),
            "chat_id": chat_id or "",
            "row_id": rowid,
        }

        status = post_to_webhook(payload)
        if status and 200 <= status < 300:
            sent += 1
            if rowid > max_rowid:
                max_rowid = rowid
        else:
            # Stop on first failure to avoid skipping messages
            print(f"Failed to send ROWID {rowid}, stopping. Status: {status}")
            break

    if max_rowid > last_rowid:
        state["last_rowid"] = max_rowid
        save_state(state)

    print(f"Processed {sent}/{len(messages)} messages. Last ROWID: {max_rowid}")


if __name__ == "__main__":
    main()
