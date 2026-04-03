# LoanOS Scenarios — Improvement Queue

---

## WHY THIS EXISTS

Adam consistently returns to Mortgage Coach instead of LoanOS Scenarios.
Goal: make LoanOS Scenarios so good that MC is never opened again.

MC's advantages to close:
- Presentation-quality output (borrower-facing, not just data)
- Visual storytelling (charts that explain the "why" not just the numbers)
- Shareable link borrowers actually read
- Fast input — seconds, not minutes
- Total Cost Analysis — the full lifetime picture
- Emotional narrative — makes the borrower feel something

---

## CURRENT STATE (as of 2026-03-25)

WHAT EXISTS:
- Purchase mode: up to 3 scenarios side by side, break-even table, key metrics, reinvestment analysis
- Refi mode: current loan vs new scenarios, monthly savings, break-even month, cash-out
- PDF generation (puppeteer-based)
- AI narrative: 4 paragraphs, plain text, compliance-safe
- Charts (ScenarioCharts.tsx)
- Share page (/share/[token])
- MISMO upload + statement upload
- Scenario saving to Supabase

KNOWN GAPS (start here):
- [x] Input is too slow — COMPLETE: `?loan_id=` pre-fill + loan detail link existed pre-agent
- [x] Share page was bare — COMPLETE 2026-03-25 AM: hero, summary stats, narrative, CTA
- [ ] PDF looks functional, not impressive — borrowers don't share it
- [ ] AI narrative is generic — doesn't feel personalized
- [ ] No 2-1 buydown scenario type
- [ ] No ARM vs fixed comparison
- [ ] No rent vs own mode
- [x] Down payment comparison mode — COMPLETE 2026-03-28 AM
- [ ] Share page is bare — borrowers land on data, not a story
- [ ] No mobile-optimized view
- [ ] Charts don't communicate urgency or emotion
- [ ] No "total cost of waiting" calculator
- [ ] Scenarios can't be sent via email directly from the builder

---

## IMPROVEMENT QUEUE (priority order)

### Tier 1 — Highest impact, fix first
- ~~**Input speed**: Pre-fill loan amount, rate, term from active contact/loan record~~ ✅ DONE (pre-existing)
- ~~**Share page redesign**: Make it presentation-quality (borrower-facing, not LO-facing)~~ ✅ DONE 2026-03-25 AM
- ~~**PDF redesign**: Branded, visual, something a borrower would actually read~~ ✅ DONE 2026-03-26 AM
- ~~**AI narrative upgrade**: More personalized, incorporate borrower name + specific numbers more naturally~~ ✅ DONE 2026-03-26 PM

### Tier 2 — New scenario types
- ~~**2-1 buydown**: Show Year 1, Year 2, Year 3+ payments vs fixed rate~~ ✅ DONE 2026-03-27 AM
- ~~**Down payment comparison**: Same loan at 3% / 5% / 10% / 20% down — PMI tier effects~~ ✅ DONE 2026-03-28 AM
- ~~**Rent vs own**: Monthly rent vs PITI + equity build, 5-year breakeven~~ ✅ DONE 2026-03-29 AM

### Tier 3 — Workflow integration
- ~~**Email from builder**: Send scenario link directly to borrower from the scenarios tab~~ ✅ DONE 2026-03-30 AM
- ~~**ARM vs fixed**: 5/1 ARM initial savings vs long-term risk~~ ✅ DONE 2026-04-02 AM
- **Total cost of waiting**: What does waiting 6 months cost at today's rates?

---

## QUEUE RULES

- Never touch auth, RLS, or multi-tenant logic — those are Enterprise domain
- Every build change requires: TypeScript compiles + `npm run build` passes
- Design changes must match LoanOS design system (IBM Plex Mono, gold #C9A84C, dark bg)
- Compliance rule: never recommend a loan product or imply approval — present trade-offs only
- Mobile-first for the share page (borrowers read on phones)
