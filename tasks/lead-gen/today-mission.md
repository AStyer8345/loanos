## Mission Brief — 2026-05-10 AM

### Domain
Lead Generation

### Focus Area
**PR-5 Final Light-Pass — All Remaining M-Tier + L-Tier Across 4 Audits — Drop-In Spec.** Closes the entire 4-audit pile. After PR-1 (compliance), PR-2 (conversion), PR-3 (thank-you), PR-4 (cross-page brand+footer), the residual is the M-tier + L-tier polish items the prior 4 PRs explicitly deferred. Bundles all remaining items from `2026-05-01-get-preapproved-conversion-audit.md`, `2026-05-02-rate-alert-conversion-audit.md`, `2026-05-04-homepage-forms-conversion-audit.md`, `2026-05-05-thank-you-page-audit.md` into one ship-ready PR with copy-paste-ready diffs.

This is the natural sequel per session-log 2026-05-09 forward rule (recommended option (a)/(b): PR-5 spec). Held-forward "skip page re-audit until at least one HIGH-tier change ships" honored — no new audit findings produced, only consolidation. Once PR-5 ships, the agent has nothing left to consolidate from the 4-audit pile and must shift to either: (a) `/refinance-quote.html` audit (5/5 funnel coverage), (b) `/austin-mortgage-rates.html` audit (high-traffic SEO landing capture surface), (c) deterministic POST verification probe (Adam-in-the-loop session — DOWNGRADED priority per 05-09 correction), or (d) Architect-mode strategic work on net-new lead-gen channels.

### Session Type
[x] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Objectives
1. Read all 4 audits' M-tier + L-tier sections + the 4 prior PR specs to identify the exhaustive residual list (items not already covered by PR-1 / PR-2 / PR-3 / PR-4).
2. Read the production HTML at cited line numbers so the spec carries verbatim current code.
3. Author a single drop-in PR spec at `tasks/lead-gen/specs/2026-05-10-final-light-pass-pr-spec.md` containing per-finding diffs (current vs proposed), test plan, risk assessment, sequencing relative to PR-1/PR-2/PR-3/PR-4.
4. Read-only Supabase pipeline snapshot (9th consecutive baseline expected).
5. Update trackers (CHANGELOG, CONTEXT, ADAM-TODO, TODO, session-log) per scheduled-task SKILL.md rules.

### Definition of Done
- Spec doc exists, mirrors yesterday's PR-4 spec format, and is detailed enough that a Builder subagent (or Adam) could ship without re-reading the source audits.
- Single new ADAM-TODO line; designed to **collapse** all remaining M+L tier items across the 4 prior audit lines (05-01 / 05-02 / 05-04 / 05-05) into a single ship decision (audit lines stay `[ ]` as references until shipped). PR-1 / PR-2 / PR-3 / PR-4 ADAM-TODO lines unchanged — sequencing PR-1 → PR-2 → PR-3 → PR-4 → PR-5 preserved.
- Read-only Supabase pipeline check appended to session log; no DB writes.
- NotebookLM PULL/PUSH skip logged inline (9th calendar day blocked).

### Resources / Files in Scope
- `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md` (read-only)
- `tasks/lead-gen/research/2026-05-02-rate-alert-conversion-audit.md` (read-only)
- `tasks/lead-gen/research/2026-05-04-homepage-forms-conversion-audit.md` (read-only)
- `tasks/lead-gen/research/2026-05-05-thank-you-page-audit.md` (read-only)
- `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md` (read-only — sequencing reference)
- `tasks/lead-gen/specs/2026-05-07-conversion-consolidation-pr-spec.md` (read-only — sequencing reference)
- `tasks/lead-gen/specs/2026-05-08-thank-you-conversion-pr-spec.md` (read-only — sequencing reference)
- `tasks/lead-gen/specs/2026-05-09-cross-page-brand-footer-pr-spec.md` (read-only — sequencing reference)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/index.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/rate-alert.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/get-preapproved.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/thank-you.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/script.js` (read-only)
- `tasks/lead-gen/specs/2026-05-10-final-light-pass-pr-spec.md` (NEW — deliverable)

### HIGH RISK Items
- None. Sequence A: read-only research, single output document. Zero code changes, zero commits, zero outbound. Spec authorizes nothing on its own — Adam reviews before any Builder run.
- NotebookLM CLI auth still expired (9th day, 15th sub-session expected). PULL/PUSH SKIPPED at start; will surface inline.
- PR-5 will touch overlapping files with PR-1/PR-2/PR-3/PR-4 — spec must address sequencing explicitly: PR-5 designed to apply LAST after the prior 4; rebase-safe in any order via different line ranges.
