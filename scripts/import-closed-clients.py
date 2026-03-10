#!/usr/bin/env python3
"""
import-closed-clients.py
========================
One-time idempotent import of Salesforce Closed Client contacts into LoanOS Supabase.

Usage:
  python3 scripts/import-closed-clients.py

Requires:
  pip3 install pandas lxml requests python-dotenv

Dedup logic (never overwrites existing records):
  1. salesforce_id  — exact match (primary)
  2. email          — case-insensitive match (secondary)
  3. first_name + last_name — normalized match (tertiary / last resort)
"""

import os
import re
import sys
import json
import math
import pandas as pd
import requests
from datetime import datetime

# ── Config ────────────────────────────────────────────────────────────────────

XLS_PATH = "/Users/adamstyer/Downloads/report1773106158960.xls"
STAGE_FILTER = "Closed Client"

# Load from .env.local if present, otherwise use env vars
def load_env():
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env.local')
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, _, val = line.partition('=')
                    os.environ.setdefault(key.strip(), val.strip().strip('"').strip("'"))

load_env()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").rstrip('/')
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    print("Set them in .env.local or as environment variables.")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def clean(val):
    """Return stripped string or None for empty/nan."""
    if val is None:
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    s = str(val).strip()
    return s if s and s.lower() not in ('nan', 'none', 'n/a', '') else None

def parse_date(val):
    """Parse M/D/YYYY or YYYY-MM-DD to ISO date string or None."""
    s = clean(val)
    if not s:
        return None
    for fmt in ('%m/%d/%Y', '%Y-%m-%d', '%m/%d/%y'):
        try:
            return datetime.strptime(s, fmt).strftime('%Y-%m-%d')
        except ValueError:
            continue
    return None

def parse_bool(val):
    s = clean(val)
    if s is None:
        return None
    return s.lower() in ('true', '1', 'yes', 'checked')

def normalize_name(s):
    return re.sub(r'\s+', ' ', (s or '').strip().lower())

# ── Load XLS ─────────────────────────────────────────────────────────────────

print(f"\n{'='*60}")
print(f"LoanOS — Closed Client Import")
print(f"{'='*60}\n")
print(f"Reading: {XLS_PATH}")

try:
    dfs = pd.read_html(XLS_PATH, header=0)
    df = dfs[0]
except Exception as e:
    print(f"ERROR reading XLS: {e}")
    sys.exit(1)

print(f"Total rows loaded: {len(df)}")

# Filter to Closed Client only
df = df[df['Stage'].astype(str).str.strip() == STAGE_FILTER].copy()
print(f"Rows matching Stage='{STAGE_FILTER}': {len(df)}")

if len(df) == 0:
    print("Nothing to import. Exiting.")
    sys.exit(0)

# ── Fetch existing contacts for dedup ─────────────────────────────────────────

print("\nFetching existing contacts for dedup check…")

def fetch_all_contacts():
    """Page through all contacts — returns list of {salesforce_id, email, first_name, last_name, id}"""
    all_rows = []
    offset = 0
    limit = 1000
    while True:
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/contacts",
            headers={**HEADERS, "Range-Unit": "items", "Range": f"{offset}-{offset+limit-1}"},
            params={"select": "id,salesforce_id,email,first_name,last_name"},
        )
        if resp.status_code not in (200, 206):
            print(f"ERROR fetching contacts: {resp.status_code} {resp.text}")
            sys.exit(1)
        batch = resp.json()
        all_rows.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return all_rows

existing = fetch_all_contacts()
print(f"Existing contacts in DB: {len(existing)}")

# Build lookup sets
existing_by_sfid  = {r['salesforce_id'].strip(): r['id'] for r in existing if r.get('salesforce_id')}
existing_by_email = {r['email'].strip().lower(): r['id'] for r in existing if r.get('email')}
existing_by_name  = {
    normalize_name(r.get('first_name','') + ' ' + r.get('last_name','')): r['id']
    for r in existing if r.get('first_name') or r.get('last_name')
}

# ── Map columns ───────────────────────────────────────────────────────────────

def build_record(row):
    """Map one XLS row to a contacts table dict."""
    return {
        "salesforce_id":        clean(row.get('Contact ID')),
        "first_name":           clean(row.get('First Name')),
        "last_name":            clean(row.get('Last Name')),
        "coborrower_first_name": clean(row.get('First Name (Co Borrower)')),
        "coborrower_last_name":  clean(row.get('Last Name (Co Borrower)')),
        "email":                clean(row.get('Email')),
        "phone":                clean(row.get('Phone')),
        "mobile_phone":         clean(row.get('Mobile')),
        "contact_type":         "borrower",
        "stage":                "Closed Client",
        "lead_source":          clean(row.get('Lead Source')),
        "referred_by":          clean(row.get('Referred By')),
        "company_name":         clean(row.get('Company Name')),
        "birthday":             parse_date(row.get('Birthdate')),
        "coborrower_birthday":  parse_date(row.get('Birthday (Co Borrower)')),
        "closing_date":         parse_date(row.get('Closing Date')),
        "last_touch":           clean(row.get('Last Touch')),
        "top_realtor":          parse_bool(row.get('Top Realtor')),
        "target_realtor":       parse_bool(row.get('Target Realtor')),
        "realtor_email":        clean(row.get('Realtor Email')),
        "realtor_phone":        clean(row.get('Realtor Phone')),
    }

# ── Import loop ───────────────────────────────────────────────────────────────

imported = 0
skipped  = 0
errors   = []

print(f"\nStarting import of {len(df)} records…\n")

for i, (_, row) in enumerate(df.iterrows(), 1):
    rec = build_record(row)
    name_display = f"{rec.get('first_name','') or ''} {rec.get('last_name','') or ''}".strip() or f"Row {i}"

    # ── Dedup check ──────────────────────────────────────────────────────────
    skip_reason = None

    sfid = rec.get('salesforce_id')
    if sfid and sfid in existing_by_sfid:
        skip_reason = f"salesforce_id match: {sfid}"

    if not skip_reason:
        email = (rec.get('email') or '').strip().lower()
        if email and email in existing_by_email:
            skip_reason = f"email match: {email}"

    if not skip_reason:
        fn = rec.get('first_name') or ''
        ln = rec.get('last_name') or ''
        name_key = normalize_name(fn + ' ' + ln)
        if name_key and name_key.strip() and name_key in existing_by_name:
            skip_reason = f"name match: {fn} {ln}"

    if skip_reason:
        print(f"  SKIP [{i:4d}] {name_display} — {skip_reason}")
        skipped += 1
        continue

    # ── Remove None values to avoid sending null for non-nullable cols ────────
    payload = {k: v for k, v in rec.items() if v is not None}

    # ── Insert ───────────────────────────────────────────────────────────────
    resp = requests.post(
        f"{SUPABASE_URL}/rest/v1/contacts",
        headers=HEADERS,
        data=json.dumps(payload),
    )

    if resp.status_code in (200, 201):
        print(f"  OK   [{i:4d}] {name_display}")
        imported += 1
        # Add to local lookup so subsequent rows don't re-insert same contact
        if sfid:
            existing_by_sfid[sfid] = "__new__"
        email = (rec.get('email') or '').strip().lower()
        if email:
            existing_by_email[email] = "__new__"
        name_key = normalize_name((rec.get('first_name') or '') + ' ' + (rec.get('last_name') or ''))
        if name_key.strip():
            existing_by_name[name_key] = "__new__"
    else:
        msg = f"HTTP {resp.status_code}: {resp.text[:120]}"
        print(f"  ERR  [{i:4d}] {name_display} — {msg}")
        errors.append({"row": i, "name": name_display, "error": msg})

# ── Summary ───────────────────────────────────────────────────────────────────

print(f"\n{'='*60}")
print(f"Import complete")
print(f"  Imported: {imported}")
print(f"  Skipped:  {skipped}")
print(f"  Errors:   {len(errors)}")
print(f"{'='*60}\n")

if errors:
    print("Error details:")
    for e in errors:
        print(f"  Row {e['row']} ({e['name']}): {e['error']}")
    print()
