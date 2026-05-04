## Mission Brief — 2026-05-04 AM

### Domain
Lead Generation

### Focus Area
On-page conversion + TCPA compliance audit of `index.html` homepage forms (Quick Quote + Quick Contact). Third in the funnel-page audit series after `/get-preapproved.html` (2026-05-01) and `/rate-alert.html` (2026-05-02). Specifically targets BLOCKER-001's open piece — homepage forms still bundled-consent per 2026-03-25 audit.

### Session Type
[X] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Objectives
1. Read full HTML/CSS/JS source of `index.html` and identify the Quick Quote + Quick Contact forms (and any other lead-capture forms on the homepage). Audit each against the same conversion-rate + compliance checklist used on `/get-preapproved.html` and `/rate-alert.html`.
2. **Compliance priority:** Verify TCPA consent pattern on each homepage form. BLOCKER-001 says these forms still bundle SMS consent into a single required checkbox. If still bundled, file the highest-tier finding (compliance + conversion overlap, same as H1 on rate-alert).
3. Identify which JS handler each homepage form posts to (`subscribe-lead.js` / `lead-intake.js` / inline). Verify `lead_source` propagation so submissions show up in LoanOS contact records under a meaningful source.
4. Confirm post-launch pipeline state with one read-only Supabase pass: `drip_sends`, `drip_enrollments`, `contacts.lead_source` distribution last 7 days. Compare to 2026-05-02 snapshot.
5. Cross-page bundling: identify which homepage findings can ship as part of cross-page PRs already proposed (footer address, OG image, JSON-LD schema, NMLS/EHL footer).
6. Append a single batched ADAM-TODO line pointing to the audit file (file-pointer pattern, no per-finding stacking).

### Definition of Done
- `tasks/lead-gen/research/2026-05-04-homepage-forms-conversion-audit.md` written (~250–330 lines, prioritized findings + before/after rewrites for HIGH items).
- Each homepage form classified: form name, fields, required-checkbox structure, submit handler, lead_source value, current TCPA posture.
- Pipeline state verified: any change vs 2026-05-02 explicitly noted (zero or non-zero).
- Session-log + CHANGELOG + CONTEXT.md (3 Lead Gen fields only) + ADAM-TODO + TODO updated.
- Zero code changes, zero deploys, zero email/SMS fired.
- NotebookLM PUSH attempted; if CLI auth still expired (per 2026-05-03 PM), skip and log to `tasks/lead-gen/notebooklm-errors.md`.

### Resources / Files in Scope
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/index.html` (read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/lead-intake.js` (handler reference, read-only)
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/netlify/functions/subscribe-lead.js` (handler reference, read-only)
- Prior audits: `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md`, `tasks/lead-gen/research/2026-05-02-rate-alert-conversion-audit.md`
- Voice guide: `tasks/social-media/adam-voice-and-workflow.md`
- Supabase MCP read-only: `drip_sends`, `drip_enrollments`, `contacts`

### HIGH RISK Items
None. Read-only research. No funnel mutation, no email/SMS fired, no code changed, no deploy.

### Compliance Checks (audit-time only)
- TCPA bundled-consent — homepage forms are the explicit BLOCKER-001 carryover. If a single required checkbox covers phone + email + SMS, file at HIGH tier.
- CAN-SPAM — unsubscribe link + physical address in footer.
- NMLS #513013 + Equal Housing Lender disclosures present.
- No "guaranteed approval" or protected-class targeting language.
- Lead source — every homepage form must propagate a meaningful `lead_source` to `/api/contacts/web-lead` so AEO/SEO/funnel attribution holds.

### Notes / Constraints
- GOALS.md `mtime` = 2026-04-19 13:51 (15 days stale — should have refreshed today, Mon 2026-05-04). Continue per Week of Apr 20 directive: "No new content on any site (improve existing only)" — audit is improvement work, not new content.
- NotebookLM CLI auth was expired as of 2026-05-03 PM. Operate assuming PUSH will be skipped; log fresh failure if it persists.
- Per scheduled-task SKILL.md: no emails to Adam. All reporting goes into project files only.
- Session-log instruction "Skip page re-audit until at least one HIGH-tier change ships" means do NOT re-audit `/get-preapproved.html` or `/rate-alert.html` — both already audited, no fixes shipped yet.
