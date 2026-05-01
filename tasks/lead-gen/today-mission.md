## Mission Brief — 2026-05-01 AM

### Domain
Lead Generation

### Focus Area
On-page conversion audit of `/get-preapproved.html` — the PA funnel landing page. Identify conversion friction (CTA, copy, social proof, trust signals, mobile friction) without depending on GSC data (which is blocked).

### Session Type
[x] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Why This Mission

GOALS.md week priorities for Styer Mortgage Website:
- "**Conversion**: Make the site work harder. CTAs, trust signals, social proof."
- "**SEO fixes**: High impressions, low CTR. Audit and rewrite title tags + meta descriptions on the highest-impression pages first." (page-level on-page SEO is in scope here too)

PA funnel has captured zero submissions since 2026-04-15 lead-intake cutover (8th-day pattern as of 2026-04-29). The 2026-04-28 diagnosis confirmed the code path is clean. The 2026-04-28 ADAM-TODO action item — "ANALYZE traffic + CTR" — is blocked on a fresh GSC export (last on-disk 2026-03-26 predates PA-funnel deploy).

But the page itself can be audited *without* GSC data. Conversion friction lives in the page: form length, CTA clarity, headline strength, trust signals, social proof, mobile responsiveness, pixel-density of decision-friction. That audit produces a directly-actionable fix list Adam can ship the same day.

This is the cleanest autonomous AM mission today — no Adam-blocked carryovers, no email risk, no DB writes, output file Adam can act on cold.

### Objectives
1. Read `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/get-preapproved.html` end-to-end (HTML + inline CSS + form structure).
2. Score the page against a conversion-rate-best-practices checklist: above-the-fold value prop, CTA visibility/clarity, form length, social proof, trust signals (NMLS, BBB, testimonials), TCPA disclosure clarity, mobile-friction (input types, autofill, viewport), page weight, time-to-interactive friction.
3. Produce a prioritized fix list — rank each finding HIGH / MEDIUM / LOW by estimated conversion-lift impact + estimated implementation effort.
4. Cross-reference with the page-level SEO basics: title tag, meta description, H1 structure, schema markup, canonical, internal links — flag any low-hanging-fruit rewrites for the GOALS.md CTR work.
5. Read-only Supabase check: any drip enrollments since 2026-04-30 PM? (1-line answer to confirm Scott Pilot launch hasn't accidentally moved the needle on its own.)

### Definition of Done
- 1 audit file at `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md` — prioritized findings table + before/after rewrite suggestions for at least 3 HIGH-impact items.
- Drip enrollment status confirmed (1 line in session-log).
- ADAM-TODO refresh: surface any HIGH-impact findings that Adam can ship in <30 min (CTA copy, headline, meta description) as agent-actionable next-session items.

### Resources / Files in Scope
- READ: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/get-preapproved.html` (live page source)
- READ: Supabase `drip_sends` + `drip_enrollments` (cron movement check)
- READ: Supabase `contacts` filter `lead_source='Pre-Approval Funnel'` (any new since 2026-04-29 16:30?)
- WRITE: `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md` (NEW)
- TOUCH: `tasks/lead-gen/session-log.md`, `CONTEXT.md` (3-field block), `CHANGELOG.md`, `TODO.md`, `tasks/ADAM-TODO.md`

### HIGH RISK Items
- None. No DB writes. No code commits. No outbound email. Audit file only.
- Audit must distinguish "agent recommendation" from "decided fix" — Adam approves before any styerteam-mortgage-site code changes (separate repo + separate agent).

### Compliance Checklist
- [ ] Page check: NMLS #513013 visible? Equal Housing Lender disclosure visible? TCPA consent language present (per 2026-04-24 iMessage research prereq)?
- [ ] No guaranteed-approval language in page or in any rewrite suggestion.
- [ ] No fair-lending protected-class targeting in copy suggestions.

### Sequence
A (Research only). Reporter runs at end. No Builder, QA, Reviewer needed — output is project-files-only research that goes through Adam approval before any styerteam-mortgage-site code action.
