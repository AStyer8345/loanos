## Scenarios Mission Brief — 2026-03-25 AM

### Focus Area
Share page redesign — make it presentation-quality, borrower-facing, mobile-first

### Why This Matters
The share page is the only thing a borrower ever sees. Right now it opens with a data table.
Mortgage Coach opens with an emotional hero — borrower name, key takeaway stat, a story.
A borrower who opens a LoanOS share link on their phone currently sees a raw comparison table.
A borrower who opens a MC link feels like they're being coached, not invoiced.
This is the highest-leverage visual change: same data, completely different experience.

Note: Input speed (Tier 1 item 1) is ALREADY DONE — `page.tsx` pre-fills from `?loan_id=`
and the loan detail page already links to `/dashboard/scenarios/new?loan_id=${loanId}`.
Moving to Tier 1 item 2: Share page redesign.

### Session Type
[x] Build

### Objectives
1. Add a hero section with borrower name, property address, and the single most important number (top monthly payment or savings)
2. Render the AI narrative with proper typography — formatted paragraphs, not a bare div
3. Add an Adam Styer CTA block at the bottom: "Questions? Schedule a call" → Calendly link
4. Make the layout mobile-first: readable on a phone without horizontal scroll
5. Add a visual "summary stat" bar above the table — the one number that tells the story

### Files in Scope
ONLY these files may be touched:
- `src/app/share/[token]/page.tsx` — complete share page redesign

Everything else is off limits.

### Definition of Done
- [ ] `npm run build` passes (no TypeScript errors)
- [ ] Share page has: hero section, formatted narrative, CTA block, mobile-friendly layout
- [ ] Summary stat bar shows the top takeaway number
- [ ] Design matches LoanOS system: IBM Plex Mono, gold #C9A84C, dark #0a0a0a backgrounds
- [ ] Mobile layout readable at 390px width (iPhone 15 standard)
- [ ] Compliance footer preserved
- [ ] No changes to auth, RLS, or multi-tenant code

### Subagents to Activate
Note: Only 00-notebooklm.md subagent exists. Builder/QA/Reporter running inline this session.
[x] Builder (inline)
[x] QA (npm run build)
[x] Reporter (session-log.md update)
