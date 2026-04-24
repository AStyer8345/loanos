## Mission Brief — 2026-04-24 AM

### Domain
Lead Generation

### Focus Area
1. Drip CAN-SPAM compliance — unsubscribe endpoint (carry-forward from Apr 23 drip build)
2. Speed-to-lead research — outbound iMessage options (GOALS.md priority)

### Session Type
[x] Execute / Build (Sequence C) — unsubscribe endpoint
[x] Research + Planning (Sequence A) — iMessage

### Context
Previous session (Apr 23 AM) shipped drip cron infrastructure. Three items deferred:
1. Unsubscribe endpoint missing — drip emails link to `/unsubscribe?c={id}` but page doesn't exist
2. referred_by merge tag resolves to empty string in Ghost Referral emails
3. Long-Term Nurture / Past Client Retention require date-field triggers (separate scheduler)

GOALS.md priority this week: speed-to-lead iMessage when form submitted.

### Objectives
1. ✅ Build `/unsubscribe` page — sets email_opt_out=true, shows CAN-SPAM-compliant confirmation
2. ✅ Research outbound iMessage options — spec Sendblue vs BlueBubbles vs Twilio

### Definition of Done
- Unsubscribe page: renders for valid contact_id, sets email_opt_out=true, handles invalid/missing id. Build green. Deployed.
- iMessage research: written to tasks/lead-gen/research/2026-04-24-imessage-speed-to-lead.md with recommendation + ADAM action items.

### Resources / Files in Scope
- `src/app/unsubscribe/page.tsx` (NEW)
- `tasks/lead-gen/research/2026-04-24-imessage-speed-to-lead.md` (NEW)

### HIGH RISK Items
- Unsubscribe page uses service client (bypasses RLS) — intentional for public unsubscribe. No auth token required. UUID is the identifier. Acceptable for this use case.
- iMessage: TCPA consent language MUST be added to all forms before any text sends activate. Do not build Sendblue integration until forms are updated.

---

<!-- Previous mission archived below -->

## Mission Brief — 2026-04-23 AM
(archived — drip cron build complete)
