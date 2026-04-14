# NotebookLM Pull Report — 2026-04-14 AM
Active Topic: Lead Flow Audit + Activation / Homepage Form Wiring / Calendly Enhancements

## What We Already Know

**Database:** 2,441 contacts, 854 loans. 77% untagged. 644 past-client records = primary Refi Watch audience.

**Funnels live (code-complete):** Pre-Approval (`/get-preapproved`), Rate Alert (`/rate-alert`), FTB Guide, FTB DPA Guide (`/ftb-dpa-guide`), LO Waitlist (`/loanos-waitlist`). All 5 capture working. Zero nurture sequences active.

**n8n automations live:** Refi Watch Seq A (rate drop alert — idle, Set Rate never called), Seq B (anniversary — idle), Seq D (warm-up — inactive, copy approval pending). Calendly workflow `PBu2Zt0YpiLHeqbL` INACTIVE (Adam must wire Calendly webhook).

**The Nurture Gap** = #1 revenue blocker. Leads captured → no follow-up. 18-email Mailchimp execution pack ready, Adam needs 45 min in UI.

**Homepage forms:** Quick Quote + Quick Contact still Netlify-only. Not wired to subscribe-lead.js, no CRM/Mailchimp entry, no notification to Adam.

**TCPA BLOCKER-001:** Homepage forms lack separate optional SMS checkbox. Risk LOW (no SMS wired). Highest-traffic form (`/get-preapproved`) already fixed.

## Open Questions

1. Has Adam called the Set Rate webhook since last session? (verify via Supabase activity_log)
2. Has Adam activated Calendly workflow `PBu2Zt0YpiLHeqbL`? (verify via n8n MCP)
3. Has Adam built any Mailchimp journeys? (verify via n8n or Mailchimp API)
4. Is Seq C (`LfLSDgqgb6yCe93C`) still inactive? (verify via n8n MCP)

## Prior Decisions

- Set Rate webhook = manual (FRED API killed 2026-04-11, memory confirms)
- Equity alerts deferred — 99.8% of past clients missing AVM data
- Sequence D (warm-up email to 644 past clients) requires Adam copy approval before trigger
- SMS outreach restricted to email only (historical consent unknown for 644 past clients)
- LO Waitlist page: copy approval required before deploy

## Lead Gen Program Priorities

1. **Nurture gap** — Mailchimp journeys (Adam-owned, 45 min)
2. **Homepage form wiring** — agent-executable today
3. **Calendly cancel branch** — agent-executable today
4. **Set Rate + Seq C** — Adam-owned, unresolved 5+ sessions
5. **Contact matching** in Calendly log — agent-executable (Supabase lookup)

## Briefing for Research Subagent

Do NOT re-research:
- Mailchimp journey structure (18-email pack already built)
- TCPA compliance rules (applied to 3 of 5 pages)
- Refi Watch Seq A/B/C/D architecture (built, awaiting activation)
- PA funnel or Rate Alert funnel (live and tested)

Focus new research on:
- Calendly webhook cancel payload format (need for cancel branch in n8n)
- Best practices for homepage "sticky" quote form lead capture (for Quick Quote wiring)
