# NotebookLM Pull Report — 2026-04-08 AM
Active Topic: Refi Watch Builder — Sequence B (Anniversary) unblocked build

## What We Already Know

**Last session (April 7 AM):** Research session — FRED API confirmed as rate source recommendation, step-by-step Mailchimp Journey guide written, 3 ADAM-TODO items added.

**Last session (April 6 AM):** LO Waitlist Capture Funnel built — `loanos-waitlist.html`, `subscribe-lo.js`, n8n workflow Rn6rtlKeoQ0CrUkb, thank-you.html update. Committed (commit 300c019) but not deployed (pending Adam copy review).

**Infrastructure baseline:** 4 borrower funnels live. LO Waitlist built, not deployed. Core lead routing works (web form → Netlify → Mailchimp + LoanOS + n8n notify).

**Audience:** 644 past clients (Refi Watch target). 2,441 total contacts. 77% untagged.

## Active Blockers (from NotebookLM)

1. **FRED API key registration** — Adam must register + add `FRED_API_KEY` to n8n env. Blocks Sequence A (Rate Drop Alert) only.
2. **Email copy approval** — Sequences A and D need Adam approval before any live send (D = irreversible blast to 644).
3. **Spread threshold confirmation** — 0.75% recommended (market ≤6.00% vs borrower ≥6.75%).

## What's Unblocked Today

- **Sequence B (Anniversary Check-In):** No rate source or copy approval dependency. Build today.
- **Refi Watch Set Rate webhook:** Simple storage workflow — Adam uses to set current rate before Sequence A activates. Unblocked.
- **Homepage form wiring:** Quick Quote + Quick Contact → subscribe-lead.js. Unblocked (lower priority this session).

## Prior Decisions

- Rate source: FRED API (free, automated, Freddie Mac MORTGAGE30US, weekly Thursday)
- Email platform: n8n → Outlook (not Mailchimp) — personal feel, past client audience
- Launch order: B first → D second → A last
- Sequence D: Manual trigger only, Adam must initiate after copy approval
- All workflows: Build INACTIVE, Adam activates
