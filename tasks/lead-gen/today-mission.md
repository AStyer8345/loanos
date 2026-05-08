## Mission Brief — 2026-05-08 AM

### Domain
Lead Generation

### Focus Area
**PR-3 Thank-You Conversion Consolidation — Drop-In Spec.** Completes the consolidation trilogy started 05-06 (PR-1 compliance closeout) and continued 05-07 (PR-2 form-page conversion consolidation). PR-3 bundles the conversion-focused HIGH-tier findings from the 2026-05-05 `/thank-you.html` audit (H2 — rate-alert branch hides Calendly entirely; H3 — FTB-DPA branch wipes phone CTA; H4 — PA branch reassurance copy + 21-day-close microcopy; H5 — dataLayer instrumentation for unknown/missing `?type=` debugging) into one ship-ready PR document with copy-paste-ready diffs. H1 from the thank-you audit (3-step "What Happens Next" Step 3 misleads non-PA branches) is already covered by PR-1 closeout — not duplicated here.

This is the natural sequel per session-log 2026-05-07 forward rule (option a). Held-forward "skip page re-audit until at least one HIGH-tier change ships" is honored — no new audit findings produced, only consolidation. PR-3 is single-file (`thank-you.html` inline-IIFE only, lines 621–720) which makes it the cleanest of the three PRs to ship from a risk standpoint. Builder can ship PR-1 → PR-2 → PR-3 back-to-back when Adam authorizes.

### Session Type
[x] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Objectives
1. Read H2–H5 sections of the 2026-05-05 thank-you-page audit + the actual production HTML at the line numbers cited so the spec carries verbatim current code.
2. Author a single drop-in PR spec at `tasks/lead-gen/specs/2026-05-08-thank-you-conversion-pr-spec.md` containing per-finding diffs (current vs proposed), test plan, risk assessment, sequencing relative to PR-1 closeout + PR-2 form-page.
3. Read-only Supabase pipeline snapshot (7th consecutive baseline expected).
4. Update trackers (CHANGELOG, CONTEXT, ADAM-TODO, TODO, session-log) per scheduled-task SKILL.md rules.

### Definition of Done
- Spec doc exists, mirrors yesterday's PR-2 spec format, and is detailed enough that a Builder subagent (or Adam) could ship without re-reading the source audit.
- Single new ADAM-TODO line collapses 1 prior thank-you audit line (05-05) into a single "ship this PR" ask (file-pointer pattern, no stacking, no re-escalation of prior lines).
- Read-only Supabase pipeline check appended to session log; no DB writes.
- NotebookLM PULL/PUSH skip logged inline (7th calendar day blocked).

### Resources / Files in Scope
- `tasks/lead-gen/research/2026-05-05-thank-you-page-audit.md` (read-only)
- `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md` (read-only, sequencing reference)
- `tasks/lead-gen/specs/2026-05-07-conversion-consolidation-pr-spec.md` (read-only, format template)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/thank-you.html` (read-only)
- `tasks/lead-gen/specs/2026-05-08-thank-you-conversion-pr-spec.md` (NEW — deliverable)

### HIGH RISK Items
- None. Sequence A: read-only research, single output document. Zero code changes, zero commits, zero outbound. Spec authorizes nothing on its own — Adam reviews before any Builder run.
- NotebookLM CLI auth still expired (7th day, 11th sub-session expected). PULL/PUSH SKIPPED at start; will surface inline.
- PR-3 touches the same `thank-you.html` file as PR-1's H1 fix — execution order matters (PR-1 first, then PR-3, OR bundle into one larger PR). Spec must address sequencing explicitly.
