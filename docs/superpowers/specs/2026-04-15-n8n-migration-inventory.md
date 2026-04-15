# n8n Migration Inventory — Phase 1 & Phase 2 Roadmap

**Date:** 2026-04-15
**Status:** Active — companion to [email-automation-dashboard-design.md](./2026-04-15-email-automation-dashboard-design.md)
**Instance:** https://styer.app.n8n.cloud

Inventory of all 33 n8n workflows (29 active, 4 inactive) as of 2026-04-15, categorized for migration to Vercel Workflow DevKit.

## Categories

- **🔴 Phase 1 — Replace this sprint.** Logic moves to Workflow DevKit. n8n workflow archived at kill date.
- **🟡 Phase 2 — Candidate for future migration.** Similar email/drip pattern; revisit after Phase 1 ships.
- **🟢 Keep on n8n.** Ingress, native integrations, or scheduling where n8n is the right tool. No migration planned.
- **⚪ Inactive.** Currently disabled; decide keep/delete during Phase 2.

## Phase 1 — Replace (4 workflows)

| ID | Name | Replaced by | Kill date |
|---|---|---|---|
| `PiuIsQpBuydtFM4m` | LoanOS — Web Lead Automation | `workflows/web-lead-intake.ts` | Day 61 post-cutover |
| `rwi3qEYgJKGGHkHc` | LoanOS — PA Welcome Nurture (6 emails, 60 days) | `workflows/pa-welcome-nurture.ts` | Day 61 post-cutover |
| `0M8Vnf6MhB1xtaIg` | LoanOS — DPA Guide Nurture (8 emails, 52 days) | `workflows/dpa-guide-nurture.ts` | Day 61 post-cutover |
| `utMvZpkdRwIRZ51u` | LoanOS — Pre-Approval Email | `workflows/pre-approval-email.ts` | Day 61 post-cutover |

## Phase 2 — Candidates (11 workflows)

Email/notification flows that follow the same migration pattern. Revisit after Phase 1 ships and shadow-mode data confirms the pattern works.

| ID | Name | Priority | Notes |
|---|---|---|---|
| `yTkiV6pf2eZaJw82` | Website — FTB Guide Welcome Email | High | Single-send, easy port |
| `SkzrWeR0bHZs8kWX` | LoanOS — Final CD Email | High | Single-send, manual trigger pattern |
| `YbgDnTpPdefcazKy` | LoanOS — Referral Intro Email | High | Has email_opt_out check — already enforces policy |
| `yCTydQ7RfZK4DyUg` | LoanOS — Refi Intake Email | High | Multi-tenant LO identity lookup |
| `cWESnXXy9UOLB13q` | LoanOS — New Application Received | Medium | Logs + notifies |
| `UfNcdpoVKQZqy0fj` | LoanOS — Contract Received | Medium | PDF extraction → LoanOS — heavier port |
| `J9Pe24vUi6fpZtdZ` | LoanOS — Pre-Approval Lead Notify | Medium | Mailchimp tag + email — might fold into Phase 1 `webLeadIntakeWorkflow` |
| `LqBb3YDLjS2eUrDE` | LoanOS — Drip Email Scheduler | Medium | **May become obsolete** after Phase 1 — Workflow DevKit handles scheduling natively via `sleep()`. Evaluate: is it still needed for legacy campaigns? |
| `AK1fBcaX1cPcdlGx` | Closed Loan — Review Request Email | Medium | Currently inactive. Has opt-out enforcement. |
| `Pf1zWuKAnD4SznSR` | LoanOS — Rate Check Form Submission | Low | Form intake — similar to web-lead pattern |
| `Rn6rtlKeoQ0CrUkb` | LoanOS — LO Waitlist Intake | Low | Form intake |

### Refi Watch family (5 workflows)

Separate sub-system with its own logic. Migrate as a group or leave as-is.

| ID | Name | Status |
|---|---|---|
| `iyKFy0ODkyyqQaAS` | LoanOS — Refi Watch Rate Drop Alert | Active |
| `ZUeGy8u8P4o6DPM3` | LoanOS — Refi Watch Anniversary Check-In | Active |
| `3iXImUkjgMitpJKt` | LoanOS — Refi Watch Set Rate | Active |
| `W0K4YDzkZd0Hzv6g` | LoanOS — Refi Watch Pre-Drop Warm-Up | Inactive |
| `LfLSDgqgb6yCe93C` | LoanOS — Refi Watch Quarterly Rate Review | Inactive |

**Recommendation:** Migrate as a bundle in Phase 2. All five share borrower-list iteration + rate-threshold logic that's cleaner as one Workflow DevKit group.

## Keep on n8n (13 workflows)

These stay on n8n permanently — ingress, native integrations, or scheduling that n8n does well.

### External webhook ingress (Arive, iMessage, local scripts)

| ID | Name | Why keep |
|---|---|---|
| `1tagvoU0UXtdDiMY` | LoanOS — Arive New Loan → Supabase | External webhook (Arive calls n8n URL) |
| `9JyzzwKac8v3uQ7d` | LoanOS — Arive Status Update → Supabase | External webhook |
| `nccX5ml82mMGyE9T` | LoanOS — iMessage → Supabase Log | Local script ingress |

### Outlook-bound polling

| ID | Name | Why keep |
|---|---|---|
| `qgb99Eh2ziy0INMk` | LoanOS — Inbound Email → Supabase Log | Outlook polling every 5min — n8n's Outlook trigger handles this natively |
| `HkLjsnnhT5MgrX5H` | LoanOS — Outlook CD & Contract Extractor | Outlook search + download |
| `hHXpKUirhnBCnQTO` | LoanOS — Lender Email Ingest | Outlook → Claude → Supabase |
| `eb9UsV5Z6odh7Yex` | LoanOS — Generic Outlook Draft | Simple webhook → Outlook bridge; no logic to migrate |

### Social / content (weekly schedules)

| ID | Name | Why keep |
|---|---|---|
| `V6RhmJpOb7pOzMte` | Weekly GBP + Social Post | Weekly cron, Gemini + Publer |
| `eJG4wckrj6SmSpm1` | Weekly Testimonial Social Post | Weekly cron |
| `s5JWQMZgKWOsyqZ7` | Rancho Moonrise — Blog → GBP Post | Separate business unit |
| `QYxXYLx5WgKI9393` | Rancho Moonrise — GBP Event Sync | Separate business unit |
| `kCS88EjWlP7R6yXm` | Rancho Moonrise — Stuck Events Audit | Separate business unit |

## Inactive — decide during Phase 2

| ID | Name | Notes |
|---|---|---|
| `W0K4YDzkZd0Hzv6g` | LoanOS — Refi Watch Pre-Drop Warm-Up | Part of Refi Watch family |
| `LfLSDgqgb6yCe93C` | LoanOS — Refi Watch Quarterly Rate Review | Part of Refi Watch family |
| `PBu2Zt0YpiLHeqbL` | LoanOS — Post-Calendly Booking Automation | Never shipped. Migrate to Workflow DevKit directly if revived. |
| `AK1fBcaX1cPcdlGx` | Closed Loan — Review Request Email | Listed in Phase 2 above |

## Migration counts

| Category | Count |
|---|---|
| Phase 1 (replace now) | 4 |
| Phase 2 (revisit) | 11 (+5 Refi Watch family = 16 candidates) |
| Keep on n8n | 13 |
| Inactive | 4 |
| **Total active today** | **29** |
| **Total after Phase 1 archive** | **25 (4 fewer)** |
| **Total after Phase 2 complete (projected)** | **13** |

## Success measure for Phase 2 decision

Phase 2 proceeds only if Phase 1 Stage 2 (parity review) passes cleanly. If shadow mode surfaces unexpected issues with Workflow DevKit at LoanOS scale, re-evaluate before migrating more.
