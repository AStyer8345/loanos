## Mission Brief — 2026-05-07 AM

### Domain
Lead Generation

### Focus Area
**PR-2 Conversion Consolidation — Drop-In Spec.** Continue the consolidation arc from yesterday. Closeout PR (2026-05-06) bundled compliance H1 across 4 audits. PR-2 bundles the conversion-focused HIGH-tier findings (H2–H5) from the 3 form-page audits — `/get-preapproved.html`, `/rate-alert.html`, `index.html` (homepage Quick Quote + Quick Contact) — into one ship-ready PR document with copy-paste-ready diffs. Thank-you-page H2–H5 (different file, different concerns) stays separate as future PR-3. M+L tier items stay deferred to PR-4+.

The held-forward rule "skip page re-audit until at least one HIGH-tier change ships" is honored — this session does NOT produce new audit findings. It consolidates existing findings into a more shippable form. Per session-log 05-06 forward rule option (d), PR-2 spec was conditioned on "once compliance closeout ships." That condition is relaxed today: the 1-day age of the closeout spec + 6-day NotebookLM auth lockout + 5-baseline pipeline freeze make a parallel-track second consolidation the highest-leverage Sequence A move available — Builder can ship PR-1 then PR-2 back-to-back when Adam authorizes.

### Session Type
[x] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Objectives
1. Read H2–H5 sections of the 3 form-page audits (05-01 get-preapproved, 05-02 rate-alert, 05-04 homepage forms) + the actual production HTML at the line numbers cited so the spec carries verbatim current code.
2. Author a single drop-in PR spec at `tasks/lead-gen/specs/2026-05-07-conversion-consolidation-pr-spec.md` containing per-finding diffs (current vs proposed), test plan, risk assessment, sequencing relative to PR-1 closeout.
3. Read-only Supabase pipeline snapshot (6th consecutive baseline expected).
4. Update trackers (CHANGELOG, CONTEXT, ADAM-TODO, TODO, session-log) per scheduled-task SKILL.md rules.

### Definition of Done
- Spec doc exists, mirrors yesterday's closeout-spec format, and is detailed enough that a Builder subagent (or Adam) could ship without re-reading the 3 source audits.
- Single new ADAM-TODO line collapses 3 prior audit conversion-finding lines (05-01, 05-02, 05-04) into one "ship this PR" ask (file-pointer pattern, no stacking, no re-escalation of prior lines).
- Read-only Supabase pipeline check appended to session log; no DB writes.
- NotebookLM PULL/PUSH skip logged inline (6th calendar day blocked).

### Resources / Files in Scope
- `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md` (read-only)
- `tasks/lead-gen/research/2026-05-02-rate-alert-conversion-audit.md` (read-only)
- `tasks/lead-gen/research/2026-05-04-homepage-forms-conversion-audit.md` (read-only)
- `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md` (read-only, sequencing reference)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/index.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/get-preapproved.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/rate-alert.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/script.js` (read-only)
- `tasks/lead-gen/specs/2026-05-07-conversion-consolidation-pr-spec.md` (NEW — deliverable)

### HIGH RISK Items
- None. Sequence A: read-only research, single output document. Zero code changes, zero commits, zero outbound. Spec authorizes nothing on its own — Adam reviews before any Builder run.
- NotebookLM CLI auth still expired (6th day, 9th sub-session). PULL/PUSH SKIPPED at start; will surface inline.
- Loan Goal taxonomy unification (homepage H4 + get-preapproved M6 cross-page bundle): explicitly listed as "out of scope" in 2026-05-06 closeout spec § 7. Today's PR-2 spec follows the same out-of-scope decision — taxonomy unification is a separate ~25-min PR because it touches LoanOS dashboard segmentation downstream.
