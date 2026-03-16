# Dashboard & Loan Detail Audit — 2026-03-16

## 1. Loan Detail — Actions Tab

**8 automation buttons exist** in the Actions dropdown. All route to the Automations tab via `setActiveTab('automations')`. None pre-select a specific automation.

| Button | Routes to Automations Tab? | Pre-selects automation? |
|--------|---------------------------|------------------------|
| Send PA Email | ✅ | ❌ |
| Send CD Email | ✅ | ❌ |
| Refi Intake Email | ✅ | ❌ |
| Send Refi Analysis | ✅ | ❌ |
| Referral Intro Email | ✅ | ❌ |
| Website Lead Follow-up | ✅ | ❌ |
| New Application Received | ✅ | ❌ |
| Contract Received | ✅ | ❌ |

## 2. Loan Detail — Automations Tab

**Only 4 workflows displayed** (WORKFLOWS array, line 165):
1. Final CD Email (`loanos-final-cd`)
2. Pre-Approval Email (`loanos-pre-approval`)
3. Referral Intro Email (`loanos-referral-intro`)
4. New Application Received (`loanos-new-application`)

**Missing from loan detail Automations tab:**
- Refi Intake Email
- Refi Analysis
- Website Lead Follow-up
- Contract Received

## 3. Standalone Automations Page (`/dashboard/automations`)

**5 workflows displayed** (WORKFLOWS array, line 11):
1. Final CD Email
2. Pre-Approval Email
3. Referral Intro Email
4. New Application Received
5. Refi Intake Email

**Missing from standalone page:**
- Refi Analysis
- Website Lead Follow-up
- Contract Received

## 4. Activity Tab — Verdict: WORKING

- Table: `activity_log` EXISTS in Supabase (not `loan_activity`)
- Schema: id, created_at, action, entity_type, entity_id, metadata, user_id, type, summary, raw_payload, external_id, loan_id, contact_id
- Insert works: `supabase.from('activity_log').insert({...})` (line 1481)
- Refresh works: calls `onRefresh()` which re-fetches all data
- Display: timeline with system/manual filter, type badges, relative timestamps
- **No issues found** — activity logging is functional

## 5. Dashboard — Hyperlink Audit

| Element | Currently Linked? | Target |
|---------|-------------------|--------|
| Pipeline Loans (count) KPI | ❌ | `/dashboard/loans?stage=pipeline` |
| Gross Commission KPI | ❌ | `/dashboard/loans` |
| Commission YTD KPI | ❌ | `/dashboard/loans?stage=funded&period=ytd` |
| This Month KPI | ❌ | `/dashboard/loans?stage=funded&period=mtd` |
| Stage cards (Pre-Approval, Processing, etc.) | ✅ | `/dashboard/loans?stage=...` |
| "View all" active loans link | ✅ | `/dashboard/loans` |
| Urgent flags (individual loans) | ✅ | `/dashboard/loans/{id}` |
| Needs Attention loans | ✅ | `/dashboard/loans/{id}` |
| Today's Focus section | ❌ | `/dashboard/marketing` |
| Active Loans table rows | ✅ | `/dashboard/loans/{id}` |
| Activity feed items | ❌ | No link to entity |

## 6. Loans List — Filter Support

- Currently accepts NO query params from URL
- Uses client-side smart lists only (SMART_LISTS array)
- No `stage`, `filter`, or `period` URL param handling
- Supabase query does not filter by stage

## 7. Supabase Tables (verified via MCP)

16 tables exist: activity_log, automation_logs, chat_sessions, contacts, documents, email_drafts, loan_milestone_events, loan_status_history, loans, mcc_state, milestone_communications, oauth_state, outlook_tokens, scenarios, todo_items, user_settings

No `loan_activity` table needed — `activity_log` has all required columns.
