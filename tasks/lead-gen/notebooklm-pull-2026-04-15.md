# NotebookLM Pull Report — 2026-04-15 AM
Active Topic: Lead Flow Audit + Activation / Blocker Verification / Lead Scoring Design

**Note: NotebookLM CLI unavailable (command not found). Using session-log + live MCP verification as context source.**

## What We Already Know

**Database:** 2,441 contacts, 854 loans. 644 past-client records = primary Refi Watch audience.

**Funnels live (code-complete):** Pre-Approval, Rate Alert, FTB Guide, FTB DPA Guide, LO Waitlist.
All 5 capture working. Zero Mailchimp nurture sequences active (Adam-owned, 45 min in UI).

**n8n automations (verified live 2026-04-15 03:00 AM via MCP):**
- Seq A `iyKFy0ODkyyqQaAS`: ACTIVE. Runs daily 7 AM CT. Set Rate = **6.37%** (called 2026-04-14 18:09 UTC — FIRST EVER). Threshold = 6.00%. Seq A will NOT send alerts until market rate ≤ 6.00%. Currently running + exiting cleanly. Candidate segment: loans with interest_rate ≥ 6.75%.
- Seq B (anniversary): ACTIVE. Idle — no anniversary events logged.
- Seq C `LfLSDgqgb6yCe93C` (quarterly rate review): INACTIVE. Outlook cred not connected.
- Seq D `W0K4YDzkZd0Hzv6g` (warm-up to 644 contacts): INACTIVE. Adam copy approval required.
- Calendly `PBu2Zt0YpiLHeqbL`: INACTIVE (triggerCount: 0). Adam must wire Calendly webhook.
- Set Rate `3iXImUkjgMitpJKt`: ACTIVE. triggerCount: 1. **Rate set 2026-04-14 at 6.37%.**

**Homepage forms (verified 2026-04-15):**
- Quick Quote (`hero-quick-form`): calls subscribe-lead.js ✅ (commit 1bb1ef1 live)
- Quick Contact (`quick-contact-form`): calls subscribe-lead.js ✅ (commit 1bb1ef1 live)
- LOANOS_URL env var: confirmed set (process.env.LOANOS_URL) ✅
- contact_created entry in activity_log today (02:45 UTC) confirms endpoint live ✅

**The Nurture Gap** = #1 revenue blocker. Leads captured → no follow-up. 18-email Mailchimp execution pack ready since 2026-04-12. Adam needs 45 min in UI.

## Open Questions

1. What is Adam's current rate expectation for Seq A threshold — is 6.00% still the right trigger?
2. When will Seq C Outlook credential be connected? (Blocked 5+ sessions)
3. Mailchimp journeys — has Adam started building them? (No evidence)
4. Lead scoring — what data model should scores live in (contacts table vs. computed from activity_log)?

## Prior Decisions

- Set Rate webhook = manual (FRED API killed 2026-04-11)
- Seq A threshold = 6.00% (hardcoded in Parse Rate + Check Threshold Code node)
- Seq A candidate segment = loans with interest_rate ≥ 6.75%
- Equity alerts deferred — 99.8% of past clients missing AVM data
- Sequence D requires Adam copy approval — irreversible (644 contacts)
- SMS restricted to email-only for all existing automations

## Lead Gen Program Priorities

1. **Nurture gap** — Mailchimp journeys (Adam-owned, 45 min)
2. **Seq C activation** — Outlook credential (Adam-owned)
3. **Seq D warm-up** — copy approval (Adam-owned, irreversible)
4. **Lead scoring design** — agent-executable today (spec + data model)
5. **Calendly HMAC security** — agent-executable (needs signing key from Adam first)

## Briefing for Research Subagent

Do NOT re-research:
- Mailchimp journey structure (18-email pack built 2026-04-12)
- TCPA/CAN-SPAM rules (applied to all active funnels)
- Refi Watch architecture (all 4 sequences built, 2 active)
- Homepage form wiring (deployed commit 1bb1ef1)
- Set Rate webhook (now functional — 6.37% set)

Focus new research on:
- Lead scoring models for mortgage lead qualification (what signals matter most)
- Industry benchmarks: PA form vs Calendly booking conversion-to-close rates
- Calendly webhook signing key verification (HMAC-SHA256 pattern for n8n)
