# Web Research — 2026-04-14 PM: Calendly Post-Booking Automation
Session: Lead Gen PM | Trigger: Calendly webhook workflow built today (n8n PBu2Zt0YpiLHeqbL)

## Sources Researched

### 1. Webhook and Calendly integration | n8n
URL: https://n8n.io/integrations/webhook/and/calendly/
Domain: n8n.io
Summary: n8n native documentation for Calendly webhook trigger node — covers event types (invitee.created, invitee.canceled), webhook subscription creation via Calendly API, and common post-booking workflow patterns. The cancel branch added today in node 9-11 uses `invitee.canceled` event. CRM sync patterns show contact lookup → update/create → tag → notify.
Added to notebook: NO (n8n.io not in authorized domains for lead-gen notebook)

### 2. Calendly integrations | Workflow automation with n8n
URL: https://n8n.io/integrations/calendly/
Domain: n8n.io
Summary: Overview of all Calendly triggers + actions available in n8n. Key finding: the Calendly Trigger node in n8n supports both webhook subscription (preferred) and polling modes. Adam must create webhook subscription in Calendly UI → provide webhook URL from n8n workflow to complete activation.
Added to notebook: NO (n8n.io not in authorized domains)

## Research Notes
- Calendly webhook activation requires Adam to: (1) log into Calendly, (2) go to Integrations → Webhooks, (3) paste the n8n webhook URL for workflow PBu2Zt0YpiLHeqbL, (4) select events: invitee.created + invitee.canceled
- This is a NEEDS ADAM item — cannot be done programmatically
- Once activated, the workflow will auto-create/update LoanOS contacts from every booking
