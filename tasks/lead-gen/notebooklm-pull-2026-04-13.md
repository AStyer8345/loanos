# NotebookLM Pull Report — 2026-04-13 AM
Active Topic: Lead Flow Audit + Activation → Weekly Rate Email + Post-Booking Automation

## What We Already Know

**Infrastructure:** All 5 Refi Watch workflows exist. Set Rate ✅ ACTIVE (never called). Seq A ✅ ACTIVE (idle — no rate in activity_log). Seq B ✅ ACTIVE (first run May 1). Seq C ⏳ INACTIVE (Outlook cred). Seq D ⏳ INACTIVE (org_id fixed, copy approval pending).

**Nurture Gap:** The highest-priority revenue blocker. All 3 Mailchimp Customer Journeys are unbuilt. 18 emails and a step-by-step guide exist in the execution pack (2026-04-12). Every lead captured since funnel launch has received zero automated follow-up.

**Funnels Live:** 4 (Pre-Approval, Rate Alert, FTB Guide, FTB DPA). All capture is working. Nurture is 0%.

**Database:** 2,441 contacts. 644 past clients (refi target). 77% untagged. Web leads: 7–8 total (very low — funnels only recently fixed).

**Weekly Rate Email:** Not built. No template file exists. Mailchimp requires Adam to create the recurring campaign manually, but the HTML template can be prepared for him to paste.

**Calendly/Post-Booking Workflow:** No n8n workflow for post-booking automation exists. Zero search results in n8n for "Calendly", "booking", or "appointment."

## Open Questions

- Is there a Calendly webhook available? (Calendly has webhook support — need to confirm endpoint)
- Should post-booking workflow send confirmation + reminder only, or also include post-call follow-up?
- Weekly rate email: does this go to ALL rate-alert tagged subscribers or a broader list?

## Prior Decisions

- Rate source = Set Rate webhook (manual POST by Adam), not FRED API (killed 2026-04-11)
- All lead routing → LoanOS (Supabase), not Salesforce
- Mailchimp journeys cannot be created via API — require Adam in Mailchimp UI
- CAN-SPAM: all emails include physical address (5900 Balcones Drive, Suite 100, Austin TX 78731), NMLS #513013, Equal Housing Lender
- No guaranteed approval language anywhere

## Lead Gen Program Priorities (from notebook)

1. Nurture Gap — Mailchimp Customer Journeys (Adam-owned — execution pack ready)
2. Set Rate webhook — post current rate ($6.39) to activate Seq A (Adam-owned)
3. Seq C activation — Outlook credential (Adam-owned)
4. Seq D trigger — copy approval + manual execute (Adam-owned)
5. **Weekly rate email template** — can build today (HTML for Mailchimp)
6. **Post-Calendly workflow** — can build today (n8n automation)
7. Homepage form wiring — Quick Quote + Quick Contact forms (BLOCKER-001 partial)

## Briefing for Research Subagent

Do NOT re-research: funnel architecture (done), TCPA compliance (audited), n8n Refi Watch builds (complete), Mailchimp journey email copy (complete in execution pack), FRED API (dead).

Focus new research on:
- Calendly webhook documentation — what payload does Calendly send on `invitee.created`?
- Best-practice post-booking sequence timing (confirm → reminder 24hr before → post-call follow-up 1hr after)
- Weekly mortgage rate email format benchmarks — what makes these perform well?
