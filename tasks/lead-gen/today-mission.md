## Mission Brief — 2026-03-30 AM

### Domain
Lead Generation

### Focus Area
Week 3 — Post-Deploy QA: Rate Alert Funnel + PA Funnel Live Verification

### Session Type
[x] Execute / Build (Sequence C) — QA-only sub-session

BLOCKER-003 resolved — both funnels deployed 2026-03-29 (commit 1b3f0be, Adam Styer, 10:00 AM CT). Running post-deploy live verification for both code-complete funnels. This is the final gate before declaring Week 3 complete.

### Objectives
1. Verify rate-alert.html form submission end-to-end: Supabase contact created + Mailchimp tag=rate-alert applied + PA notify workflow did NOT fire
2. Verify get-preapproved.html end-to-end: Supabase contact with lead_source="Pre-Approval Funnel" + n8n J9Pe24vUi6fpZtdZ fires + Outlook notification sent
3. Verify thank-you.html query param branching in production (?type=rate-alert shows rate alert copy, not PA copy)
4. Verify austin-mortgage-rates.html CTA section is live and links to /rate-alert
5. Update BLOCKERS.md: close BLOCKER-003 if live QA passes; open BLOCKER-004 if any live test fails
6. Determine Week 4 focus (FTB Guide enhancement vs Homepage Form Wiring)

### Definition of Done
- Post-deploy QA report written to: tasks/lead-gen/qa-reports/2026-03-30-post-deploy-qa.md
- BLOCKERS.md updated
- Session log updated with pass/fail results
- NotebookLM PUSH complete

### Resources / Files in Scope
- tasks/lead-gen/qa-reports/2026-03-29-rate-alert-funnel-qa.md
- tasks/lead-gen/qa-reports/2026-03-28-pre-approval-funnel-qa.md
- styermortgage.com/rate-alert (live post-deploy)
- styermortgage.com/get-preapproved (live post-deploy)
- styermortgage.com/austin-mortgage-rates (live)
- styermortgage.com/thank-you (live)
- n8n workflow J9Pe24vUi6fpZtdZ (LoanOS — Pre-Approval Lead Notify)
- Supabase contacts table (project: uuqedsvjlkeszrbwzizl)

### HIGH RISK Items
- Test submissions WILL create real contacts in Supabase — use "QA-TEST" / test+leadqa@thestyerteam.com
- n8n PA notify MUST NOT fire for rate-alert submissions — regression gate, stop immediately if it fires
- Do NOT use real borrower email for test submissions
- Do NOT activate Mailchimp sequences until Adam confirms sequences are built in UI

---

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
