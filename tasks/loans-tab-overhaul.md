# LOANS TAB OVERHAUL
## 1. FIX STATUS FILTER — "STARTED" NOT MATCHING
The status filter value "started" returns zero results. Debug the filter logic in the Loans page. The Arive data likely uses a different casing or value (e.g. "LOAN_SETUP", "Loan in Process").
- Audit all distinct status values in the loans Supabase table
- Map each to the correct filter option
- If filter values are hardcoded strings, replace with a dynamic query that pulls distinct status values from Supabase
Also add a DELETE button on each loan row (with confirmation dialog). Permanently removes the loan record from Supabase.
---
## 2. EXPANDED FILTER PANEL
Add the following filters to the Loans list view (sidebar or top filter bar, collapsible):
- Status (multi-select dropdown, values pulled dynamically from Supabase)
- Purpose (Purchase / Refinance / HELOC)
- Program (FHA, Conventional, VA, USDA, Jumbo — pulled dynamically if available)
- Closing Date (date range picker: from / to)
- Interest Rate Greater Than (numeric input, e.g. "> 6.5%")
- Lender (dropdown, pulled dynamically)
- Location / State (text or dropdown)
All filters should be combinable (AND logic). Add a "Clear All Filters" button.
---
## 3. SEARCHABLE COLUMN SELECTOR — ALL FIELDS
The "Add Column" dropdown must be:
- Searchable (type to filter field names)
- Comprehensive — include EVERY field available in the loans Supabase table (run a schema introspection query to get the full column list)
- Must include: interest_rate, lender, rate_lock_expiration, closing_date, program, loan_number, purpose, status, amount, borrower email, borrower phone, property address, and any other fields in the schema
---
## 4. LOAN ROW — TWO-COLUMN BORROWER + LOAN NAME
Currently clicking a loan only opens the borrower contact record. Change the row layout so there are two distinct clickable elements:
Column 1 — Borrower Name: clicking opens the Contact record (existing behavior)
Column 2 — Loan Name / File Name (e.g. "Jennings - 16248211"): clicking opens the Loan detail record
Both must be styled as links (gold underline on hover, cursor pointer).
---
## 5. LOAN DETAIL RECORD — EXPANDED VIEW
When a user clicks the Loan Name and opens the loan detail panel or page, it must display:
- Borrower name (linked to contact)
- Loan amount
- Status (with colored badge — see section 6)
- Purpose
- Program
- Lender name
- Closing date
- Rate lock expiration date
- Interest rate
- Property address
- Loan number / file ID
- Email and phone
Pull all fields from Supabase. Display nulls as em dashes (—), not blank.
---
## 6. STATUS BADGE COLOR SYSTEM
Each status needs a unique color. Do NOT use green for multiple statuses. Apply these:
| Status | Color |
|---|---|
| LOAN_SETUP | #64748B (slate gray) |
| DISCLOSURE_SENT | #7C3AED (purple) |
| UNDERWRITING_SUBMITTED | #2563EB (blue) |
| Loan in Process | #D97706 (amber) |
| RE_SUBMITTAL | #DC2626 (red) |
| CLEAR_TO_CLOSE | #16A34A (green) |
| APPROVED | #0891B2 (teal) |
| CLOSED | #C9A84C (gold — design system accent) |
Add any additional statuses discovered in the data with unique colors from this palette. Never assign the same color to two different statuses.
---
## DESIGN RULES
- IBM Plex Mono + IBM Plex Sans
- Dark monochromatic — no white backgrounds
- Gold accent: #C9A84C
- Null fields display as em dashes
- Match Contacts page aesthetic for consistency
## COMMIT
feat: loans tab overhaul — filters, searchable columns, dual-click rows, loan detail view, status color system
