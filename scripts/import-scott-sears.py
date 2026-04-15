#!/usr/bin/env python3
"""
Import Scott Sears' data into LoanOS.
  - WSS-TEMPLATE 1.csv → contacts (borrowers)
  - WSS-TEMPLATE 3.csv → contacts (realtors)
  - WSS-TEMPLATE 2.csv → loans (historical)
"""

import csv
import json
import sys
import urllib.request
from datetime import datetime
from typing import Dict, List, Optional

SUPABASE_URL = "https://uuqedsvjlkeszrbwzizl.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ"
ORG_ID = "40377391-6b4c-4d1a-81d2-ffd743876f0b"
USER_ID = "975c8e19-aa6a-4cd5-9ca8-c727d3be9a15"

DOWNLOADS = "/Users/adamstyer/Downloads"


def supabase_insert(table: str, rows: List[Dict], upsert_col: Optional[str] = None) -> int:
    """Bulk insert into Supabase via PostgREST. Returns count inserted."""
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    headers = {
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    if upsert_col:
        headers["Prefer"] = f"resolution=merge-duplicates,return=minimal"
        url += f"?on_conflict={upsert_col}"

    # Batch in groups of 100
    total = 0
    for i in range(0, len(rows), 100):
        batch = rows[i : i + 100]
        data = json.dumps(batch).encode()
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req) as resp:
                total += len(batch)
        except urllib.error.HTTPError as e:
            body = e.read().decode()
            print(f"  ERROR batch {i}-{i+len(batch)}: {e.code} {body[:300]}")
            # Try inserting one-by-one to find the bad row
            for j, row in enumerate(batch):
                data2 = json.dumps([row]).encode()
                req2 = urllib.request.Request(url, data=data2, headers=headers, method="POST")
                try:
                    with urllib.request.urlopen(req2) as resp2:
                        total += 1
                except urllib.error.HTTPError as e2:
                    body2 = e2.read().decode()
                    print(f"    SKIP row {i+j}: {row.get('first_name','')} {row.get('last_name','')}: {body2[:200]}")
    return total


def clean(val: str) -> Optional[str]:
    """Strip whitespace, return None for empty."""
    if val is None:
        return None
    v = val.strip()
    return v if v else None


def parse_date(val: str) -> Optional[str]:
    """Parse various date formats to ISO."""
    v = clean(val)
    if not v:
        return None
    for fmt in ("%m/%d/%Y", "%m/%d/%Y %I:%M:%S %p", "%Y-%m-%d"):
        try:
            return datetime.strptime(v, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def parse_number(val: str) -> Optional[float]:
    """Parse numeric string, stripping $ and commas."""
    v = clean(val)
    if not v:
        return None
    v = v.replace("$", "").replace(",", "").replace("%", "")
    try:
        return float(v)
    except ValueError:
        return None


def import_borrowers():
    """Import WSS-TEMPLATE 1 as borrower contacts."""
    print("\n=== Importing Borrower Contacts (Template 1) ===")
    rows = []
    seen = set()

    with open(f"{DOWNLOADS}/WSS-TEMPLATE 1.csv", "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for r in reader:
            first = clean(r.get("Borrower First Name"))
            last = clean(r.get("Borrower Last Name"))
            if not first or not last:
                continue

            # Dedupe by name+email
            email = clean(r.get("Borrower Email"))
            key = (first.lower(), last.lower(), (email or "").lower())
            if key in seen:
                continue
            seen.add(key)

            row = {
                "first_name": first,
                "last_name": last,
                "email": email,
                "phone": clean(r.get("Borrower Mobile Phone")),
                "home_phone": clean(r.get("Borrower Home Phone")),
                "mailing_street": clean(r.get("Subject Property Address")),
                "mailing_city": clean(r.get("City")),
                "mailing_state": clean(r.get("State")),
                "mailing_zip": clean(r.get("Zip")),
                "birthdate": parse_date(r.get("Birthdate", "")),
                "co_borrower_first": clean(r.get("Co-Borrower First Name")),
                "co_borrower_last": clean(r.get("Co-Borrower Last Name")),
                "co_borrower_mobile": clean(r.get("Co-Borrower Home Phone")),
                "contact_type": "borrower",
                "group_tag": "Client",
                "account_name": "Database",
                "source": "point-import",
                "organization_id": ORG_ID,
                "user_id": USER_ID,
            }

            created = parse_date(r.get("Created Date", ""))
            if created:
                row["created_date"] = created

            # Remove None values
            row = {k: v for k, v in row.items() if v is not None}
            rows.append(row)

    print(f"  Parsed {len(rows)} unique borrower contacts")
    count = supabase_insert("contacts", rows)
    print(f"  Inserted {count} borrower contacts")
    return count


def import_realtors():
    """Import WSS-TEMPLATE 3 as realtor contacts."""
    print("\n=== Importing Realtor Contacts (Template 3) ===")
    rows = []
    seen = set()

    with open(f"{DOWNLOADS}/WSS-TEMPLATE 3.csv", "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for r in reader:
            name = clean(r.get("Buyer Agent Name"))
            if not name:
                continue

            # Split name into first/last
            parts = name.split(None, 1)
            first = parts[0] if parts else name
            last = parts[1] if len(parts) > 1 else ""
            if not last:
                last = "(no last name)"

            email = clean(r.get("Buyer Agent Email"))
            # Fix common CSV issue: comma in email field
            if email and "," in email:
                email = email.replace(",", ".")

            key = (first.lower(), last.lower(), (email or "").lower())
            if key in seen:
                continue
            seen.add(key)

            row = {
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
            }
            row = {k: v for k, v in row.items() if v is not None}
            rows.append(row)

    print(f"  Parsed {len(rows)} unique realtor contacts")
    count = supabase_insert("contacts", rows)
    print(f"  Inserted {count} realtor contacts")
    return count


def import_loans():
    """Import WSS-TEMPLATE 2 as historical loans."""
    print("\n=== Importing Loan History (Template 2) ===")
    rows = []

    with open(f"{DOWNLOADS}/WSS-TEMPLATE 2.csv", "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for r in reader:
            loan_number = clean(r.get("Loan Number"))
            if not loan_number:
                continue

            # Map loan purpose
            purpose_map = {"Purch": "Purchase", "Refi": "Refinance", "C/O Refi": "Cash-Out Refinance"}
            raw_purpose = clean(r.get("Loan Purpose")) or ""
            purpose = purpose_map.get(raw_purpose, raw_purpose)

            # Map loan type
            type_map = {"CONV": "Conventional", "FHA": "FHA", "VA": "VA", "USDA": "USDA"}
            raw_type = clean(r.get("Loan Type")) or ""
            loan_type = type_map.get(raw_type, raw_type)

            # Map status
            raw_status = clean(r.get("Loan Status")) or ""
            status = raw_status.capitalize() if raw_status else "Funded"

            row = {
                "loan_number": loan_number,
                "status": status,
                "loan_purpose": purpose,
                "loan_type": loan_type,
                "loan_program": clean(r.get("Loan Program")),
                "loan_amount": parse_number(r.get("Loan Amount", "")),
                "interest_rate": parse_number(r.get("Interest Rate", "")),
                "loan_term": int(parse_number(r.get("Loan Term", "")) or 0) or None,
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
                "buyer_agent_email": clean(r.get("Buyer Agent Email")),
                "title_company": clean(r.get("Title Insurance Company")),
                "lender_name": clean(r.get("Lender Name")),
                "organization_id": ORG_ID,
                "user_id": USER_ID,
            }

            # Fix email comma issue
            if row.get("buyer_agent_email") and "," in row["buyer_agent_email"]:
                row["buyer_agent_email"] = row["buyer_agent_email"].replace(",", ".")

            row = {k: v for k, v in row.items() if v is not None}
            rows.append(row)

    print(f"  Parsed {len(rows)} loans")
    count = supabase_insert("loans", rows)
    print(f"  Inserted {count} loans")
    return count


if __name__ == "__main__":
    print("=" * 60)
    print("LoanOS Import: Scott Sears (W. Scott Sears | MSLP)")
    print(f"Org:  {ORG_ID}")
    print(f"User: {USER_ID}")
    print("=" * 60)

    b = import_borrowers()
    r = import_realtors()
    l = import_loans()

    print("\n" + "=" * 60)
    print(f"DONE: {b} borrowers + {r} realtors + {l} loans imported")
    print("=" * 60)
