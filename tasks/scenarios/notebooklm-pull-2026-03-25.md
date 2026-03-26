# NotebookLM Pull Report — 2026-03-25 AM
Active Topic: Input Speed / Pre-fill from Contact/Loan Data

## What We Already Know
- LoanOS Scenarios supports up to 3 purchase scenarios side-by-side with break-even table, key metrics, reinvestment analysis, refi mode, PDF generation, AI narrative, charts, share page, MISMO/statement upload, and Supabase saving
- UX research confirms: limit comparisons to 5 or fewer items; use sticky column headers; allow users to highlight differences or hide identical rows; mobile tables should convert to tabs/lists
- Recharts is the charting library in use for composable, reusable visual components
- Compliance rule in place: never recommend a product or imply approval — trade-offs only

## Mortgage Coach Gaps (Still Open)
- MC creates Homeowner Strategies in under 60 seconds on mobile — LoanOS requires manual data entry for every field
- MC has proactive "Coaching Opportunities" — identifies borrowers to contact before they apply
- MC has borrower-facing AI chat that explains scenarios 24/7
- MC has aspirational visual output — borrowers feel something, not just see data
- MC share links are impressive enough that borrowers forward them
- MC has enterprise usage insights dashboard with leaderboards

## Prior Session Summary
- **Session 1 (2026-03-25 Initial Setup)**: Agent system initialized. NotebookLM seeded. domain-queue.md created with full improvement roadmap. No code changes were made.
- **Deferred**: Everything — no builds have run yet for the Scenarios improvement program.
- **Directed to start with**: Input speed / pre-fill from contact/loan data (Tier 1, domain-queue.md)

## Priority Improvements (from domain-queue.md, Tier 1)
1. **Input speed** — Pre-fill loan amount, rate, term from active contact/loan record ← THIS SESSION
2. **Share page redesign** — Presentation-quality, borrower-facing, mobile-first
3. **PDF redesign** — Branded, visual, something a borrower would actually read
4. **AI narrative upgrade** — More personalized, incorporate borrower name + specific numbers naturally

## Briefing for Builder
Do NOT re-research:
- Basic comparison table UX (sticky headers, limit options, hide identical rows) — already documented
- Recharts usage patterns — already implemented in ScenarioCharts.tsx
- Compliance rules — established, never recommend products

Focus new work here:
- **Pre-fill mechanism**: How does the current ScenarioBuilder.tsx accept initial data? Is there a URL param or props-based approach?
- **Contact/loan data availability**: What fields exist in contacts and loans tables that are useful for scenario pre-fill (loan_amount, purchase_price, interest_rate, loan_term, etc.)?
- **Smart defaults**: What are reasonable rate/term defaults for Texas in 2026 if no loan record exists?
- **Speed of entry**: How many clicks/fields does it currently take to build one scenario from scratch?
