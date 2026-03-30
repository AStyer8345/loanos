# NotebookLM Pull Report — 2026-03-30 AM
Active Topic: Email from Builder (Tier 3 item 1)

## What We Already Know

- Tier 1 (Share page, PDF, AI narrative) — all complete
- Tier 2 (2-1 buydown, down payment comparison, rent vs own) — all complete
- Architecture uses n8n `N8N_OUTLOOK_DRAFT_WEBHOOK_URL` for email dispatch (creates Outlook drafts)
- Scenarios table has: `share_token`, `borrower_name`, `property_address` — no borrower_email column
- Existing `ActionsBar.tsx` has save/PDF/copy-link buttons — email button goes here
- Automations system already has proven `POST /api/automations/send` → n8n webhook pattern

## Mortgage Coach Gaps (still open)

- Email from builder: MC lets LOs send presentation link with one click from the tool
- Engagement tracking: MC shows when borrower views the presentation
- Mobile-optimized view: 70%+ of borrowers open on phone
- ARM vs Fixed comparison (Tier 3)
- Total cost of waiting calculator (Tier 3)
- Interactive AI chat for borrowers (longer term)

## Prior Session Summary

- March 29: Rent vs Own mode built — break-even year, monthly comparison, 5/10/15-yr wealth snapshot
- All Tier 1 + Tier 2 items complete as of March 29

## Priority Improvements

1. **Email from Builder** — top Tier 3 priority, directly closes MC advantage
2. ARM vs Fixed — useful for rate shoppers
3. Total cost of waiting — urgency tool for fence-sitters

## Briefing for Builder

Do NOT re-research:
- Share page layout (done)
- PDF structure (done)
- AI narrative (done)
- Buydown / down payment / rent vs own displays (done)

Focus new work:
- Email button in ActionsBar.tsx
- POST /api/scenarios/send-email route
- Use existing n8n webhook pattern (N8N_OUTLOOK_DRAFT_WEBHOOK_URL) — no new packages
- Borrower email is Adam-entered (no lookup needed for v1)
- Creates Outlook draft in Adam's inbox — he reviews and sends
