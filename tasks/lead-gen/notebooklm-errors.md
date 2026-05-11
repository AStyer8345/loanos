# NotebookLM Error Log — Lead Generation

## 2026-05-11 AM Session (Lead Gen AM — Scheduled Task)

| Step | Error | Action |
|---|---|---|
| 1. `notebooklm list --json` | `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` (WebLiteSignIn redirect on accounts.google.com) | SKIP NotebookLM PULL. 10th consecutive day blocked; 17th sub-session blocked since 2026-05-03 PM. Continue session per master-agent.md error-handling rule. Backlog now 9 lead-gen artifacts queued for delayed PUSH (the prior 8 plus today's NULL `lead_source` diagnostic). ADAM-TODO line refreshed in place (count bumped to 10 days / 9 nightly runs / 17 sub-sessions). |

Resolution: Adam runs `/Users/adamstyer/.local/bin/notebooklm login` from any terminal.

## 2026-05-10 PM Session (Nightly NotebookLM Sync — Scheduled Task)

| Step | Error | Action |
|------|-------|--------|
| PUSH+CURATE Step 1 `notebooklm list --json` | `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` (WebLiteSignIn redirect on accounts.google.com) — 9th consecutive nightly block, 16th sub-session blocked since 2026-05-03 PM | SKIPPED — Steps 1–7 all blocked at Step 1 (notebook activate, staleness audit, web sweep, push session files, master log sync, daily digest, signal complete). No notebook contact, no source mutations, no master log appends. Local files unchanged outside trackers. Cron fired ON TIME (22:10 vs 22:00 CDT 05-10 target — normal jitter only). Lead Gen PUSH backlog: 8 lead-gen artifacts (added 05-10 PR-5 spec) + 9 PM-side syncs awaiting recovery night. ADAM-TODO line refreshed in place per stale-flags rule (no fresh entry stacked). |

## 2026-05-10 AM Session

| Step | Error | Action |
|------|-------|--------|
| PULL `notebooklm list --json` | `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` (WebLiteSignIn redirect on accounts.google.com) | SKIPPED — 9th consecutive day blocked, 15th sub-session blocked since 2026-05-03 PM. ADAM-TODO line refreshed in place per stale-flags rule. |

## 2026-05-09 AM Session

| Step | Error | Action |
|------|-------|--------|
| PULL `notebooklm list --json` | `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` (WebLiteSignIn redirect on accounts.google.com) | SKIPPED — 8th consecutive day blocked, 13th sub-session blocked since 2026-05-03 PM. ADAM-TODO line refreshed in place per stale-flags rule. |

## 2026-03-27 AM Session

| URL | Error | Action |
|-----|-------|--------|
| https://www.nationalmortgagenews.com/news/how-ai-is-changing-mortgage-marketing-strategy | RPC ADD_SOURCE failed — paywalled/requires authentication | Skipped. Replaced by MPA article (from-loa-to-ai) which covers same topic without paywall. |


## 2026-04-04 PM — Web Research Failures (Refi Watch topic)

| URL | Error | Action |
|-----|-------|--------|
| https://www.nationalmortgagenews.com/news/trigger-lead-limits-push-lenders-toward-new-marketing | Paywall | Skipped |
| https://www.mpamag.com/us/mortgage-industry/market-updates/refi-surge-in-2026-why-brokers-must-do-frequent-reviews/557376 | Cloudflare block | Added + deleted |
| https://www.mpamag.com/us/mortgage-industry/market-updates/why-credit-monitoring-gives-brokers-an-edge-in-the-next-refinance-boom/549257 | Cloudflare block | Added + deleted |
| https://www.mpamag.com/us/specialty/wholesale/uwms-smith-lower-rates-coming-and-brokers-must-be-ready-to-recapture-customers/570387 | Cloudflare block | Added + deleted |

**Note:** mpamag.com is fully Cloudflare-blocked. nationalmortgagenews.com is paywalled. Do not attempt these domains in future sessions.


## 2026-04-05 PM Session

| URL | Error |
|-----|-------|
| https://www.nationalmortgagenews.com/news/lenders-rethink-outreach-as-trigger-leads-face-limits | Paywall — could not add |
| https://www.nationalmortgagenews.com/news/how-mortgage-brokers-are-tapping-ai-to-problem-solve | Paywall — could not add |
| https://www.nationalmortgagenews.com/opinion/why-buying-leads-is-killing-your-mortgage-business | Paywall — could not add |

*Note: All 3 NMN URLs summarized in 2026-04-05-pm-web-research.md which WAS added to NotebookLM.*

## 2026-04-07 PM Session

### Failed URL Adds (paywalled)
- https://www.nationalmortgagenews.com/news/mortgage-customer-retention-tools-proliferate-amid-refi-boomlet
- https://www.nationalmortgagenews.com/news/lenders-predict-2026-rebound-led-by-refis-and-home-equity
Reason: National Mortgage News content behind paywall. Use Scotsman Guide or CFPB as alternatives.

## 2026-05-03 PM — Auth Expired

[2026-05-03 22:09 PM] AUTH EXPIRED: All notebooklm CLI commands returning `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` Cannot run interactively from scheduled task — Adam must run `notebooklm login` manually. PUSH+CURATE skipped this session (no notebook contact possible). Daily digest not generated. Foundational doc refresh deferred to next successful session.


---

## 2026-05-04 AM — Auth Still Expired (2nd consecutive session)

[2026-05-04 03:48 AM] Same `Authentication expired or invalid` failure on `notebooklm list --json`. Skipped both PULL (Step 3 of master-agent.md) and PUSH (Step 8). Continued session per master-agent.md error-handling rule "NotebookLM sync failure NEVER blocks the build chain." Today's session output (`2026-05-04-homepage-forms-conversion-audit.md`) is queued for delayed PUSH whenever Adam runs `/Users/adamstyer/.local/bin/notebooklm login`.

ACTION: Adam must run `/Users/adamstyer/.local/bin/notebooklm login` from a terminal to restore CLI auth. This blocks both Lead Gen + SEO/SEM nightly notebook syncs. Already tracked under SEO/SEM agent's Active blockers in CONTEXT.md.

---

## 2026-05-05 AM — Auth Still Expired (3rd consecutive AM session)

[2026-05-05 10:17 CDT] Same `Authentication expired or invalid` failure on `notebooklm list --json` — error message includes redirect to `accounts.google.com/v3/signin/identifier`. Skipped both PULL (Step 3 of master-agent.md) and PUSH (Step 8). Continued session per master-agent.md error-handling rule "NotebookLM sync failure NEVER blocks the build chain." Today's session output (`2026-05-05-thank-you-page-audit.md`) is queued for delayed PUSH alongside the prior 2 backlogged sessions whenever Adam runs `/Users/adamstyer/.local/bin/notebooklm login`.

Backlog now: 3 lead-gen audit files + 2 PM-side syncs awaiting PUSH whenever auth restored. ADAM-TODO entry already exists from 2026-05-04 AM — not re-stacking.

---

## 2026-05-05 PM-cron-late — Auth Still Expired (3rd consecutive nightly run, 5th overall block)

[2026-05-05 11:03 CDT, target 22:00 CDT 05-04] Nightly cron fired ~13h late (same pattern as styer-social-am earlier today at 10:10 CDT vs target 02:00). Same `Authentication expired or invalid` failure on `notebooklm list --json`. PUSH+CURATE Step 1 blocked → Steps 2–7 all skipped. No notebook contact, no source mutations, no master log appends, no digest. Local files unchanged outside trackers. Ledger of blocked runs since 2026-05-03: PM 05-03 nightly (SEO/SEM + Lead Gen), AM 05-04 lead-gen-am, AM 05-05 lead-gen-am, PM 05-05 nightly (this run, SEO/SEM + Lead Gen). ADAM-TODO line already filed (2026-05-04 AM) — bumping count there rather than restacking a fresh entry.

---

## 2026-05-05 PM-cron-on-time — Auth Still Expired (4th consecutive nightly run)

[2026-05-05 22:10 CDT, target 22:00 CDT 05-05] Nightly cron fired ON TIME (no late-fire pattern this run). Same `Authentication expired or invalid` failure on `notebooklm list --json` with WebLiteSignIn redirect. PUSH+CURATE Step 1 blocked → Steps 2–7 all skipped. No notebook contact, no source mutations, no master log appends, no digest. Local files unchanged outside trackers. Updated ledger of blocked runs since 2026-05-03: PM 05-03 nightly (SEO/SEM + Lead Gen), AM 05-04 lead-gen-am, AM 05-05 lead-gen-am, PM 05-04 nightly (fired 13h late at 11:03 CDT 05-05), PM 05-05 nightly on-time (this run, SEO/SEM + Lead Gen). Lead Gen PUSH backlog now: 3 audit files (2026-05-02 rate-alert, 2026-05-04 homepage forms, 2026-05-05 thank-you page) + 4 PM-side syncs awaiting auth restore. ADAM-TODO line 18 already filed — bumping count there rather than restacking a fresh entry.

---

## 2026-05-06 AM — Auth Still Expired (5th calendar day, 8th sub-session blocked)

[2026-05-06 03:55 CDT] Same `Authentication expired or invalid` failure on `notebooklm list --json` with WebLiteSignIn redirect to `accounts.google.com/v3/signin/identifier?...flowName=WebLiteSignIn`. Skipped both PULL (Step 3 of master-agent.md) and PUSH (Step 8). Continued session per master-agent.md error-handling rule "NotebookLM sync failure NEVER blocks the build chain." Today's session output (`tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md`) added to PUSH backlog. Lead Gen PUSH backlog now: **4 artifacts** (2026-05-02 rate-alert audit, 2026-05-04 homepage forms audit, 2026-05-05 thank-you page audit, 2026-05-06 closeout PR spec) + 4 PM-side syncs awaiting auth restore. Updated ledger of blocked sub-sessions since 2026-05-03: 8 total — PM 05-03 nightly (SEO/SEM + Lead Gen), AM 05-04 lead-gen-am, PM 05-04 nightly (fired 13h late), AM 05-05 lead-gen-am, PM 05-05 nightly on-time (SEO/SEM + Lead Gen), AM 05-06 lead-gen-am (this run). ADAM-TODO line 18 already filed — count refreshed in place per stale-flags rule, NOT re-stacked.

ACTION: Adam must run `/Users/adamstyer/.local/bin/notebooklm login` from a terminal to restore CLI auth. Each additional 24h of delay = ~2 more outdated NotebookLM sources the recovery night's staleness audit must purge. Recovery night will need to push the 4-deep Lead Gen backlog plus the parallel SEO/SEM backlog (notebook last refreshed 2026-05-01 → ~10 stale + ~6 ready-to-add accumulated by now; 50-source cap will force heavy churn).

---

## 2026-05-06 PM-cron-on-time — Auth Still Expired (5th consecutive nightly block)

[2026-05-06 22:10 PM-cron-on-time] Same `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` error on `notebooklm list --json`. WebLiteSignIn redirect on accounts.google.com. 4th wall-clock day blocked, 5th nightly run blocked, 8th Lead Gen sub-session blocked since 05-03 PM (counting AM lead-gen-am pulls 05-04 / 05-05 / 05-06). Cron fired ON TIME tonight (22:10 vs 22:00 target). PUSH+CURATE Step 1 blocked → Steps 2–7 all skipped. Lead Gen PUSH backlog: 4 audit/spec artifacts (2026-05-02 rate-alert, 2026-05-04 homepage forms, 2026-05-05 thank-you, 2026-05-06 closeout-PR spec) + 5 PM-side syncs awaiting recovery. Local files unchanged outside trackers. ACTION: Adam must run `/Users/adamstyer/.local/bin/notebooklm login` from a terminal.

---

## 2026-05-07 AM — Auth Still Expired (6th calendar day, 9th sub-session blocked)

[2026-05-07 03:46 CDT] Same `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` error on `notebooklm list --json` with WebLiteSignIn redirect (`accounts.google.com/v3/signin/identifier?...flowName=WebLiteSignIn`). Skipped both PULL (Step 3 of master-agent.md) and PUSH (Step 8). Continued session per error-handling rule "NotebookLM sync failure NEVER blocks the build chain." Today's session output (`tasks/lead-gen/specs/2026-05-07-conversion-consolidation-pr-spec.md`) added to PUSH backlog.

Lead Gen PUSH backlog now: **5 artifacts** (2026-05-02 rate-alert audit, 2026-05-04 homepage forms audit, 2026-05-05 thank-you page audit, 2026-05-06 closeout PR spec, 2026-05-07 conversion consolidation PR spec) + 5 PM-side syncs awaiting auth restore. Updated ledger of blocked sub-sessions since 2026-05-03: **9 total** — PM 05-03 nightly, AM 05-04 lead-gen-am, PM 05-04 nightly (13h-late fire), AM 05-05 lead-gen-am, PM 05-05 nightly on-time, AM 05-06 lead-gen-am, PM 05-06 nightly on-time, AM 05-07 lead-gen-am (this run). ADAM-TODO line already filed — count refreshed in place per stale-flags rule, NOT re-stacked.

ACTION: Adam must run `/Users/adamstyer/.local/bin/notebooklm login` from a terminal to restore CLI auth. Each additional 24h of delay = ~2 more outdated NotebookLM sources the recovery night's staleness audit must purge. Recovery night will need to push the 5-deep Lead Gen backlog plus the parallel SEO/SEM backlog (notebook last refreshed 2026-05-01 → ~12 stale + ~7 ready-to-add accumulated by now; 50-source cap will force heavy churn).

---

## 2026-05-07 PM-cron-on-time — Auth Still Expired (6th consecutive nightly block, 10th sub-session)

[2026-05-07 22:09 PM-cron-on-time] Same `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` error on `notebooklm list --json` with WebLiteSignIn redirect. Cron fired ON TIME tonight (22:09 vs 22:00 target — normal jitter). 6th wall-clock day blocked, 6th nightly run blocked, 10th Lead Gen sub-session blocked since 05-03 PM (counting AM lead-gen-am pulls 05-04 / 05-05 / 05-06 / 05-07 plus the dual nightly runs). PUSH+CURATE Step 1 blocked → Steps 2–7 all skipped. No notebook contact, no source mutations, no master log appends, no digest. Lead Gen PUSH backlog: 5 audit/spec artifacts (2026-05-02 rate-alert, 2026-05-04 homepage forms, 2026-05-05 thank-you, 2026-05-06 closeout-PR spec, 2026-05-07 conversion-consolidation PR spec) + 6 PM-side syncs awaiting recovery. Local files unchanged outside trackers. ADAM-TODO line refreshed in place (not re-stacked) per stale-flags rule. ACTION: Adam must run `/Users/adamstyer/.local/bin/notebooklm login` from a terminal.

---

## 2026-05-08 AM — Auth Still Expired (7th calendar day, 11th sub-session blocked)

[2026-05-08 03:51 CDT] Same `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` error on `notebooklm list --json` with WebLiteSignIn redirect (`accounts.google.com/v3/signin/identifier?...flowName=WebLiteSignIn`). Skipped both PULL (Step 3 of master-agent.md) and PUSH (Step 8). Continued session per error-handling rule "NotebookLM sync failure NEVER blocks the build chain." Today's session output (`tasks/lead-gen/specs/2026-05-08-thank-you-conversion-pr-spec.md`) added to PUSH backlog.

Lead Gen PUSH backlog now: **6 artifacts** (2026-05-02 rate-alert audit, 2026-05-04 homepage forms audit, 2026-05-05 thank-you page audit, 2026-05-06 closeout PR spec, 2026-05-07 conversion-consolidation PR spec, 2026-05-08 thank-you-conversion PR spec) + 6 PM-side syncs awaiting auth restore. Updated ledger of blocked Lead Gen sub-sessions since 2026-05-03: **11 total** — PM 05-03 nightly, AM 05-04 lead-gen-am, PM 05-04 nightly (13h-late fire), AM 05-05 lead-gen-am, PM 05-05 nightly on-time, AM 05-06 lead-gen-am, PM 05-06 nightly on-time, AM 05-07 lead-gen-am, PM 05-07 nightly on-time, AM 05-08 lead-gen-am (this run). ADAM-TODO line already filed — count refreshed in place per stale-flags rule, NOT re-stacked.

ACTION: Adam must run `/Users/adamstyer/.local/bin/notebooklm login` from a terminal to restore CLI auth. Each additional 24h of delay = ~2 more outdated NotebookLM sources the recovery night's staleness audit must purge. Recovery night will need to push the 6-deep Lead Gen backlog plus the parallel SEO/SEM backlog (notebook last refreshed 2026-05-01 → ~14 stale + ~8 ready-to-add accumulated by now; 50-source cap will force heavy churn).

---

## 2026-05-08 PM-cron-on-time — Auth Still Expired (7th consecutive nightly block, 12th Lead Gen sub-session)

[2026-05-08 22:09 PM-cron-on-time] Same `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` error on `notebooklm list --json` with WebLiteSignIn redirect. Cron fired ON TIME tonight (22:09 vs 22:00 target — normal jitter). 7th wall-clock day blocked, 7th nightly run blocked, 12th Lead Gen sub-session blocked since 05-03 PM (counting AM lead-gen-am pulls 05-04 / 05-05 / 05-06 / 05-07 / 05-08 plus the dual nightly runs). PUSH+CURATE Step 1 blocked → Steps 2–7 all skipped. No notebook contact, no source mutations, no master log appends, no digest. Lead Gen PUSH backlog: 6 audit/spec artifacts (2026-05-02 rate-alert, 2026-05-04 homepage forms, 2026-05-05 thank-you, 2026-05-06 closeout-PR spec, 2026-05-07 conversion-PR spec, 2026-05-08 thank-you-conversion-PR spec) + 7 PM-side syncs awaiting recovery. Local files unchanged outside trackers. ADAM-TODO line refreshed in place (not re-stacked) per stale-flags rule. ACTION: Adam must run `/Users/adamstyer/.local/bin/notebooklm login` from a terminal.

[2026-05-09 22:00 PM-cron-on-time] AUTH EXPIRED (8th consecutive nightly): `notebooklm list --json` → `Authentication expired or invalid. Run 'notebooklm login' to re-authenticate.` PUSH+CURATE Steps 1–7 all blocked at Step 1. ADAM ACTION: run `notebooklm login` from a terminal.
