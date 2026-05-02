## Mission Brief — 2026-05-02 AM

### Domain
Lead Generation

### Focus Area
On-page conversion audit of `/rate-alert.html` (companion to the 2026-05-01 audit of `/get-preapproved.html`)

### Session Type
[X] Research + Planning (Sequence A)
[ ] Strategy / Architecture (Sequence B)
[ ] Execute / Build (Sequence C)
[ ] Full Cycle (Sequence D)

### Objectives
1. Read full HTML/CSS/JS source of `/rate-alert.html` and audit against the same conversion-rate + compliance checklist used yesterday on `/get-preapproved.html`. Produce HIGH/MEDIUM/LOW prioritized findings with effort estimates.
2. Note overlap with yesterday's get-preapproved findings (same fixes that bundle vs same intent that diverges per page intent — preapproval = transactional, rate-alert = subscription).
3. Confirm post-launch (May 1) pipeline state with one read-only Supabase pass: `drip_sends`, `drip_enrollments`, `contacts.lead_source` distribution last 7 days. Compare to 2026-05-01 snapshot to detect any May 1 launch-day movement.
4. Append a single batched ADAM-TODO line pointing to the audit file (no per-finding stacking).

### Definition of Done
- `tasks/lead-gen/research/2026-05-02-rate-alert-conversion-audit.md` written (~250–350 lines, prioritized findings table + before/after rewrites for each HIGH-impact item).
- Pipeline state verified: any change vs 2026-05-01 explicitly noted (zero or non-zero).
- Session-log + CHANGELOG + CONTEXT.md (3 fields only) + ADAM-TODO updated.
- Master + lead-gen NotebookLM notes pushed.
- Zero code changes, zero deploys, zero email/SMS fired.

### Resources / Files in Scope
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/rate-alert.html` (read-only)
- Prior audit reference: `tasks/lead-gen/research/2026-05-01-get-preapproved-conversion-audit.md`
- Voice guide reference: `tasks/social-media/adam-voice-and-workflow.md`
- Supabase MCP read-only: `drip_sends`, `drip_enrollments`, `contacts`

### HIGH RISK Items
None. Read-only research. No funnel mutation, no email/SMS fired, no code changed, no deploy.

### Compliance Checks (audit-time only)
- TCPA bundled-consent — Rate Alert is a recurring-message funnel by design (weekly rate texts/emails); SMS opt-in must be separate + unchecked + unambiguous. Compliance posture is more sensitive here than on PA funnel because the explicit use case IS recurring marketing messages.
- CAN-SPAM — unsubscribe link + physical address in footer.
- NMLS #513013 + Equal Housing Lender disclosures present.
- No "guaranteed approval" or protected-class targeting language.
