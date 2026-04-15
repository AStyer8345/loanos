#!/usr/bin/env python3
"""Import Scott's realtors (Template 3) and loans (Template 2).
Borrowers already imported (331). This script handles the rest."""

import csv
import json
import urllib.request
from datetime import datetime
from typing import Dict, List, Optional

SUPABASE_URL = "https://uuqedsvjlkeszrbwzizl.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ"
ORG_ID = "40377391-6b4c-4d1a-81d2-ffd743876f0b"
USER_ID = "975c8e19-aa6a-4cd5-9ca8-c727d3be9a15"
DOWNLOADS = "/Users/adamstyer/Downloads"


def normalize_keys(rows: List[Dict]) -> List[Dict]:
    """Ensure every row has the same keys (PostgREST requirement)."""
    all_keys = set()
    for row in rows:
        all_keys.update(row.keys())
    return [{k: row.get(k) for k in sorted(all_keys)} for row in rows]


def supabase_insert(table: str, rows: List[Dict]) -> int:
    """Bulk insert with normalized keys. Batches of 50."""
    url = "{}/rest/v1/{}".format(SUPABASE_URL, table)
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": "Bearer " + SERVICE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    rows = normalize_keys(rows)
    total = 0
    for i in range(0, len(rows), 50):
        batch = rows[i:i + 50]
        data = json.dumps(batch).encode()
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                total += len(batch)
                print("    batch {}-{} OK".format(i, i + len(batch)))
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print("  BATCH ERROR {}-{}: {}".format(i, i + len(batch), body[:300]))
            # Fall back to one-by-one
            for j, row in enumerate(batch):
                data2 = json.dumps([row]).encode()
                req2 = urllib.request.Request(url, data=data2, headers=headers, method="POST")
                try:
                    with urllib.request.urlopen(req2, timeout=15) as resp2:
                        total += 1
                except urllib.error.HTTPError as e2:
                    body2 = e2.read().decode()
                    name = "{} {}".format(row.get("first_name", ""), row.get("last_name", ""))
                    print("    SKIP {}: {}".format(name.strip() or row.get("loan_number", "?"), body2[:200]))
                except Exception as ex:
                    print("    SKIP row {}: {}".format(i + j, str(ex)[:100]))
    return total


def clean(val):
    if val is None:
        return None
    v = val.strip()
    return v if v else None


def parse_date(val):
    v = clean(val)
    if not v:
        return None
    for fmt in ("%m/%d/%Y", "%m/%d/%Y %I:%M:%S %p", "%Y-%m-%d"):
        try:
            return datetime.strptime(v, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def parse_number(val):
    v = clean(val)
    if not v:
        return None
    v = v.replace("$", "").replace(",", "").replace("%", "")
    try:
        return float(v)
    except ValueError:
        return None


def import_realtors():
    print("\n=== Importing Realtor Contacts (Template 3) ===")
    rows = []
    seen = set()

    with open(DOWNLOADS + "/WSS-TEMPLATE 3.csv", "r", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            name = clean(r.get("Buyer Agent Name"))
            if not name:
                continue
            parts = name.split(None, 1)
            first = parts[0]
            last = parts[1] if len(parts) > 1 else "(none)"

            email = clean(r.get("Buyer Agent Email"))
            if email and "," in email:
                email = email.replace(",", ".")

            key = (first.lower(), last.lower(), (email or "").lower())
            if key in seen:
                continue
            seen.add(key)

            rows.append({
                "first_name": first,
                "last_name": last,
                "email": email,
                "phone": clean(r.get("Buyer Agent Cell")),
                "company_name": clean(r.get("Buyer Agent Company")),
                "contact_type": "realtor",
                "group_tag": "Realtor",
                "account_name": "Realtor Database",
                "source": "point-import",
                "organization_id": ORG_ID,
                "user_id": USER_ID,
            })

    print("  Parsed {} unique realtors".format(len(rows)))
    count = supabase_insert("contacts", rows)
    print("  Inserted {} realtors".format(count))
    return count


def import_loans():
    print("\n=== Importing Loan History (Template 2) ===")
    rows = []

    purpose_map = {"Purch": "Purchase", "Refi": "Refinance", "C/O Refi": "Cash-Out Refinance"}
    type_map = {"CONV": "Conventional", "FHA": "FHA", "VA": "VA", "USDA": "USDA"}

    with open(DOWNLOADS + "/WSS-TEMPLATE 2.csv", "r", encoding="utf-8-sig") as f:
        for r in csv.DictReader(f):
            ln = clean(r.get("Loan Number"))
            if not ln:
                continue

            raw_purpose = clean(r.get("Loan Purpose")) or ""
            raw_type = clean(r.get("Loan Type")) or ""
            raw_status = clean(r.get("Loan Status")) or "Funded"

            agent_email = clean(r.get("Buyer Agent Email"))
            if agent_email and "," in agent_email:
                agent_email = agent_email.replace(",", ".")

            term = parse_number(r.get("Loan Term", ""))

            rows.append({
                "loan_number": ln,
                "status": raw_status.capitalize(),
                "loan_purpose": purpose_map.get(raw_purpose, raw_purpose),
                "loan_type": type_map.get(raw_type, raw_type),
                "loan_program": clean(r.get("Loan Program")),
                "loan_amount": parse_number(r.get("Loan Amount", "")),
                "interest_rate": parse_number(r.get("Interest Rate", "")),
                "loan_term": int(term) if term else None,
                "down_payment": parse_number(r.get("Down Payment Amount", "")),
                "down_payment_pct": parse_number(r.get("Down Payment Percent", "")),
                "sales_price": parse_number(r.get("Sales Price", "")),
                "appraised_value": parse_number(r.get("Appraised Value", "")),
                "ltv": parse_number(r.get("LTV Ratio", "")),
                "property_address": clean(r.get("Subject Property Address")),
                "property_city": clean(r.get("Subject Property City")),
                "property_state": clean(r.get("Subject Property State")),
                "property_zip": clean(r.get("Subject Property Zip Code")),
                "property_type": clean(r.get("Property Type")),
                "occupancy": clean(r.get("Occupancy")),
                "application_date": parse_date(r.get("Application Date", "")),
                "closing_date": parse_date(r.get("Closing Date", "")),
                "funding_date": parse_date(r.get("Funding Date", "")),
                "buyer_agent_name": clean(r.get("Buyer Agent Name")),
                "buyer_agent_email": agent_email,
                "title_company": clean(r.get("Title Insurance Company")),
                "lender_name": clean(r.get("Lender Name")),
                "organization_id": ORG_ID,
                "user_id": USER_ID,
            })

    print("  Parsed {} loans".format(len(rows)))
    count = supabase_insert("loans", rows)
    print("  Inserted {} loans".format(count))
    return count


if __name__ == "__main__":
    print("=" * 50)
    print("LoanOS Import: Scott Sears (remaining)")
    print("=" * 50)
    r = import_realtors()
    l = import_loans()
    print("\nDONE: {} realtors + {} loans".format(r, l))
