## Mission Brief — 2026-04-14 AM

### Domain
Lead Generation

### Focus Area
Agent-executable builds: Homepage form wiring + Calendly enhancements

### Session Type
[x] Execute / Build (Sequence C)

### Background
All 5 Adam-owned blockers confirmed still unresolved (2026-04-14 03:00 AM check):
- Set Rate: 0 refi_rate_update entries (6th consecutive session)
- Seq C `LfLSDgqgb6yCe93C`: INACTIVE — Outlook cred not connected
- Calendly workflow `PBu2Zt0YpiLHeqbL`: INACTIVE — Adam hasn't configured Calendly webhook
- Mailchimp journeys: not created in UI
- DPA Guide PDF: not hosted

Pivoting to agent-executable builder work per session-log next-session instructions.

### Objectives
1. Wire styermortgage.com Quick Quote + Quick Contact homepage forms to subscribe-lead.js (CRM + Mailchimp)
2. Add invitee.canceled branch to Calendly workflow `PBu2Zt0YpiLHeqbL` (cancel log + optional re-book recovery email)
3. Add Supabase contact lookup to Calendly workflow so booking logs link to real contact_id

### Definition of Done
- Quick Quote form: submission hits subscribe-lead.js, logs to Mailchimp (tag: quick-quote-lead), logs to LoanOS activity_log
- Quick Contact form: submission hits subscribe-lead.js, logs to Mailchimp (tag: quick-contact-lead), logs to LoanOS activity_log
- Calendly workflow `PBu2Zt0YpiLHeqbL`: updated with cancel branch (log cancellation action) and contact lookup node (match on email)
- Build reports written for each artifact
- All compliance checks pass (NMLS #513013, Equal Housing Lender, no protected class targeting)

### Resources / Files in Scope
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/index.html` — homepage
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/script.js` — form handlers
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/netlify/functions/subscribe-lead.js` — Netlify function
- n8n workflow `PBu2Zt0YpiLHeqbL` — Post-Calendly Booking Automation
- Supabase project `uuqedsvjlkeszrbwzizl` — activity_log + contacts table

### HIGH RISK Items
- Homepage form wiring touches live site (styermortgage.com) — must not break existing Netlify form submissions
- Calendly workflow update is INACTIVE — safe to modify (zero live traffic)
- No SMS triggers anywhere in scope — TCPA risk = LOW
- subscribe-lead.js already handles tag-based routing — new tags (quick-quote-lead, quick-contact-lead) won't conflict
