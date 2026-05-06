## Mission Brief — 2026-05-06 AM

### Domain
Lead Generation

### Focus Area
**Compliance Closeout PR — Drop-In Spec.** Consolidate the H1 finding from each of the 4 funnel-page audits (2026-05-01 get-preapproved, 2026-05-02 rate-alert, 2026-05-04 homepage forms, 2026-05-05 thank-you) into a single ship-ready PR document with copy-paste-ready code. Highest leverage move available without Adam's input — converts 4 unactioned audits + 20 HIGH-tier findings into a single 1-PR / ~30-min ship that closes 4 of 5 series compliance FAILs and fully resolves BLOCKER-001.

### Session Type
[x] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Objectives
1. Read H1 sections of all 4 funnel-page audits + actual production HTML/JS in styerteam-mortgage-site to extract current code at the line numbers cited.
2. Author a single drop-in PR spec at `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md` containing per-file diffs (current vs proposed), test plan, compliance impact, risk assessment.
3. Update trackers (CHANGELOG, CONTEXT, ADAM-TODO, TODO, session-log) per scheduled-task SKILL.md rules.

### Definition of Done
- Spec doc exists and is detailed enough that a Builder subagent (or Adam himself) could ship the PR in one focused session without re-reading the 4 source audits.
- Net-new ADAM-TODO line collapses the 4 prior audit lines into one "ship this PR" ask (file-pointer pattern, no stacking).
- Read-only Supabase pipeline check confirms no movement since 05-05 baseline (drip_sends=0, PA Funnel=0).

### Resources / Files in Scope
- `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md` (read-only)
- `tasks/lead-gen/research/2026-05-02-rate-alert-conversion-audit.md` (read-only)
- `tasks/lead-gen/research/2026-05-04-homepage-forms-conversion-audit.md` (read-only)
- `tasks/lead-gen/research/2026-05-05-thank-you-page-audit.md` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/index.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/get-preapproved.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/rate-alert.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/thank-you.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/script.js` (read-only)
- `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md` (NEW — deliverable)

### HIGH RISK Items
- None. Sequence A: read-only research, single output document. Zero code changes, zero commits, zero outbound. Spec authorizes nothing on its own — Adam reviews before any Builder run touches styerteam-mortgage-site.
- NotebookLM CLI auth still expired (5th day, 8th sub-session). PULL/PUSH SKIPPED at start; will surface inline.
