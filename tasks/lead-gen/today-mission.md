## Mission Brief — 2026-03-29 AM

### Domain
Lead Generation

### Focus Area
Week 3 — Rate Alert Funnel Builder (Sequence C)

### Session Type
- [ ] Research + Planning (Sequence A)
- [ ] Strategy / Architecture (Sequence B)
- [x] Execute / Build (Sequence C)
- [ ] Full Cycle (Sequence D)

### Objectives
1. Build `rate-alert.html` — 2-field opt-in landing page ("Austin Rate Watch") per spec
2. Modify `thank-you.html` — add `?type=rate-alert` conditional copy block
3. Add secondary CTA banner to `austin-mortgage-rates.html` — Rate Alert sign-up prompt
4. Quality review all 3 files (score ≥7/10, rewrite if below)
5. Compliance + spec review (Reviewer subagent)
6. QA verification (all checks pass)

### Definition of Done
- rate-alert.html exists in site repo, passes all QA checks
- thank-you.html renders Rate Alert-specific copy when ?type=rate-alert param is present
- austin-mortgage-rates.html has CTA block pointing to rate-alert.html
- Reviewer APPROVED (or APPROVED WITH NOTES, non-blocking)
- QA PASS (or PASS WITH CAVEATS with documented non-blocking issues)
- Session log updated
- NotebookLM push complete

### Resources / Files in Scope
- tasks/lead-gen/specs/2026-03-28-rate-alert-funnel-spec.md (EXECUTE THIS)
- /Users/adamstyer/Documents/Claude/styerteam-mortgage-site/rate-alert.html (CREATE)
- /Users/adamstyer/Documents/Claude/styerteam-mortgage-site/thank-you.html (MODIFY)
- /Users/adamstyer/Documents/Claude/styerteam-mortgage-site/austin-mortgage-rates.html (MODIFY)
- /Users/adamstyer/Documents/Claude/styerteam-mortgage-site/netlify/functions/subscribe-lead.js (READ ONLY — no changes)

### HIGH RISK Items
- **Do NOT modify subscribe-lead.js** — spec confirms zero backend changes needed
- **Do NOT wire SMS opt-in** — Rate Alert is email-only; adding phone field or SMS checkbox would violate the spec and require TCPA review
- **Do NOT touch existing working funnels** (FTB Guide, get-preapproved.html, prequal.html) — those are separate
- Ensure NMLS #513013 and Equal Housing Lender disclosure appear on rate-alert.html
- No guaranteed approval language or rate quotes without APR disclosure
