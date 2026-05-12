## Mission Brief — 2026-05-12 AM

### Domain
Lead Generation

### Focus Area
**Outbound iMessage comparison brief.** Per yesterday's forward rule option (b) and GOALS.md week-of-Apr-20 priority "Speed to lead — PRIORITY". Decision pending per GOALS line 67: which path — BlueBubbles, Sendblue, AppleScript, n8n integration?

### Session Type
[x] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Objectives
1. Produce a strategic comparison brief at `tasks/lead-gen/research/2026-05-12-imessage-comparison-brief.md` covering all 4 GOALS-listed paths plus a 5th alternative (Twilio + native n8n SMS) — go deeper than 04-24 doc on each.
2. Surface the **5-minute-from-submit SLA feasibility** per option (the actual measurable GOAL.md requirement).
3. Quantify the **TCPA gating chain** — what must ship before any iMessage automation can fire.
4. Deliver a concrete recommendation Adam can pick from in 5 minutes, with no further research needed.

### Definition of Done
- Brief authored, side-by-side option table included.
- 0 new spec lines on top of the existing 5-deep pile (PR-1 through PR-5 still unauthorized).
- ADAM-TODO gets 1 brief-pointer line + the existing NotebookLM CLI line refreshed (in place, not stacked).
- All 4 session files updated (CONTEXT, CHANGELOG, TODO, DECISIONS unchanged unless real decision made).

### Resources / Files in Scope
- READ-ONLY:
  - `tasks/lead-gen/research/2026-04-24-imessage-speed-to-lead.md` (prior brief)
  - `GOALS.md` (week-of-Apr-20)
  - n8n workflow IDs `PiuIsQpBuydtFM4m` (Web Lead Automation) + `J9Pe24vUi6fpZtdZ` (Pre-Approval Lead Notify) + `nccX5ml82mMGyE9T` (iMessage → Supabase Log, inbound only)
  - `ADAM-TODO.md` line `2026-04-24 SENDBLUE SPEED-TO-LEAD` (2 prereqs)
- WRITE:
  - `tasks/lead-gen/research/2026-05-12-imessage-comparison-brief.md` (new)
  - 4 standard session files
  - `tasks/lead-gen/notebooklm-errors.md` (2026-05-12 AM entry)

### HIGH RISK Items
**None — Sequence A research only.** No code changes. No outbound. No funnel modifications. The brief is a decision document; the decision itself is Adam's, gated on:
- TCPA two-checkbox closeout (already covered by PR-1 spec at `tasks/lead-gen/specs/2026-05-06-compliance-closeout-pr-spec.md` — unauthorized)
- Sendblue (or alternative provider) signup + API key delivery

### Forward
Today is the 11th consecutive day blocked on NotebookLM CLI auth. Master `notebooklm-errors.md` will refresh. Steps 3 (PULL) + 8 (PUSH master notebook) skip per error-handling rule.
