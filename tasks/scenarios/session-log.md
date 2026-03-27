# LoanOS Scenarios — Session Log

---

## Initial Setup — 2026-03-25

Agent system initialized. NotebookLM notebook created: a4b23b08-a517-4140-b155-d1188587fb8a

Current state documented in domain-queue.md.
NotebookLM seeded with Mortgage Coach, TCA methodology, and competitor research.

Next session priority: Start with input speed — pre-fill from contact/loan data.

---

## AM Session — 2026-03-25 (scenarios-am)

**What was assessed:**
- Input speed / pre-fill (Tier 1 item 1) already COMPLETE — `page.tsx` had `?loan_id=` pre-fill for both purchase + refi modes, and loan detail page already linked to `/dashboard/scenarios/new?loan_id=${loanId}`. No code needed.

**What was built:**
- Share page redesign (`src/app/share/[token]/page.tsx`)
  - Hero section: borrower first name ("Sarah's Loan Options"), property address, mode badge
  - Hero stat: "Starting At $X/mo" (purchase) or "Save $X/mo" (refi) — derived from real data
  - Summary stat bar: 3 cards — lowest monthly payment, lowest cash to close, lowest 15yr interest (purchase) OR monthly savings, 5yr savings, break-even months (refi)
  - AI narrative rendered as formatted paragraphs — first sentence gold-highlighted as lede
  - CTA block: "Schedule a Call" (Calendly) + "Start Application" buttons + Adam Styer | Mortgage Solutions LP | NMLS #513013
  - Mobile-first layout: max-w-2xl, overflow-x-auto on tables
  - Animated loading spinner
  - Compliance footer preserved

**MC gap closed:** Share link is now presentation-quality. Opens with a name, a number that means something, and a story — not a data table.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `c2fa685` — pushed to main
**Vercel:** `dpl_3ZVB43FLHHJ8gR1ATNeK9FLASXh4` — BUILDING at session close (expected READY)

**Files touched:** `src/app/share/[token]/page.tsx` only — no auth/RLS/multi-tenant changes

**Next session priority (PM or tomorrow AM):**
1. PDF redesign — same gap as share page: functional but not impressive. Borrowers don't share it.
   - Add hero stat to PDF header
   - Brand header: Adam's name, NMLS, logo placeholder
   - Better typography hierarchy in the body
2. AI narrative upgrade — incorporate borrower name + specific numbers more naturally (currently generic 4-paragraph blocks)

**Domain queue updates:**
- Tier 1 item 1 (Input speed) — ✅ ALREADY DONE (pre-existing code)
- Tier 1 item 2 (Share page redesign) — ✅ COMPLETE this session

---

## PM Session — 2026-03-26 (scenarios-am)

**What was built:**
- AI narrative personalization (`src/app/api/scenarios/generate-narrative/route.ts`, `NarrativeSection.tsx`, `ScenarioBuilder.tsx`)
  - Extracts borrower first name from `borrowerName` field (handles "John & Jane Smith" → "John")
  - Added `propertyAddress` to API request body and data context — Claude now knows the specific property
  - Rewrote system prompt: paragraph 1 now opens with first name directly ("Sarah, Option A...")
  - Possessive language throughout: "your monthly payment", "your closing costs", "your break-even"
  - Removed "the borrower" references — narratives now address the borrower as "you"
  - Fixed `dataContext` concatenation bug: purchase/refi blocks now use `+=` to preserve property line above

**MC gap closed:** AI narrative now feels written for this specific borrower. Before: generic "Option A has a lower monthly payment." After: "Sarah, Option A saves you $127/month — your closing costs are recouped by month 18."

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `a4eb87f` — pushed to main
**Vercel:** QUEUED at session close (expected READY)

**Files touched:**
- `src/app/api/scenarios/generate-narrative/route.ts`
- `src/app/dashboard/scenarios/new/NarrativeSection.tsx`
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx`
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. 2-1 buydown scenario type (Tier 2) — show Year 1 / Year 2 / Year 3+ payments vs fixed, break-even on buydown cost
2. Down payment comparison mode (3% / 5% / 10% / 20%) — PMI tier effects, monthly payment delta, cash required
3. AI narrative: if narratives still feel generic in testing, consider adding loan purpose + borrower goal field to the input form

**Domain queue updates:**
- Tier 1 item 4 (AI narrative upgrade) — ✅ COMPLETE this session

---

## AM Session — 2026-03-26 (scenarios-am)

**What was built:**
- PDF redesign (`src/app/api/scenarios/generate-pdf/route.ts`)
  - Replaced title + meta section with `renderHeroTitleBlock()`:
    - Borrower first name headline: "Sarah's Purchase Options" / "Sarah's Refinance Options"
    - Property address as gold uppercase subheader
    - Hero stat right-aligned: "Starting At $X/mo" (purchase) or "You Could Save $X/mo" (refi)
    - "Prepared by [LO] · [Date]" subtext
    - Gold accent divider retained
  - Added `renderSummaryStatCards()` — 3-card bar below hero:
    - Purchase: Lowest Monthly Payment (dark/gold highlight) + Lowest Cash to Close + Lowest Total Interest
    - Refi: Monthly Savings (dark/gold if positive) + 5-Year Savings + Break-Even months
  - Updated `renderNarrativeHTML()` — lede treatment on first paragraph:
    - First paragraph: font-size 12px, font-weight 500, gold left border (3px #C9A84C), padding-left 12px
    - Remaining paragraphs: font-size 11px, color #555, standard line-height

**MC gap closed:** PDF now opens the same way as the share page — borrower name, hero number, summary stats. Before: "Sarah — Purchase Analysis" then immediately a data table. After: "Sarah's Purchase Options" + "$2,450/mo" hero + 3 stat cards before any table.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Files touched:** `src/app/api/scenarios/generate-pdf/route.ts` only — no auth/RLS/multi-tenant changes

**Next session priority:**
1. AI narrative upgrade — personalization pass:
   - Incorporate borrower first name into narrative opening
   - Reference specific numbers from the scenario data (not generic "your monthly payment")
   - Make the 4 paragraphs feel like they were written for this specific borrower
2. 2-1 buydown scenario type (Tier 2) — if narrative upgrade is quick

**Domain queue updates:**
- Tier 1 item 3 (PDF redesign) — ✅ COMPLETE this session

---

---

## AM Session — 2026-03-27 (scenarios-am)

**What was built:**
- Buydown Schedule Display (`src/lib/scenarios/displayData.ts`, `src/app/dashboard/scenarios/new/BuydownSection.tsx`, `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx`)
  - `displayData.ts`: Added `buydownType`, `buydownPayments`, `buydownCost`, `buydownBreakEvenMonth` to `ScenarioDisplayRow`; pass-through from `PurchaseCalculatedResult` in `buildPurchaseDisplayData`; computes break-even month by simulating cumulative savings vs buydown cost month by month
  - `BuydownSection.tsx`: New component — year-by-year P&I grid (each buydown year as gold-highlighted row, final "full rate" row), buydown cost in red, break-even month in green, total 2-yr payment savings; only renders when ≥1 scenario has buydown; compliance footer included
  - `ScenarioBuilder.tsx`: Import + render `BuydownSection` after `BreakEvenTable` in purchase mode results section (conditional on mode === 'purchase')

**MC gap closed:** Borrowers can now see exactly what their payments look like Year 1 / Year 2 / Year 3+ when a seller offers to buy down the rate. Before: buydown was calculated but invisible. After: a dedicated table shows each year's payment, the buydown cost, and the month it pays for itself.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `77b9828` — pushed to main
**Vercel:** `dpl_oeAJMdtBaSq5pS5Yjp7npRqFWwt3` — ✅ READY

**Files touched:**
- `src/lib/scenarios/displayData.ts`
- `src/app/dashboard/scenarios/new/BuydownSection.tsx` (new)
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx`
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Down payment comparison mode (3% / 5% / 10% / 20%) — PMI tier effects, monthly payment delta, cash required side by side
2. Rent vs own mode — monthly rent vs PITI + equity build, 5-year breakeven

**Domain queue updates:**
- Tier 2 item 1 (2-1 buydown display) — ✅ COMPLETE this session

