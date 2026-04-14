# NotebookLM Pull Report — 2026-04-10 AM
Active Topic: Refi Watch Funnel — Sequence C (90-Day Rate Review)

## What We Already Know
- **Database:** 2,441 contacts, 817 loans, 644 with a closing date (Refi Watch audience)
- **Funnels live:** Pre-Approval, Rate Alert, FTB Guide, FTB DPA Guide — all built and deployed
- **Refi Watch infrastructure complete (4 workflows):**
  - Set Rate webhook (`3iXImUkjgMitpJKt`) — INACTIVE
  - Sequence A — Rate Drop Alert (`iyKFy0ODkyyqQaAS`) — INACTIVE (Outlook + Set Rate needed)
  - Sequence B — Anniversary Check-In (`ZUeGy8u8P4o6DPM3`) — INACTIVE (Outlook needed)
  - Sequence D — Pre-Drop Warm-Up (`W0K4YDzkZd0Hzv6g`) — INACTIVE (Adam approval needed)
- **Nurture gap:** Mailchimp Customer Journeys still not created (PA Welcome, Rate Watch, DPA Guide)
- **LO Waitlist:** Built and committed but NOT deployed to Netlify

## Open Questions
- Has Adam connected the Outlook credential in n8n? (blocks A, B, D)
- Has Adam activated Set Rate webhook and called it with current rate?
- Has Adam approved Sequence D copy? (irreversible blast to 644 clients)
- What exactly is Sequence C (90-Day Rate Review) — no formal spec exists yet

## Prior Decisions
- Rate source: Option A (manual Set Rate webhook) — FRED API not needed for initial launch
- Email platform for Refi Watch: n8n → Outlook (not Mailchimp) — personal feel, small volume
- Sequence C (Equity Milestones) deferred — requires AVM API not yet acquired
- CONTEXT.md references "Sequence C (90-Day Rate Review)" as distinct from Equity Milestones

## Lead Gen Program Priorities
1. Refi Watch activation — blocked on Adam (Outlook credential + Set Rate call)
2. Sequence C (90-Day Rate Review) — no spec yet, this AM's build target
3. Mailchimp Customer Journeys — Adam action, step-by-step guide already written
4. LO Waitlist deploy — Adam: git push + n8n activation
5. Homepage form wiring — BLOCKER-001, low risk (no SMS wired yet)

## Briefing for Research Subagent
DO NOT re-research: rate sources (FRED vs manual decided), email platform (Outlook decided), TCPA/CAN-SPAM (patterns established), Refi Watch architecture (all 4 sequences built)

Focus new research here instead:
- What is the ideal 90-day rate review email cadence for past mortgage clients?
- What triggers should fire Sequence C vs Sequence A? (C fires when rate drop NOT triggered)
- What data points make a compelling "90-day review" email for a client at 6.75%+ rate?
