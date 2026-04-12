# LoanOS Launch Standup Log

---

## 2026-04-11 — Day 17 of 26 (15 days to launch)

**Days to launch:** 15

**Yesterday shipped:**
- `security(pii)`: Deploy #2 of PII hardening — `writeActivityWithPii` now writes only public fields to `activity_log` inline; PII goes exclusively to encrypted companion (`activity_log_pii`). Orphan rollback on companion insert failure. Read path removes inline-column fallback.
- `test(pii)`: `verify-live-decrypt` helper script — decrypts companion rows via real helpers, byte-compares against inline plaintext. Gates the migration that drops plaintext columns.
- `fix(social)`: Closed Publer publish backlog — media guard (refuse media-less formats), post-ID extraction from response, per-tenant Publer API key, settings UI, split "publish now" vs "schedule" modes.

**Blockers:**
- GOALS.md #2 (email automation) — `HkLjsnnhT5MgrX5H` (CD & Contract Extractor) still INACTIVE. Zero progress. Highest-value unstarted automation.
- PII backfill (`scripts/backfill-activity-pii.ts`) not run — 306 orphan rows still have plaintext inline. Column drop blocked until backfill + verify-live-decrypt both pass.
- Set Rate webhook never called — Seq A (Refi Watch) active but idle; no refi alerts have ever fired. Adam must `POST /webhook/refi-watch-set-rate` with current rate.
- Renovation Phase 3 blocked — Adam hasn't confirmed Phase 2 done.
- Demo data cleanup (marketing site) — blocks May 1 launch screenshots.

**Today's focus:** PII Phase 3 — run backfill script, run verify-live-decrypt, confirm pass, then drop plaintext columns via migration 083. Closes Critical #3 fully and clears last hard security gate before LO #2.

**Risk watch:** 15 days out. Email automation (GOALS.md #2) unstarted. Renovation Phases 3–6 not started. Marketing site demo data blocked. Social selfies upload still pending (7 sessions). Adam decisions stacking: Phase 2 confirmation, Set Rate webhook, Seq C activation, Post 39 approval (due April 15 — 4 days). Timeline is tight but not broken — needs Adam to unblock items this weekend.

**Open audit findings:** PII Critical #3 partial (deploy 1+2 done today, backfill + column drop pending). Arive webhook Critical #1 partial (shadow mode, not enforced). Mediums #5 (field-level encryption), #9 (admin action log), #10 (sys/org admin) open. n8n: 26/29 active, 3 intentionally inactive (CD Extractor, Refi Quarterly Review, Refi Pre-Drop Warm-Up).

---

## 2026-04-12 — Day 18 of 26 (14 days to launch)

**Days to launch:** 14

**Yesterday shipped:**
- `pii`: PII Phase 3 COMPLETE — backfill-activity-pii.ts ran, verify-live-decrypt passed 1402/1402 rows, migration 083 deployed. All 6 plaintext PII columns dropped from `activity_log`. Critical #3 CLOSED.
- `chore`: ANTHROPIC_API_KEY set in Vercel env and redeployed (was never set — PA/CD extraction endpoints were broken at the root).
- `docs`: Junk anthropic_api_key (Ruthie0523!) stripped from `user_settings` table.

**Blockers:**
- GOALS.md #2 (email automation) — `HkLjsnnhT5MgrX5H` (CD & Contract Extractor) still INACTIVE. 3 weeks zero progress. Last major automation piece before launch.
- Set Rate webhook never called — Seq A (Refi Watch) active but idle since inception.
- Adam: Connect Outlook credential → activate Seq C; Post 39 approval due April 15 (3 days); Phase 2 confirmation (blocks Renovation Phase 3+).

**Today's focus:** Activate CD & Contract Extractor (GOALS.md #2) — blocked on Adam connecting Outlook. In parallel: Renovation Phase 3 (Follow-Up List) if Phase 2 confirmation lands. Marketing demo data cleanup has zero progress — blocks May 1 screenshots.

**Risk watch:** 14 days out. Email automation completely unstarted for 3 weeks. Renovation Phases 3–6 not started. Adam manual queue rotating for 7+ sessions (Set Rate, Outlook/Seq C, Phase 2, selfies, Post 39). Marketing site demo data zero progress (blocks public launch page). Timeline is critical — needs Adam to unblock this weekend.

**Open audit findings:** 6 CRITICAL + 2 HIGH open per SECURITY-AUDIT-2026-04-05.md (T-1 activity_log INSERT, T-2 RLS disabled 6 tables, T-3 USING(true) 3 tables, A-1 legacy webhook scaffolded, A-2 daily-briefing first-org, A-3 web-lead system user; T-4/T-5 HIGH milestone + marketing scoping). Tracker: Critical #3 CLOSED today, #2 and #4 done, #1 scaffolded. Mediums #5/9/10 still open.

---

## 2026-04-10

**Days to launch:** 16

**Yesterday shipped:**
- Activity log + notes fully fixed: migration 081 (`contact_activity`) live, duplicate echo entries filtered from system feed
- iMessage integration fixed: n8n workflow `nccX5ml82mMGyE9T` updated to write `contact_id`/`loan_id`/`occurred_at` to columns (was metadata-only); 126 entries backfilled, blue icon + snippet in UI
- `extractPayloadIdentity()` verified done + FRED API confirmed not needed (Seq A uses Set Rate webhook Option A)

**Blockers:**
- **GOALS.md #2 (email automation):** Outlook CD & Contract Extractor (`HkLjsnnhT5MgrX5H`) still INACTIVE with 0 trigger runs — no progress yet
- PII backfill script (`scripts/backfill-activity-pii.ts`) not run — blocks plaintext column drop
- Renovation Phase 2 not Adam-confirmed — blocks Phase 3 (Follow-Up List) start per protocol
- Refi Watch Seq C (`LfLSDgqgb6yCe93C`) built but inactive — needs Adam activation + Outlook credential verify
- Adam: upload selfies — blocks LoanOS social pool (BLOCKER-LOANOS-001)
- Seq D org_id bug (`45a5b7e8-...` should be `18613f82-...`) — flagged in ADAM-TODO, 5-min fix

**Today's focus:**
- Activate Outlook CD & Contract Extractor (`HkLjsnnhT5MgrX5H`) — GOALS.md #2, highest-value unstarted automation
- Fix Seq D org_id bug (lead gen agent task)

**Risk watch:**
- 16 days to April 26. Renovation Phases 3-6 not started; Phase 3 gate requires Adam Phase 2 confirmation. GOALS.md #2 (email automation) has zero progress. Marketing site demo data unstarted — blocks May 1 launch screenshots. Refi Watch Seq C built but not activated. Timeline is tight.

**Open audit findings:**
- SECURITY-AUDIT-2026-04-05.md: 3 CRITICAL (T-1: activity_log INSERT open, T-2: 6 tables RLS disabled, T-3: USING true on challenges/responses/kids) + 2 HIGH (T-4: milestone tables user-scoped, T-5: marketing_activity_log user-scoped) — DB-level, status unclear. CONTEXT.md tracker shows Critical #1-#4 (Arive webhook, rate limiting, PII, admin routes) addressed. 3 medium gaps (#5/#9/#10) confirmed open per TODO.md.

---

## 2026-04-09

**Days to launch:** 17

**Yesterday shipped:**
- Scoped all loans + contacts list/detail queries by `organization_id` (4 fixes) — closes multi-tenancy data-leakage vectors
- Applied migration 075 (`los_integrations`) to live Supabase
- Migration 081 (`contact_activity`) created — notes + activity log now functional (was broken; table never existed despite being referenced in API routes, UI, and types)
- Daily fixer reconciliation: marked 2 ADAM-TODO items completed

**Today shipped:**
- **Activity log fixed** (GOALS.md #1): notes + activity log fully working — migration 081 live, UI rendering correctly
- **iMessage integration fixed** (GOALS.md #4): n8n workflow `nccX5ml82mMGyE9T` updated to write `contact_id`, `loan_id`, `occurred_at` to actual columns (was only writing to metadata JSON). 126 existing entries backfilled. iMessages now appear on contact pages with blue icon + snippet.
- **Duplicate activity entries fixed**: `updateLastTouch()` was creating echo entries in `activity_log` for every manually logged call/email/text. UI now filters out `call_logged`, `email_outbound`, `sms_sent`, `note_added` from system feed.
- **Inbound email rendering**: email.received entries now show From + Subject with green icon in activity feed.
- Vercel: READY (dpl_EMZKkWKXnSjzsPwngYmCSHaygojL). n8n: iMessage workflow active + published.

**Blockers:**
- Adam: fill in `extractPayloadIdentity()` in `verifyLosPayload.ts` (check Zapier run for field name) — blocks LO #2 onboarding
- Adam: verify Microsoft Outlook credential in n8n UI — blocks all Refi Watch sequences
- PII backfill script (`scripts/backfill-activity-pii.ts`) not run — blocks plaintext column drop
- Phase 2 not yet Adam-confirmed — blocks Phase 3 start per renovation protocol

**Today's focus:**
- ~~Notes + activity log fix~~ ✅ DONE
- ~~Text message integration~~ ✅ DONE
- Email automation (GOALS.md Priority #2): CD & Contract Extractor workflow (`HkLjsnnhT5MgrX5H`) is built but INACTIVE — activate and test end-to-end (Outlook inbox → attachment detection → Supabase upload → draft reply)

**Risk watch:**
- 17 days to launch. Renovation Phases 3-6 not started. Phase 3 gate = Adam confirms Phase 2. Marketing site demo data cleanup (separate repo) unstarted — blocks May 1 launch screenshots. 3 Adam-action blockers outstanding (extractPayloadIdentity, Outlook credential, PII backfill).

**Open audit findings:**
- No files in `audits/`. Security tracker: 3 of 12 gaps remain (#5 field-level encryption, #9 admin action log, #10 sys vs org admin).

---

## 2026-04-08

**Days to launch:** 18 (target: 2026-04-26)

**Yesterday shipped:**
- Fixed pre-approval modal to use split borrower name fields (`borrower_first_name` + `borrower_last_name` with fallback chain) — modal was showing "Borrower: –" for newer loans
- MD file audit and cleanup: CONTEXT.md slimmed from 1,780 → 86 lines; new DECISIONS.md + TODO.md created; README trimmed 151 → 54 lines; MAP.md (5,242 lines) deleted

**Blockers:**
- **Adam-required (LO #2 onboarding blocked):** `extractPayloadIdentity()` in `verifyLosPayload.ts` not filled in; migration 075 (`los_integrations`) not applied to Supabase; PII backfill script not run
- **Adam-required (automation):** FRED API key not registered (blocks Refi Watch Sequence A); Outlook credential not connected in n8n (blocks Refi Watch Anniversary Check-In)
- **Email automation (GOALS.md #2):** Outlook CD & Contract Extractor workflow (`HkLjsnnhT5MgrX5H`) exists in n8n but is INACTIVE with 0 trigger runs — needs activation
- Vercel: READY. No deployment failures.
- n8n: No failed/errored active workflows.

**Today's focus:**
- GOALS.md priority #1: Fix notes + activity log (both broken — top priority before anything else)
- Renovation Plan: Phase 3 (Follow-Up List) is next, pending Adam's Phase 2 confirmation

**Risk watch:**
- 18 days to launch. Renovation Phases 3-6 (Follow-Up List, Contacts, Email Templates, Metrics) all incomplete. GOALS.md priorities (notes fix, email automation, text message integration, demo data) also unstarted. Multiple Adam-required items unresolved. **Timeline is tight — needs aggressive daily progress.**

**Open audit findings:**
- No new audit reports (audit-reports/ last entry: 2026-03-24). Security tracker: 3 of 12 gaps remain (#5 field-level encryption, #9 admin action log, #10 sys vs org admin). 9/12 addressed.
