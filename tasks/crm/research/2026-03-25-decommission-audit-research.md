# Research: Decommission Audit — Salesforce/Jungo → LoanOS
Date: 2026-03-25 PM
Session Type: Sequence A (Research Only)

## Executive Summary

The data is already migrated. Contacts (2,377) and loans (817+) are in LoanOS. Core automation
workflows are live in n8n. The question is no longer "how do we migrate" — it's "what breaks or
gets missed if Salesforce goes dark today?" This research maps every Salesforce/Jungo function
against its LoanOS equivalent and surfaces the gaps that must be closed before cancellation.

Salesforce contract runs through October 2026 regardless — there's no cost urgency. But there IS
workflow urgency: Adam is currently logging into two systems, which creates duplicate work and
data drift risk. The goal is to eliminate Salesforce logins as fast as possible.

---

## Decommission Audit Checklist — Current State

### Item 1: Automations Audit

**Salesforce/Jungo automations currently running:**
Jungo is a Salesforce overlay that provides mortgage-specific automation templates. Based on the
2026-03-12 automation audit and MEMORY.md workflow inventory, the following categories were active:

| Salesforce/Jungo Automation | n8n Equivalent | n8n Status | Gap? |
|-----------------------------|---------------|-----------|------|
| New loan notification (from Arive) | WF1 — Arive New Loan → Supabase (`1tagvoU0UXtdDiMY`) | ✅ Tested — NOT pushed to cloud | ⚠️ Must push |
| Loan status update notification | WF2 — Arive Status Update → Supabase (`9JyzzwKac8v3uQ7d`) | ✅ Tested — NOT pushed to cloud | ⚠️ Must push |
| Milestone communication emails | Milestone Communication Agent (`1hjOmS7inZcxEJQr`) | ✅ Tested | ✅ |
| Referral intro email | Referral Intro Email (`YbgDnTpPdefcazKy`) | ✅ Tested | ✅ |
| Pre-approval congratulations email | Pre-Approval Email (`utMvZpkdRwIRZ51u`) | ✅ Tested | ✅ |
| Closing Disclosure (CD) email | Final CD Email (`SkzrWeR0bHZs8kWX`) | ⚠️ Untested | ⚠️ Needs test |
| New application received notification | New Application Received (`cWESnXXy9UOLB13q`) | ⚠️ Untested | ⚠️ Needs test |
| Post-close review request | Review Request Email (`AK1fBcaX1cPcdlGx`) | ⚠️ Fixed, inactive (needs SMTP URL) | ⚠️ Blocked |
| Refi intake email | Refi Intake Email (`yCTydQ7RfZK4DyUg`) | ⚠️ Untested | ⚠️ Needs test |
| Contract received workflow | Contract Received (`UfNcdpoVKQZqy0fj`) | 🔴 Phase 2 only | ❌ Not built |
| Inbound email logging | Inbound Email → Supabase (`qgb99Eh2ziy0INMk`) | ⚠️ Deployed inactive (needs Outlook credential) | ⚠️ Blocked (Azure) |
| Weekly social post | Weekly GBP + Social Post (`V6RhmJpOb7pOzMte`) | ✅ Active | ✅ |
| Birthday/anniversary emails | None | 🔴 Not built | ❌ Gap |
| Pre-approval expiration reminders | None | 🔴 Not built | ❌ Gap |
| Rate watch alerts for past clients | None | 🔴 Not built | ❌ Gap |
| Post-close check-in sequence | None | 🔴 Not built | ❌ Gap |
| Lead nurture drip sequence | None | 🔴 Not built | ❌ Gap |
| Realtor monthly value report | None | 🔴 Not built | ❌ Gap |
| Outlook email sync (inbound emails → CRM) | Outlook Email Sync (`JMmstRl2C5ylmuIY`) | 🔴 Blocked — Azure AD app not registered | ❌ Blocked |

**Automation Gap Summary:**
- ✅ Live and working: 5 automations
- ⚠️ Built but needs action (push, test, fix): 7 automations
- ❌ Not built yet: 6 automations (mostly nurture/relationship sequences)
- ❌ Blocked externally: 1 (Outlook sync — Azure AD)

**Immediate unblocking actions (Adam must do):**
1. Push WF1 to n8n cloud (`1tagvoU0UXtdDiMY`) — new loans from Arive stop landing
2. Push WF2 to n8n cloud (`9JyzzwKac8v3uQ7d`) — loan status updates stop syncing
3. Set `ZAPIER_DISPATCH_WEBHOOK_URL` env var (needed for digest delivery AND milestone email push)
4. Provide SMTP review URL for Review Request Email workflow

---

### Item 2: Workflow Gaps — Manual Processes in Salesforce

These are things Adam does IN the Salesforce/Jungo UI that have no direct equivalent in LoanOS yet:

| Manual Process | LoanOS Equivalent | Status |
|----------------|------------------|--------|
| Log a call / meeting note | Contact activity log | ✅ Available via contact detail page |
| Create a follow-up task | Todo list (in Dashboard Queue tab) | ✅ Available — TodoList now rendered |
| Mark contact as realtor vs. borrower | `contact_type` field + smart lists | ✅ Available |
| View realtor's referred borrowers | "Referred Borrowers" section on contact page | ✅ Added 2026-03-20 |
| Search contacts by name/email | Contacts search | ✅ Available (500-record cap affects completeness) |
| View pipeline by stage | Dashboard stage cards + loans filter | ✅ Available |
| Send pre-approval letter | PA extraction + email automation | ✅ Available |
| View loan detail | Loan detail page with LoanInfoGrid | ✅ Available |
| Access Mortgage Coach (TCA) | Scenario Builder | ✅ Built (Phase 1 complete) |
| AI daily briefing | Daily Briefing page | ✅ Available |
| Hot leads view | Hot Leads widget on dashboard | ✅ Added 2026-03-23 |
| Document upload | Supabase Storage + document management | ✅ Available |
| Add lead to marketing list | Manual — no import flow | ⚠️ CSV import wired but no backend logic |
| Smart lists (saved contact filters) | Smart list system | ⚠️ 3 smart lists exist ("Closed Borrowers" is bugged) |
| Birthday/anniversary tracking | `birthdate` stored — no automation | ❌ Data there, no trigger |
| Bulk email campaign | Mailchimp via n8n | ⚠️ Available but manual trigger |
| Assign lead source | `lead_source` field | ✅ Field exists, not surfaced in UI |
| Track pre-approval expiration | `pre_approval_expiration` on loans? | ❓ Unknown — check loans schema |

**Key finding:** Most daily actions Adam performs in Salesforce are already available in LoanOS.
The main gap is relationship nurture automations (birthday, rate watch, check-in sequences).

---

### Item 3: Reporting Gaps

Salesforce/Jungo reports Adam likely uses:

| Report | LoanOS Equivalent | Status |
|--------|------------------|--------|
| Pipeline by stage (count + volume) | Dashboard stage cards | ✅ Available |
| Monthly loan closings | Loans table filtered by closing_date | ✅ Available (manual) |
| Referral source report (which realtors send most business) | Referral tracking on contact page | ⚠️ Per-realtor only, no aggregate report |
| YTD closed loan volume + commission | No aggregated view | ❌ Gap |
| Contact activity history | Activity log on contact page | ✅ Available |
| Email deliverability / open rates | Mailchimp (external) | ✅ External |
| Pre-approval pipeline | Smart list + loans filter | ⚠️ Partial |
| Past client list for rate watch | Closed contacts filter | ✅ Contacts filterable by stage |
| Realtor ranking (production volume) | `top_realtor` / `target_realtor` flags only | ⚠️ No production volume data |

**Key reporting gap:** No aggregated YTD production report (loan volume, commission, referral source
breakdown). This is a "nice to have" for a solo LO — the data exists in loans table but no UI yet.
**This is not a blocker for decommissioning Salesforce.**

---

### Item 4: Contacts Completeness

Confirmed from AM session live query:
- LoanOS contacts: **2,377**
- Salesforce contacts referenced in AM session audit: **2,441** (from Week 1 bulk import file)
- Delta: **64 contacts potentially in Salesforce but not LoanOS**

The 64-record gap could be:
- Contacts created in Salesforce AFTER the bulk import (2026-03-13 to today)
- Contacts that failed to import (email dedup collisions, format errors)
- Count discrepancy between NotebookLM cached count vs. actual import

**Recommendation for contacts completeness check:**
Adam should run a fresh Salesforce contact export and compare email list against LoanOS.
This is a ~15 minute task: export CSV from Salesforce, run a quick Python/Node script to diff.
The dedup spec (tasks/crm/specs/2026-03-25-contact-dedup-spec.md) is written and ready if
there are new records to import.

**This IS a blocker for full decommissioning — must confirm no contacts are missing.**

---

### Item 5: Realtor Database

From live query (AM session):
- `top_realtor = true` records: unknown count
- `target_realtor = true` records: unknown count
- Production volume (loans per realtor): only tracked via `buyer_agent_contact_id` +
  `listing_agent_contact_id` on the loans table — no aggregated view

The "Referred Borrowers" section on the contact detail page (added 2026-03-20) shows loans
per realtor. But there is no:
- Realtor ranking dashboard (who sends the most business)
- Production volume field (separate from loan count)
- Preferred areas / market specialization data

**Jungo realtor enrichment features LoanOS is missing:**
- Production volume (homes sold per year) — Jungo had a custom field for this
- Market specialization (zip codes / neighborhoods)
- Rating/tier classification

**Recommendation:** The "Realtor enrichment" (Week 6 in original plan) is low priority for
decommissioning. Adam can continue using LoanOS for realtor tracking with current fields.
The ranking report is a nice-to-have, not a dependency for canceling Salesforce.

---

### Item 6: UI Gaps Blocking Daily Use

These are bugs or missing features that would cause Adam to reach for Salesforce instead of LoanOS:

| Gap | Severity | Blocked By |
|-----|----------|-----------|
| **Pagination cap — 1,877 contacts unreachable** | HIGH — Adam can only see 500 of 2,377 contacts | Code fix needed (contacts API + UI) |
| **"Closed Borrowers" smart list bug** — queries `stage IN ('Closed Client')` → 0 results | HIGH — smart list returns nothing | 1-line fix in smart list query |
| **Performance page uses localStorage** — real borrower names in seed data | MEDIUM — security risk if device shared | Code fix needed |
| **CSV import backend missing** — UI wired but no processing logic | MEDIUM — can't easily add new contacts from CSV | Backend route needed |
| **Inbound email sync broken** — Azure AD not registered | MEDIUM — no email history in LoanOS | Azure setup (Adam must do) |
| **WF1/WF2 not on n8n cloud** — null org_id rows accumulate | HIGH — data quality issue | Adam must push workflows |
| **Plan selection in onboarding defaults to 'starter'** | LOW — internal | Not blocking daily use |
| **`ZAPIER_DISPATCH_WEBHOOK_URL` not set** | HIGH — milestone emails don't reach Outlook | Adam must set env var |
| **Review Request Email inactive** | MEDIUM — post-close automation not running | Adam must provide SMTP review URL |
| **Lead source not surfaced in contacts UI** | LOW — field exists, not shown | UI enhancement |

**Fix priority order (what to tackle next session):**
1. "Closed Borrowers" smart list fix — 1 line, zero risk, immediate value
2. Contacts pagination cap — code fix, high value (1,877 contacts accessible)
3. ZAPIER_DISPATCH_WEBHOOK_URL — Adam action required
4. WF1/WF2 cloud push — Adam action required
5. Performance page localStorage fix — security improvement

---

### Item 7: Adam Sign-Off Checklist

For Adam to say "I don't need to log into Salesforce for anything":

**Data:**
- [ ] **Contacts completeness verified** — fresh SF export compared against LoanOS (64-record gap resolved)
- [ ] Confirm no leads in SF created since March 13 are missing from LoanOS

**Automations:**
- [ ] WF1 pushed to n8n cloud (Arive new loan sync)
- [ ] WF2 pushed to n8n cloud (Arive status update sync)
- [ ] `ZAPIER_DISPATCH_WEBHOOK_URL` set in Vercel env vars
- [ ] CD email tested end-to-end
- [ ] New Application Received tested end-to-end
- [ ] Review Request Email activated (needs SMTP review URL from Adam)
- [ ] Refi Intake Email tested

**UI:**
- [ ] "Closed Borrowers" smart list fixed (1-line code change)
- [ ] Contacts pagination cap removed (all 2,377 contacts visible)

**Nice-to-have (not blocking):**
- [ ] YTD production report (can defer post-decommission)
- [ ] Realtor ranking dashboard (can defer)
- [ ] Birthday/anniversary automation (can build post-decommission, Salesforce also wasn't doing this consistently)

**Adam's explicit sign-off:** Spend 1 week using only LoanOS for daily work. Note anything missing. Return with the list.

---

## Recommended PM Session Action List

**Next session should run Sequence C (Execute/Build) on:**

1. **Fix "Closed Borrowers" smart list** — Builder: 1-line change in contacts smart list query
2. **Fix contacts pagination cap** — Builder: increase/remove 500-record cap in contacts API + UI
3. **Run a fresh Salesforce export diff** — Research: quantify the 64-contact gap

**Adam action items (not blockable by Claude):**
1. Push WF1 and WF2 to n8n cloud
2. Set `ZAPIER_DISPATCH_WEBHOOK_URL` in Vercel environment variables
3. Provide SMTP review page URL for Review Request Email
4. Run fresh Salesforce contact export and share location

**Blockers to write up:**
- None currently. Azure AD (Outlook sync) is a known long-standing blocker — not critical for decommissioning.

---

## Open Questions Requiring Adam's Input

1. **Contacts gap** — Are there leads or clients created in Salesforce after March 13 that are NOT in LoanOS yet? If so, where is the fresh Salesforce export?
2. **"Type" column values** — From AM session: what values besides "Client" and "Business Contact" appear in Salesforce's "Type" field? Needed if/when the dedup spec is eventually run.
3. **Birthday automations** — Is birthday/anniversary email important enough to build before canceling Salesforce? Jungo had this built-in.
4. **Post-close check-in sequence** — Jungo had a 7-touch post-close sequence. Does Adam want this rebuilt in n8n before canceling?
5. **Reporting** — Is the YTD production/commission report something Adam checks in Salesforce monthly? If yes, LoanOS needs this before decommission.
