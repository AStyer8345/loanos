## Mission Brief — 2026-05-13 AM

### Domain
Lead Generation

### Focus Area
**`/refinance-quote.html` funnel-page audit.** Last unconsolidated primary funnel surface. Per 2026-05-12 AM forward rule recommended option (a). Brings funnel-audit coverage to 5/5 (get-preapproved + rate-alert + homepage + thank-you + refinance-quote). Produces a strategic-input research artifact rather than another spec on top of the 5-deep PR pile (PR-1 through PR-5, all unauthorized 7 / 6 / 5 / 4 / 3 days respectively).

### Session Type
[x] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Objectives
1. Authored audit at `tasks/lead-gen/audits/2026-05-13-refinance-quote-funnel-audit.md` covering: TCPA two-checkbox compliance, brand consistency (vs PR-1/PR-4 surviving thestyerteam.com refs), footer address parity, JSON-LD presence (MortgageBroker + Service + LocalBusiness), meta description + OG image fallback, microcopy + trust signals, GA4 conversion hooks, lead_source taxonomy + Quick Quote/Quick Contact handler vs `/api/contacts/web-lead` upstream wiring, form-field set vs the rest of the funnel, mobile order, NMLS #513013 + Equal Housing Lender disclosure.
2. Identify HIGH/MEDIUM/LOW findings; map any HIGH-tier overlaps with PR-1 / PR-2 / PR-3 / PR-4 / PR-5 so Builder knows what's already covered when those ship.
3. Surface zero new ADAM-TODO `[ ]` lines beyond the audit pointer (file-pointer pattern, same as 05-12 brief).
4. Re-baseline Supabase pipeline counters only if a new lead_source channel breaks the 11-baseline zero-streak; otherwise skip per yesterday's noise-floor logic.

### Definition of Done
- Audit authored at the specified path.
- 1 NEW ADAM-TODO line (audit pointer). PR-1 / PR-2 / PR-3 / PR-4 / PR-5 ADAM-TODO lines unchanged. NotebookLM CLI re-auth line refreshed in place (not stacked).
- All 4 standard session files updated (CONTEXT.md 3 fields, CHANGELOG.md prepended dated entry, TODO.md, DECISIONS.md unchanged unless real decision made).
- `tasks/lead-gen/notebooklm-errors.md` 2026-05-13 AM entry.

### Resources / Files in Scope
- READ-ONLY:
  - `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/refinance-quote.html`
  - `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/script.js` (Quick Quote / Quick Contact handler clusters)
  - `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/netlify/functions/subscribe-lead.js` + `lead-intake.js`
  - 4 prior audits: get-preapproved (05-01) + rate-alert (05-02) + homepage forms (05-04) + thank-you (05-05)
  - 5 prior PR specs: PR-1 closeout (05-06) + PR-2 conversion (05-07) + PR-3 thank-you (05-08) + PR-4 cross-page brand-footer (05-09) + PR-5 final light-pass (05-10)
  - `GOALS.md` (week-of-Apr-20)
- WRITE:
  - `tasks/lead-gen/audits/2026-05-13-refinance-quote-funnel-audit.md` (NEW)
  - 4 standard session files
  - `tasks/lead-gen/notebooklm-errors.md` (2026-05-13 AM entry)

### HIGH RISK Items
**None — Sequence A research only.** No code changes. No outbound. No funnel modifications. No DB writes (read-only Supabase only if needed for taxonomy verification). Audit findings are advisory; PR authoring is held until at least one of PR-1..PR-5 ships (per the standing forward-rule).

### Forward
Today is the 12th consecutive day blocked on NotebookLM CLI auth. `notebooklm-errors.md` will refresh; ADAM-TODO line refreshed in place per stale-flags rule (no fresh entry stacked). Steps 3 (PULL) + 8 (PUSH master notebook) skip per error-handling rule. Audit-series queue: this audit closes 5/5 coverage on primary funnel pages; queue then naturally drains until Adam authorizes a PR or refreshes GOALS.md.
