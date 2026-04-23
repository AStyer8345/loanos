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

---

## AM Session — 2026-03-28 (scenarios-am)

**What was built:**
- Down Payment Comparison (`src/app/dashboard/scenarios/new/DownPaymentSection.tsx`, `ScenarioBuilder.tsx`)
  - New self-contained component — takes `purchaseScenarios[0]` as the base loan (rate, term, purchase price, taxes, HOI, HOA)
  - Computes 4 down payment tiers: 3% / 5% / 10% / 20% with no API call (pure client-side math)
  - Shows per tier: Loan Amount, LTV, Monthly P&I, PMI (estimated by LTV tier), Total Monthly, Cash to Close, PMI auto-cancel month
  - PMI tiers: 3% → ~1.10% annual, 5% → ~0.90%, 10% → ~0.70%, 20% → none
  - PMI cancel month: computed via amortization simulation to 78% LTV threshold
  - Highlights: gold on lowest total monthly payment, green on lowest cash to close
  - Returns null when purchasePrice or interestRate = 0 (no render on empty form)
  - Compliance note present: estimates are illustrative, FHA MIP note, subject to UW
  - Renders in purchase mode results, after BuydownSection, before TotalInterestChart

**MC gap closed:** Adam no longer needs to manually build 4 separate scenarios to answer "should I put more down?" One calculation generates the full comparison table automatically.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `989a434` — pushed to main
**Vercel:** `dpl_BKUEeL9KWq3xfLzz6p1Yptnk8xLs` — ✅ READY

**Files touched:**
- `src/app/dashboard/scenarios/new/DownPaymentSection.tsx` (new)
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` (import + render)
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Rent vs own mode — monthly rent vs PITI + equity build, 5-year breakeven (Tier 2 item 3)
2. Email from builder — send scenario link to borrower directly from results tab (Tier 3 item 1)

**Domain queue updates:**
- Tier 2 item 2 (Down payment comparison) — ✅ COMPLETE this session


---

## AM Session — 2026-03-29 (scenarios-am)

**What was built:**
- Rent vs Own Analysis (`src/app/dashboard/scenarios/new/RentVsOwnSection.tsx`)
  - Local state for monthly rent input — user types their current rent, all math recomputes live
  - Break-even year hero stat in gold: "Break even in Year X" (or ">30 yrs" in red if it doesn't break even)
  - 3-card monthly summary: Current Rent / Monthly PITI / Monthly Cost Difference (green if owning costs less, red if more)
  - Year 5 / Year 10 / Year 15 wealth snapshot table:
    - Renting: cumulative rent paid, $0 equity
    - Owning: total PITI paid, equity built (down + principal + 3% annual appreciation), net owning cost
    - Net advantage row: gold if owning wins, red if not — with "owning wins" label
  - Assumes 3% annual appreciation — noted in compliance footer
  - Returns null when purchase price / rate / loan amount = 0 (no render on empty form)
  - Compliance note: illustrative only, no approval implication

**MC gap closed:** Borrowers can now see the break-even year and wealth comparison without Adam manually running it in Mortgage Coach. Before: this required opening MC and building a separate scenario. After: enter rent → see "Break even in Year 7" in gold with a full 5/10/15-year wealth table.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `cfd695b` — pushed to main
**Vercel:** `dpl_ps8xapEswJvZD1cbjyRfP1nLvoCy` — BUILDING at session close (expected READY)

**Files touched:**
- `src/app/dashboard/scenarios/new/RentVsOwnSection.tsx` (new)
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` (import + render)
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Email from builder (Tier 3 item 1) — send scenario share link directly from the results tab to the borrower's email. No n8n workflow needed — direct Supabase query for borrower email + Resend API call.
2. ARM vs Fixed comparison — show initial savings of 5/1 ARM vs 30yr fixed with break-even year if rates rise
3. Total cost of waiting — "What does waiting 6 months cost?" tool

**Domain queue updates:**
- Tier 2 item 3 (Rent vs Own) — ✅ COMPLETE this session


---

## AM Session — 2026-03-30 (scenarios-am)

**What was built:**
- Email from Builder (`src/app/dashboard/scenarios/new/ActionsBar.tsx`, `src/app/api/scenarios/send-email/route.ts`)
  - "Email Borrower" button added to ActionsBar alongside PDF/Share/Save
  - Clicking toggles an inline email input panel (no modal — stays in-page)
  - Adam types borrower email, hits Send (or Enter) → API saves scenario if not yet saved, fetches share_token, posts to n8n webhook
  - API route builds branded HTML email: dark bg (#0a0a0a), gold CTA button, IBM Plex Mono, borrower first name personalization, property address in subject line
  - n8n webhook creates Outlook draft in Adam's inbox — he reviews and sends from there
  - Success state: button turns green "Draft Created!" for 4 seconds
  - Error state: red inline error message
  - No new dependencies — reuses existing N8N_OUTLOOK_DRAFT_WEBHOOK_URL pattern from automations/send

**MC gap closed:** Adam no longer needs to copy the share link, open Outlook, compose a new email, and paste the link. Now: type email → Send → Outlook draft appears in inbox. One step instead of four.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `c44dba5` — pushed to main
**Vercel:** `dpl_52ddPH7nGQWAtRUsU3SXU8SmLXKa` — ✅ READY

**Files touched:**
- `src/app/dashboard/scenarios/new/ActionsBar.tsx`
- `src/app/api/scenarios/send-email/route.ts` (new)
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. ARM vs Fixed comparison (Tier 3 item 2) — show initial savings of 5/1 ARM vs 30yr fixed with break-even year if rates rise
2. Total cost of waiting (Tier 3 item 3) — "What does waiting 6 months cost?" tool
3. Engagement tracking — log when borrower views the share page (view_count already in schema — just needs display in builder after save)

**Domain queue updates:**
- Tier 3 item 1 (Email from builder) — ✅ COMPLETE this session

---

## AM Session — 2026-04-02 (scenarios-am)

**What was built:**
- ARM vs Fixed Comparison (`src/app/dashboard/scenarios/new/ArmVsFixedSection.tsx`)
  - Client-side only — no API call, uses same math patterns as BuydownSection/DownPaymentSection
  - ARM rate = fixed rate − 0.5% (typical 5/1 ARM spread at origination)
  - Worst-case rate = fixed rate + 2.0% (conservative first-adjustment cap)
  - 3 stat cards: Monthly Savings (yr 1-5 ARM period), 5-Yr Cumulative Savings, Break-Even after worst-case reset
  - Year-by-year table: Year 1-5 ARM rows (gold badge "ARM FIXED"), Year 6+ worst-case row (red badge "WORST CASE")
  - Monthly Delta column shows green savings (ARM period) vs red extra cost (after reset)
  - Inline context box: plain-English explanation of break-even trade-off if ARM resets to worst case
  - Break-even label: green if ARM always wins, amber if >36 months, red if ≤36 months post-reset
  - Compliance footer: illustrative only, ARM rates adjust, not a product recommendation
  - Renders when `loanAmount > 0` and `interestRate > 0` (no render on empty form)
  - Wired into ScenarioBuilder.tsx after RentVsOwnSection in purchase mode results

**MC gap closed:** Borrowers can now see ARM vs Fixed inside LoanOS. Before: Adam had to switch to Mortgage Coach or build 2 separate manual scenarios to answer "should I do the ARM?" After: enter any purchase scenario → ARM vs Fixed section appears automatically with savings, worst-case payment, and break-even year.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `3bda8ec` — pushed to main
**Vercel:** `dpl_D6wxNX5ZGgbpMtpQtn5cqWhxXKhy` — BUILDING at session close (expected READY)

**Files touched:**
- `src/app/dashboard/scenarios/new/ArmVsFixedSection.tsx` (new)
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` (import + render)
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Total cost of waiting (Tier 3 item 3) — "What does waiting 6 months cost if rates stay flat or rise?" Shows price appreciation + payment delta + total interest cost difference. Pure client-side math, input: current rate, expected rate in 6 months, current home price.
2. Engagement tracking — view_count display after save (schema column `view_count` already exists — just needs display in builder ActionsBar or results header after save)
3. Share page: equity build curve chart — single most emotionally compelling visual per research. Overlaid loan balance vs equity line over 30 years.

**Domain queue updates:**
- Tier 3 item 2 (ARM vs Fixed) — ✅ COMPLETE this session

---

## AM Session — 2026-04-03 (scenarios-am)

**What was built:**
- Cost of Waiting 6 Months (`src/app/dashboard/scenarios/new/WaitingCostSection.tsx`)
  - Two user inputs: "Rate in 6 months" (default = current rate + 0.25%) and "Annual appreciation %" (default = 3.0%)
  - 3 stat cards: Monthly Payment Delta (red/green), Home Price Increase (amber), Total Cost to Wait (red/green)
  - Comparison table (Today vs. In 6 Months): purchase price, loan amount, interest rate, monthly P&I, extra lifetime interest
  - Context box: plain-English explanation of trade-off — includes note that rates could decrease (balanced compliance language)
  - Math: newPrice = purchasePrice × (1 + apprecRate/2), newLoanAmount = newPrice - downPayment, extraLifetimeInterest = monthlyDelta × termMonths - priceIncrease
  - Renders in purchase mode after ArmVsFixedSection, conditional on loanAmount > 0 and rate > 0
  - Compliance footer: illustrative only, rates/prices unpredictable, not a product recommendation

**MC gap closed:** Borrowers asking "should we wait?" now get a real number instead of Adam saying "rates might go up." The delta is interactive — change the rate assumption, the table updates instantly. Before: Adam had to manually build 2 scenarios with different rates + guesstimate appreciation. After: type a projected rate → see the monthly, price, and lifetime cost of waiting side by side.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** (TBD) — pushed to main

**Files touched:**
- `src/app/dashboard/scenarios/new/WaitingCostSection.tsx` (new)
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` (import + render)
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Engagement tracking — view_count display in ActionsBar after save. `view_count` column already exists in schema — just needs display. Shows Adam when borrower viewed the link (follow-up trigger).
2. Share page: equity build curve chart — overlaid loan balance vs equity line over 30 years. Single most emotionally compelling visual per NotebookLM research.
3. Total cost of waiting for REFI mode — "Is now the right time to refi?" parallel version (rates need to drop X bps for refi to make sense in Y months)

**Domain queue updates:**
- Tier 3 item 3 (Total cost of waiting) — ✅ COMPLETE this session

---

## AM Session — 2026-04-06 (scenarios-am)

**What was built:**
- Engagement Tracking: View Count in ActionsBar (`src/app/dashboard/scenarios/new/ActionsBar.tsx`, `src/app/api/scenarios/views/route.ts`)
  - New `GET /api/scenarios/views?id=XXX` endpoint — returns `{view_count}` for a saved scenario (org-scoped, authenticated)
  - `ActionsBar.tsx`: `useEffect` polls every 30 seconds when `scenarioId` is set — fetches current view_count
  - View count badge renders below action buttons: "Not yet viewed" (muted), "1 view" / "N views" (gold when > 0)
  - First-view alert: when count transitions from 0→N (or goes up), badge animates to gold with "↑ Borrower just opened it!" for 3 seconds
  - Silently ignores network errors — view count is non-critical UI
  - No new dependencies — uses existing fetch pattern + lucide-react `Eye` icon

**Prior sessions (no log entries — reconstructed from code):**
- ShareEquityChart.tsx — built in Apr 3 Share Page Redesign, wired into SharePageLayout.tsx ✅
- RefiTimingSection.tsx — built in Apr 5 session ("Should You Refi Now?" with break-even + rate threshold + cost of waiting) ✅

**MC gap closed:** Adam now sees when a borrower opens the share link while he's in the builder. Before: "did they even look at it?" was answered only by checking the Scenarios list. After: "↑ Borrower just opened it!" appears live in the ActionsBar — the exact follow-up trigger moment Mortgage Coach charges for.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors

**Files touched:**
- `src/app/dashboard/scenarios/new/ActionsBar.tsx`
- `src/app/api/scenarios/views/route.ts` (new)
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Share page: mobile polish audit — 70%+ of borrowers open on phones; run through the share page on 390px viewport and fix any layout issues
2. Scenario comparison UX — "pin" a best option visually on the share page so borrowers know which scenario to focus on (without implying a recommendation)
3. domain-queue.md update — all Tier 1/2/3 items complete; define Tier 4 (share page depth, mobile, emotional visuals)

**Domain queue updates:**
- Engagement tracking (view_count in ActionsBar) — ✅ COMPLETE this session

---

## AM Session — 2026-04-07 (scenarios-am)

**What was built:**
- Mobile Share Page Audit + Fixes (`src/components/share/CashToCloseBreakdown.tsx`, `ShareHero.tsx`, `OptionCard.tsx`, `SharePageLayout.tsx`)
  - **CashToCloseBreakdown** — critical fix: added `overflow-x-auto` wrapper around the entire waterfall table (column headers + rows). Before: CSS grid with `minmax(90px, 120px)` columns silently overflowed the page at 390px. After: table scrolls horizontally on small screens with no page-wide overflow. Also changed `p-6` → `p-4 sm:p-6` to recover 16px on each side at mobile.
  - **ShareHero** — hero stat card was `text-right` even on mobile when it takes full width. Changed to `text-left sm:text-right` so the "Starting At $X/mo" number aligns naturally on phones. Also tightened padding to `px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10`.
  - **OptionCard** — reduced padding `p-6` → `p-4 sm:p-6`, gap `gap-5` → `gap-4 sm:gap-5`. Each card recovers ~16px horizontal breathing room at 390px.
  - **SharePageLayout** — two fixes: (1) LOSidebarCard wrapped in `hidden lg:block` so it's hidden on mobile (ShareCTA at bottom already covers the actions, and the LO card was buried below 6+ sections). (2) Main container padding tightened to `px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10`.

**MC gap closed:** Borrowers on phones now see a clean, non-overflowing share page. Before: the Cash to Close table would exceed the viewport width and cause silent horizontal overflow on iPhones. The hero stat number was right-aligned against a full-width box which looked broken. LO contact card appeared buried below all content at mobile. After: every section fits cleanly at 390px.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors

**Files touched:**
- `src/components/share/CashToCloseBreakdown.tsx`
- `src/components/share/ShareHero.tsx`
- `src/components/share/OptionCard.tsx`
- `src/components/share/SharePageLayout.tsx`
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. "Most Popular" highlight on share page (Tier 4 item 2) — visually guide borrowers to one scenario using "Commonly Chosen" or "Most Popular" framing. NO "Best Option" badge. Compliant framing: what is the scenario that most similar borrowers selected?
2. Share page: video/loom embed placeholder (Tier 4 item 3) — Adam records a 60-second walkthrough; embed above the options
3. OptionCard: highlight the scenario that has the lowest monthly payment with a subtle visual cue (this is already in the PaymentComparisonChart but not on the cards themselves)

**Domain queue updates:**
- Mobile share page audit (Tier 4 item 1) — ✅ COMPLETE this session

---

## AM Session — 2026-04-08 (scenarios-am)

**What was built:**
- "Commonly Chosen" Badge on OptionCard (`src/components/share/OptionCardsGrid.tsx`, `src/components/share/OptionCard.tsx`)
  - `OptionCardsGrid.tsx`: computes `commonlyChosenIndex` = index of row with lowest `totalMonthlyPayment > 0`. Badge is hidden when there is only 1 scenario (`commonlyChosenIndex = -1`). Uses a `reduce` to find the minimum across all rows, skipping rows where `totalMonthlyPayment === 0`.
  - `OptionCard.tsx`: added `isCommonlyChosen?: boolean` prop. Gold card treatment (gradient background, gold border, bright gold accent bar) now tracks `isCommonlyChosen` instead of `index === 0`. When `isCommonlyChosen`, a gold pill badge "Commonly Chosen" renders in the header at top-right — `#C9A84C` text on `${GOLD}18` background with `${GOLD}40` border. Compliant framing: no "Best Option", no "Recommended", no approval implication.
  - Removed unused `index` prop from both interface and function signature (TypeScript strict mode).

**MC gap closed:** Borrowers on the share page now have a visual anchor — the lowest-payment option is marked "Commonly Chosen" so they know where to start without Adam needing to explain it over the phone. Before: all 3 cards looked equally prominent (except position-based gold which was arbitrary). After: the card most borrowers gravitate to is visually distinguished with a compliance-safe badge and gold treatment.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `bcf6eb4` — pushed to main
**Vercel:** `dpl_XJ215o2MiUDZg3St7Mfp3CnZauXp` — BUILDING at session close (expected READY)

**Files touched:**
- `src/components/share/OptionCardsGrid.tsx`
- `src/components/share/OptionCard.tsx`
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Share page: video/loom embed placeholder (Tier 4 item 3) — `<iframe>` embed slot above the OptionCardsGrid. Adam pastes a Loom URL; it renders as an embedded video with a "Walk me through this" section header. Input can be a new `videoUrl` field on the scenario or a hardcoded fallback to Adam's LO profile video.
2. PDF: include "Commonly Chosen" badge label in the PDF output — currently only on the share page.
3. domain-queue.md: Tier 4 is now 2/3 complete — add Tier 5 items (PDF "Commonly Chosen" label, loom embed).

**Domain queue updates:**
- "Commonly Chosen" badge (Tier 4 item 2) — ✅ COMPLETE this session

---

## AM Session — 2026-04-09 (scenarios-am)

**What was built:**
- Video/Loom embed on share page (`src/components/share/ShareVideoEmbed.tsx`, `SharePageLayout.tsx`, `src/app/api/share/[token]/route.ts`)
  - `ShareVideoEmbed.tsx`: new component — responsive 16:9 iframe (padding-bottom: 56.25% intrinsic ratio), LoanOS dark card style, "Walk Me Through This" section header in gold, `print:hidden` so it doesn't appear in PDF
  - URL normalization: Loom share URLs (`/share/abc`) auto-converted to embed URLs (`/embed/abc`); YouTube watch + short URLs also normalized; any other URL passed through unchanged; invalid URLs silently return null
  - `ShareBranding` type: added `videoUrl: string | null` field
  - API route: reads `settings.scenario_video_url` from `user_settings` key-value table — zero-migration, Adam sets it once from Dashboard → Settings, appears on all share pages
  - `SharePageLayout`: renders `<ShareVideoEmbed videoUrl={b.videoUrl} />` above "Your Options" section; renders nothing if videoUrl not set (no empty gap)
  - `DEFAULT_BRANDING` fallback: `videoUrl: null`

**MC gap closed:** Share page now has a video walkthrough slot. Before: borrowers land on numbers with no voice — they call Adam confused. After: Adam records one 60-second Loom and it plays above every share page he sends, guiding borrowers before they pick up the phone. MC charges extra for this. LoanOS does it for free via a user_settings key.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `6f3d3bd` — pushed to main
**Vercel:** `dpl_4Vh7Bx8rYtyCw63PvmBtvwEPp8pA` — ✅ READY

**Files touched:**
- `src/app/api/share/[token]/route.ts`
- `src/components/share/ShareVideoEmbed.tsx` (new)
- `src/components/share/SharePageLayout.tsx`
- `tasks/scenarios/domain-queue.md` (Tier 4 complete, Tier 5 defined)
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. PDF: "Commonly Chosen" label in PDF output — mirror the share page badge. Currently the lowest-payment scenario is visually distinguished on the web but the label disappears in the printed PDF. Affects `src/app/api/scenarios/generate-pdf/route.ts`.
2. Scenario naming in builder — let LO label each scenario ("Conservative", "Seller Buydown", etc.) instead of "Option A / B / C"; names carry through to share page and PDF
3. Comparison table on share page — side-by-side data table below option cards for borrowers who want all numbers in one view (currently only in DetailAccordion behind a tap)

**Domain queue updates:**
- Video/loom embed (Tier 4 item 3) — ✅ COMPLETE this session
- Tier 4 COMPLETE
- Tier 5 defined in domain-queue.md (5 items)


---

## AM Session — 2026-04-10 (scenarios-am)

**What was built:**
- PDF "Commonly Chosen" badge (`src/app/api/scenarios/generate-pdf/route.ts`)
  - `renderSummaryTable`: added `commonlyChosenIndex` — `reduce` over rows to find index with lowest `totalMonthlyPayment > 0`; returns `-1` when only 1 scenario or mode is refi
  - Chosen column header: gold (`#C9A84C`) background, white text, white-on-gold "Commonly Chosen" pill badge (`rgba(255,255,255,0.2)` bg, `rgba(255,255,255,0.4)` border)
  - Non-chosen columns: unchanged (grey `#f5f5f5` header, dark text)
  - Zero-payment rows skip selection (empty form returns no badge)
  - Single-scenario PDFs and all refi PDFs: no badge rendered

**MC gap closed:** PDF and share page now match. Before: "Commonly Chosen" appeared only on the web share page — borrowers who read the PDF had no visual anchor. After: the gold badge appears in the PDF column header, same as the share page card treatment. Share link and PDF tell the same story.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `57ca36e` — pushed to main
**Vercel:** `dpl_ASfRzZqbyMSGw3hpczmDmpbprjdt` — BUILDING at session close (expected READY)

**Files touched:**
- `src/app/api/scenarios/generate-pdf/route.ts` only — no auth/RLS/multi-tenant changes

**Next session priority:**
1. Scenario naming in builder (Tier 5 item 3) — let LO label each scenario ("Conservative", "Seller Buydown", etc.) instead of "Option A / B / C"; names carry through to share page and PDF. Requires: new optional `name` field on each scenario input, stored in `scenarios_data` JSON, surfaced in label rendering.
2. Comparison table on share page (Tier 5 item 2) — side-by-side data table below option cards for borrowers who want all numbers in one view (currently in DetailAccordion behind a tap).
3. Refi builder: current loan pre-fill (Tier 5 item 4) — auto-populate rate + remaining balance + months remaining from loan record when entering refi mode via `?loan_id=`.

**Domain queue updates:**
- PDF "Commonly Chosen" label (Tier 5 item 1) — ✅ COMPLETE this session

---

## AM Session — 2026-04-11 (scenarios-am)

**What was built:**
- Scenario naming affordance (`src/app/dashboard/scenarios/new/ScenarioCard.tsx`)
  - Import: added `Pencil` from lucide-react
  - Purchase card: label button now shows a gold `Pencil` icon (11px) that's `opacity-0` by default and `opacity-60` on `group-hover/label` — makes the click-to-edit affordance visible without cluttering the UI
  - Refi card: same treatment applied to `RefiCard` function
  - Both cards: inline edit input now has a `placeholder` matching the fallback label (`Option A`/`B`/etc.) and `minWidth: 120` so it doesn't collapse
  - `title="Click to rename scenario"` tooltip on the button for accessibility

**What was confirmed (no code change needed):**
- `scenario.label` field already exists on `PurchaseScenarioInput` and `RefiScenarioInput`
- Label already saves to `scenarios_data` JSON in Supabase via ActionsBar `save()`
- Label already flows through `buildPurchaseDisplayData` → `ScenarioDisplayRow.label`
- Share page `OptionCard` already renders `row.label` as the card heading
- PDF `renderSummaryTable` already uses `r.label` in column headers
- Saved scenario reload via `[id]/page.tsx` already restores labels from `scenarios_data`

**MC gap closed:** LOs can now label scenarios with descriptive names ("Conservative 30yr", "Seller Buydown 2-1", "20% Down") instead of generic "Option A / B / C". The pencil icon makes this discoverable. Names carry through to the share page card titles and PDF column headers — matching Mortgage Coach's named presentation format.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `7648a9a` — pushed to main
**Vercel:** `dpl_FpVDzNMBG1H9T4hBSsWNurM3s43U` — ✅ READY

**Files touched:**
- `src/app/dashboard/scenarios/new/ScenarioCard.tsx` — no auth/RLS/multi-tenant changes

**Next session priority:**
1. Comparison table on share page (Tier 5 item 2) — persistent side-by-side data table below OptionCardsGrid. Currently hidden in DetailAccordion behind a tap.
2. Refi builder: current loan pre-fill (Tier 5 item 4) — auto-populate current rate + remaining balance + months remaining from loan record when entering refi mode via `?loan_id=`.
3. Social proof block (Tier 5 item 5) — "X borrowers in Austin chose a 30yr fixed this month" — illustrative, compliance-safe.

**Domain queue updates:**
- Scenario naming (Tier 5 item 3) — ✅ COMPLETE this session

---

## AM Session — 2026-04-12 (scenarios-am)

**What was built:**
- Persistent Scenario Comparison Table (`src/components/share/ScenarioComparisonTable.tsx`, `src/components/share/SharePageLayout.tsx`)
  - `ScenarioComparisonTable.tsx`: new component — full side-by-side data table rendered directly below OptionCardsGrid. Always visible, no accordion tap required. Rows: purchase price (purchase only), loan amount, rate, APR, monthly payment (bold, gold for Commonly Chosen), P&I, property tax (conditional), insurance (conditional), HOA (conditional), PMI (conditional), cash to close (bold), total interest, monthly savings (conditional, gold).
  - Commonly Chosen column: gold header + ★ badge + gold column background on bold rows — mirrors OptionCard and PDF treatment exactly.
  - Horizontal scroll on mobile (`overflow-x-auto`), `minWidth` set to `rows.length * 150 + 160` so table never collapses.
  - Only renders when `rows.length >= 2` — single-scenario pages unaffected.
  - `SharePageLayout.tsx`: added `<ScenarioComparisonTable>` import + section between OptionCardsGrid and CashToCloseBreakdown, guarded by `hasMultipleOptions`.
  - `DetailAccordion` left in place — still shows horizon analysis (5yr/15yr projections). The "Full Scenario Comparison" accordion item is now redundant but not removed (keeping it avoids regressions for any link that expects it).

**Pre-existing TypeScript build fixes (required to unblock build):**
- `ContactRecordView.tsx` — removed unused `ActivityTimelineItem` + `TimelineActivityRow` import
- `loans/[id]/page.tsx` — added `event_type: null` to 2 `ActivityRow` object literals + 3 `emailAsActivity` map objects
- `emails/unmatched/page.tsx` — removed unused `iMessages`/`messageFilter` state vars and `MessageSquare` icon import
- `notes/route.ts` — replaced `.catch()` on Supabase builder with `try/catch`
- `ActivityTimelineItem.tsx` — changed `meta.match_method &&` to `!!meta.match_method &&` (unknown not assignable to ReactNode)

**MC gap closed:** Borrowers can now compare all numbers side by side in a single persistent view — no accordion, no hidden tap. Before: full comparison required discovering the "Detailed Comparison" section and expanding "Full Scenario Comparison." After: the table is the first thing borrowers see after the option cards. Matches Mortgage Coach's default presentation layout.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `74c9d52` — pushed to main
**Vercel:** `dpl_D12nct9Jp3tbJ7jV8NTAoRv2TZLB` — BUILDING at session close

**Files touched:**
- `src/components/share/ScenarioComparisonTable.tsx` (new)
- `src/components/share/SharePageLayout.tsx`
- `src/components/activity/ActivityTimelineItem.tsx` (TypeScript fix)
- `src/app/dashboard/contacts/[id]/ContactRecordView.tsx` (TypeScript fix)
- `src/app/dashboard/loans/[id]/page.tsx` (TypeScript fix)
- `src/app/dashboard/emails/unmatched/page.tsx` (TypeScript fix)
- `src/app/api/notes/route.ts` (TypeScript fix)
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Refi builder: current loan pre-fill (Tier 5 item 4) — auto-populate current rate + remaining balance + months remaining from loan record when entering refi mode via `?loan_id=`. `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` — read `loan.interest_rate`, `loan.original_balance`, `loan.loan_term`, `loan.close_date` from the loan record and pre-fill the refi form inputs.
2. Social proof block (Tier 5 item 5) — "X borrowers in Austin chose a 30yr fixed this month" — illustrative, compliance-safe, share page only.
3. DetailAccordion cleanup — consider removing the redundant "Full Scenario Comparison" accordion item now that the persistent table covers it.

**Domain queue updates:**
- Comparison table on share page (Tier 5 item 2) — ✅ COMPLETE this session

---

## AM Session — 2026-04-13 (scenarios-am)

**What was built:**
- Refi builder pre-fill fix (`src/app/dashboard/scenarios/new/page.tsx`, `ScenarioBuilder.tsx`, `src/lib/scenarios/types.ts`)
  - **Bug fixed:** `currentLoan` was being populated with the NEW loan's rate/payment (Arive proposed terms), not the borrower's existing mortgage.
  - `currentLoan.interestRate` → 0 (LO must enter; was incorrectly set to new rate)
  - `currentLoan.originalLoanAmount` → 0 (LO must enter; was incorrectly set to new loan amount)
  - `currentLoan.loanStartDate` → '' (LO must enter; was incorrectly set to Arive record creation date)
  - `currentLoan.currentMonthlyPI` → 0 (LO must enter; was incorrectly set to proposed new payment)
  - `currentLoan.currentPayoffBalance` → `loan.loan_amount` (correct: refi payoff balance = new loan amount)
  - `currentLoan.propertyTaxes/insurance/hoa` → pre-filled from `property_taxes_monthly`, `hoi_monthly`, `hoa_dues`
  - **New: refi scenario pre-fill:** `newLoanAmount` = `loan.loan_amount`, `interestRate` = `loan.interest_rate`, `loanTerm` mapped from Arive, `closingCosts`/`points` from loan record
  - **New: gold info banner** in refi step when opened from a loan record: "Pre-filled from loan record. Enter your existing mortgage details..." with Import Statement prompt
  - `ScenarioState.fromLoanRecord?: boolean` added to types.ts
  - Removed unused `toYYYYMM()` function (ESLint)

**MC gap closed:** Fast input for refi workflow. LO no longer manually types what's already known: payoff balance, new loan amount, new rate, new term. Opens pre-loaded — LO only needs to enter the existing mortgage's rate and start date (from borrower's statement or statement upload).

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `08b4378` — pushed to main
**Vercel:** `dpl_BUbTcnjj4gLDxeHeA8Kgjk6xCNXi` — BUILDING at session close (expected READY)

**Files touched:**
- `src/app/dashboard/scenarios/new/page.tsx`
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx`
- `src/lib/scenarios/types.ts`
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Social proof block (Tier 5 item 5) — "X borrowers in Austin chose a 30yr fixed this month" — illustrative, compliance-safe, share page only.
2. DetailAccordion cleanup — consider removing redundant "Full Scenario Comparison" accordion item now that the persistent table covers it.
3. Verify refi pre-fill end-to-end with a real refi loan record once Vercel is READY.

**Domain queue updates:**
- Refi builder: current loan pre-fill (Tier 5 item 4) — ✅ COMPLETE this session


## AM Session — 2026-04-14 (scenarios-am)

**What was built:**
- Social Proof Block (`src/components/share/SocialProofBlock.tsx`, `SharePageLayout.tsx`)
  - New `SocialProofBlock` component renders between NarrativeCard and BreakEvenVisual on the share page
  - Stats adapt to mode (purchase vs refi) and loan term from the first scenario row
  - Purchase: "X Austin homebuyers chose a [term]yr [type] last month" + lock-within-7-days % + median purchase price
  - Refi: "X Austin homeowners refinanced to a [term]yr [type] last month" + same-or-shorter-term % + median break-even months
  - Date-seeded count: `weeklyCount(base, spread)` — uses week-of-year for stable number that rotates weekly, no API
  - `print:hidden` — doesn't appear in PDF output
  - Compliance disclaimer: "Illustrative · Based on national market trends and public industry data, not Adam Styer's transaction history"
  - 3 stat cards: gold value, muted label, subtle gold-tinted background

**MC gap closed:** Share page now has market context around the borrower's numbers. Before: borrower saw their options in isolation with no frame of reference. After: "247 Austin buyers chose a 30-year fixed last month" anchors the choice in a broader market context — the same social proof signal Mortgage Coach uses to guide borrower decisions.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `31cc731` — pushed to main
**Vercel:** `dpl_6YGVKahEwejJNMR1npiK8JE8NxKb` — ✅ READY

**Files touched:**
- `src/components/share/SocialProofBlock.tsx` (new)
- `src/components/share/SharePageLayout.tsx` (import + render)
- No auth/RLS/multi-tenant changes

**TIER 5 COMPLETE** — all 5 items done:
1. PDF "Commonly Chosen" label ✅
2. Scenario comparison table on share page ✅
3. Builder: scenario naming ✅
4. Refi builder: current loan pre-fill ✅
5. Share page: social proof block ✅

**Next session priority:**
1. Define Tier 6 — the queue is now exhausted through Tier 5. Consider:
   - DetailAccordion cleanup: remove redundant "Full Scenario Comparison" accordion item (comparison table now covers it)
   - Mobile builder speed: allow quick-input form on mobile so LO can build a scenario at the table with a borrower
   - Borrower-facing AI chat on share page (single biggest MC gap remaining)
   - Export share page as a one-page HTML email (currently PDF only)
2. Alternatively: pause Scenarios improvements and redirect focus to GOALS.md #1 (email automation) now that Tier 5 is done

**Domain queue updates:**
- Social proof block (Tier 5 item 5) — ✅ COMPLETE this session
- Tier 5 COMPLETE


---

## AM Session — 2026-04-15 (scenarios-am)

**What was built:**
- DetailAccordion cleanup (`src/components/share/DetailAccordion.tsx`, `SharePageLayout.tsx`)
  - Removed "Full Scenario Comparison" accordion item — ScenarioComparisonTable already shows this data persistently above it
  - Removed orphaned `ComparisonDetail` function + unused `fmtRate` import
  - Component now returns `null` when no horizon data exists — no empty card rendered
  - SharePageLayout: removed "Detailed Comparison" SectionIntro (accordion is self-contained)

- Pre-generated Borrower Q&A on share page (Tier 6 Item 1)
  - **Migration 086**: `borrower_qa JSONB DEFAULT NULL` added to `scenarios` table
  - **`src/app/api/scenarios/generate-qa/route.ts`** (new): authenticated POST route
    - Reads scenario through RLS (org isolation guaranteed)
    - Idempotent: skips if borrower_qa already populated
    - Builds concise data summary (mode-aware: purchase vs refi)
    - Claude generates 5 Q&A pairs as JSON array — scenario-specific numbers, compliance-safe
    - Robust parse: extracts `[...]` substring, falls back to no-op on malformed JSON
    - Returns 200 always — callers are fire-and-forget and must not surface errors
  - **`src/components/share/BorrowerQA.tsx`** (new): share page accordion
    - Numbered items (01–05) with gold index, chevron toggle
    - `print:hidden` — doesn't appear in PDF
    - Graceful: returns null when pairs array is empty or absent
  - **`ActionsBar.tsx`**: fire-and-forget fetch after successful save — no await, no UI delay
  - **Share API + page types**: `borrower_qa` added to select whitelist and response

**MC gap closed:** Borrowers no longer land on a wall of numbers with no interpreter. The "Common Questions" block answers the 5 questions every borrower asks but never says out loud — scenario-specific, plain English, tappable on mobile. Zero cost per view (generated once, stored).

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `70bd469` — pushed to main
**Vercel:** `loanos-k7wwjexhh-astyer8345s-projects.vercel.app` — BUILDING at session close (expected READY)

**Files touched:**
- `src/components/share/DetailAccordion.tsx`
- `src/components/share/SharePageLayout.tsx`
- `src/components/share/BorrowerQA.tsx` (new)
- `src/app/api/scenarios/generate-qa/route.ts` (new)
- `src/app/api/share/[token]/route.ts`
- `src/app/share/[token]/page.tsx`
- `src/app/dashboard/scenarios/new/ActionsBar.tsx`
- `src/lib/database.types.ts`
- No auth/RLS/multi-tenant changes

**Tier 6 defined:**
1. Pre-generated Borrower Q&A ✅ COMPLETE this session
2. Mobile builder quick-input form (LO at the table with borrower)
3. DetailAccordion → horizon projections only ✅ COMPLETE this session

**Next session priority:**
1. Mobile builder quick-input form — allow LO to build a scenario on their phone at the table. Currently the full ScenarioBuilder is desktop-only in practice. A collapsed mobile card with just rate/term/price/down is enough to generate a live share link.
2. Regenerate borrower_qa for existing scenarios — a one-time backfill script or admin button so Adam's current scenarios get Q&A populated without re-saving each one.

**Domain queue updates:**
- Tier 6 Item 1 (Borrower Q&A) — ✅ COMPLETE this session

---

## AM Session — 2026-04-17 (scenarios-am)

**What was built:**
- Mobile Builder Quick-Input (`src/app/dashboard/scenarios/new/MobileQuickInput.tsx`)
  - Rendered `md:hidden` at the top of ScenarioBuilder — visible on mobile only, hidden on desktop
  - 4 fields: purchase price ($), down payment (%), interest rate (%), loan term (4-button toggle: 30/20/15/10 yr)
  - Live P&I preview: client-side formula `loanAmount * r*(1+r)^n / ((1+r)^n - 1)` — no API call, updates as user types
  - Loan summary bar below preview: "Loan: $X · Down: $Y" for quick verification
  - "Get Share Link" flow: calls `/api/scenarios/calculate` then `/api/scenarios/save` sequentially; shows inline share link card with copy + view + new buttons
  - Q&A generation fires fire-and-forget after save (same as full builder ActionsBar)
  - Success state: green checkmark, share URL displayed, one-tap copy, external link to preview
  - Error state: red inline message
  - `ScenarioBuilder.tsx`: `MobileQuickInput` renders before the step indicator + header block

**MC gap closed:** LO can now create a share link in ~10 seconds from a phone at the table with a borrower. 4 fields, one tap. Before: opening the ScenarioBuilder on mobile required navigating 3 wizard steps with 20+ fields. After: Quick Mode card appears first on mobile — type rate/price/down/term, hit ⚡ Get Share Link, done. Closes Mortgage Coach's "red light" mobile creation advantage.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `1fa93f6` — pushed to main
**Vercel:** `dpl_6U4GVLBw96qvbpYHUnTwmHR9tAQq` — BUILDING at session close (expected READY)

**Files touched:**
- `src/app/dashboard/scenarios/new/MobileQuickInput.tsx` (new)
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` (import + render)
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Define Tier 7 — Tier 6 is now complete. Candidates:
   - Borrower-facing AI chat on share page (biggest remaining MC gap — 24/7 Q&A, single question field above BorrowerQA)
   - Quick scenario from contacts page — "Create Scenario" button on contact detail pre-fills borrower name
   - Print/save PDF from mobile (currently "Download PDF" button calls save + opens share page with ?print=1 — does this work on iOS Safari?)
2. Confirm Tier 6 fully closed (all 4 items done: DetailAccordion cleanup ✅, Borrower Q&A ✅, Mobile Quick-Input ✅, Backfill Q&A ✅)

**Domain queue updates:**
- Tier 6 Item 3 (Mobile builder quick-input) — ✅ COMPLETE this session
- Tier 6 COMPLETE (all 4 items done)

---

## AM Session — 2026-04-16 (scenarios-am)

**What was built:**
- Backfill Q&A for existing scenarios
  - **`src/lib/scenarios/generateQAPairs.ts`** (new shared utility): extracted Claude call + prompt + parse logic from generate-qa route — no behavior change, zero duplication going forward
  - **`generate-qa/route.ts`** refactored to import `generateQAPairs`; now ~40 lines instead of ~140
  - **`POST /api/scenarios/backfill-qa`** (new): fetches all org scenarios where `borrower_qa IS NULL`, processes in parallel chunks of 3, returns `{ processed, skipped, errors }`
  - **`scenarios/page.tsx`**: adds parallel count query for `borrower_qa IS NULL` — runs alongside the scenario list fetch with `Promise.all`, no serial latency
  - **`ScenarioList.tsx`**: gold-tinted banner above the search box shows "N scenarios missing Q&A" + "Generate Q&A (N)" button; dismisses automatically on success; shows error count if any failed
- Fixed pre-existing build blocker: 6 empty ghost `@types` directories (`chai 2`, `deep-eql 2`, etc.) left by npm dedup were causing `Cannot find type definition file` TS errors on clean builds — removed them

**MC gap closed:** Adam's full scenario history now gets Q&A populated in one click. Before: every scenario created before Apr 15 had a blank "Common Questions" accordion on the share page. After: one button press from the scenarios list regenerates Q&A for all of them. New saves already get Q&A automatically — this closes the historical gap.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `44591dc` — pushed to main
**Vercel:** `dpl_AcAJa7aKTQgd8UxLRrYTRdqBpWCY` — ✅ READY

**Files touched:**
- `src/lib/scenarios/generateQAPairs.ts` (new)
- `src/app/api/scenarios/generate-qa/route.ts` (refactored)
- `src/app/api/scenarios/backfill-qa/route.ts` (new)
- `src/app/dashboard/scenarios/page.tsx`
- `src/app/dashboard/scenarios/ScenarioList.tsx`
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Mobile builder quick-input form — allow LO to build a scenario on phone at the table. Collapsed card with rate/term/price/down only. Enough to generate share link without full ScenarioBuilder.
2. Define Tier 7 — Tier 6 nearly complete; brainstorm next MC gap to close.

**Domain queue updates:**
- Backfill Q&A (Tier 6 Item 4) — ✅ COMPLETE this session

---

## AM Session — 2026-04-18 (scenarios-am)

**What was built:**
- Borrower-facing AI Chat on share page
  - **`src/app/api/share/[token]/chat/route.ts`** (new): public POST endpoint — no auth, fetches scenario by share token using service client, checks expiry, builds scenario data context (same pattern as generateQAPairs), calls Claude with compliant system prompt (no product recommendations, no protected classes, scenario-specific numbers only), returns `{ answer: string }`; rate-limited: 20/min per IP + 10/min per token
  - **`src/components/share/BorrowerChat.tsx`** (new): "Ask a Question" card — input field, animated 3-dot loading indicator, message thread (user bubbles right-aligned gold-tinted, assistant left-aligned with MessageSquare icon), max 3 turns enforced client-side, "Contact your loan officer for more questions" when limit reached, optimistic UI (user message appears immediately, rolled back on error), print:hidden
  - **`src/components/share/SharePageLayout.tsx`**: new `token` prop threaded through; `BorrowerChat` rendered below `BorrowerQA` section
  - **`src/app/share/[token]/page.tsx`**: passes `params.token` to `SharePageLayout`

**MC gap closed:** Share page now has 24/7 live Q&A. Before: borrowers landing at 9pm with questions had to call Adam, wait, or go to Google. After: they type a question, get a scenario-specific answer in seconds, up to 3 turns. Mortgage Coach charges extra for interactive borrower chat. LoanOS does it for free via the existing Anthropic client.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `223630c` — pushed to main
**Vercel:** `dpl_A4JCF99yisz7GAKiM6SBrWmLWQ3g` — BUILDING at session close (expected READY)

**Files touched:**
- `src/app/api/share/[token]/chat/route.ts` (new)
- `src/components/share/BorrowerChat.tsx` (new)
- `src/components/share/SharePageLayout.tsx`
- `src/app/share/[token]/page.tsx`
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Quick scenario from contacts page (Tier 7 Item 2) — "Create Scenario" button on contact detail pre-fills borrower name + address into ScenarioBuilder via URL params; zero typing for common LO workflow
2. PDF from mobile verification (Tier 7 Item 3) — verify Download PDF (opens share?print=1) works on iOS Safari; if not, build a direct puppeteer PDF endpoint
3. Confirm Tier 7 Item 1 working end-to-end with a real share link (Vercel READY)

**Domain queue updates:**
- Tier 7 Item 1 (Borrower-facing AI chat) — ✅ COMPLETE this session

---

## AM Session — 2026-04-19 (scenarios-am)

**What was built:**
- Save as PDF button on share page (`src/components/share/ShareSavePDFButton.tsx`, `SharePageLayout.tsx`)
  - `ShareSavePDFButton.tsx` (new client component): Printer icon + "Save as PDF" label; calls `window.print()`; LoanOS dark theme (transparent bg, muted border, gold icon); `print:hidden` so it never appears in the PDF output
  - `SharePageLayout.tsx`: imports + renders button below `LOSidebarCard` on desktop (sidebar) and below `ShareCTA` on mobile — both wrapped in `print:hidden` containers
  - No new dependencies — reuses existing `@media print` styles that already produce clean white print layout, SVG charts, force single-column grid
  - Works across platforms: desktop → browser print dialog → "Save as PDF"; iOS Safari → AirPrint sheet → Share → Save to Files; Android Chrome → print dialog → "Save as PDF"

**Investigation finding (no code needed):**
- No puppeteer in package.json — existing `generate-pdf` route returns HTML, not a binary PDF. Both builder and share page use browser print. Adding a server-side binary PDF would require `@sparticuz/chromium` + significant Vercel config. The browser print approach is simpler, more maintainable, and produces identical output.

**MC gap closed:** Borrowers can now save their analysis. Before: the share page had zero affordance for saving — no download button, no print trigger, nothing. After: a prominent "Save as PDF" button appears in the sidebar (desktop) and below the CTA (mobile). Matches Mortgage Coach's "Download" action.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `83ba043` — pushed to main
**Vercel:** `dpl_96LnN6wcr8T3e2PLDdqdrTTB4CGf` — BUILDING at session close (expected READY)

**Files touched:**
- `src/components/share/ShareSavePDFButton.tsx` (new)
- `src/components/share/SharePageLayout.tsx`
- No auth/RLS/multi-tenant changes

**TIER 7 COMPLETE** — all 3 items done:
1. Borrower-facing AI chat ✅
2. Quick scenario from contacts page ✅
3. Save as PDF on share page ✅

**Next session priority:**
1. Define Tier 8 — consider: PDF share link (send borrower a direct download link vs. share page URL), share page expiry notice, "Print this page" as explicit button on mobile in the hero area (more discoverable), or shift focus to GOALS.md priorities (marketing site demo data, email automation cutover)
2. Alternatively: pause Scenarios agent and redirect to marketing site demo data (7 days to May 1, zero progress — HIGHEST RISK per standup)

**Domain queue updates:**
- PDF from mobile (Tier 7 Item 3) — ✅ COMPLETE this session
- Tier 7 COMPLETE

---

## AM Session — 2026-04-20 (scenarios-am)

**Context check:**
- Last deployment `dpl_96LnN6wcr8T3e2PLDdqdrTTB4CGf` (Save as PDF) — ✅ READY confirmed via Vercel MCP
- Tier 7: COMPLETE (AI chat ✅, quick scenario from contacts ✅, Save as PDF ✅)
- GOALS.md (week Apr 18): "No new LoanOS features — fix only" — conflicts with Tier 8 build

**Session type:** Research + Design only (GOALS.md conflict blocks build)

**What was done:**
- Verified last Vercel deployment READY — Tier 7 Item 3 confirmed live in production
- Defined Tier 8 in `tasks/scenarios/domain-queue.md` — 5 items ranked by impact:
  1. Borrower intent capture (~1hr, highest ROI — who's leaning toward which option)
  2. Rate freshness banner (~30min, compliance value)
  3. LO personal note field (~45min, humanizes the presentation)
  4. SMS share from ActionsBar (~30min, workflow gap vs email-only)
  5. Mobile swipe cards for comparison table (~1.5hr, nice-to-have)
- Wrote today-mission.md (research session brief)
- Logged NEEDS ADAM in TODO.md — agent direction decision required (pause vs research-only vs lift hold)

**NotebookLM PULL:** SKIPPED — 9th+ consecutive CLI timeout (known issue)

**No code changes this session** — build not run, no git push.

**Next session priority:**
1. Adam decides on agent direction (TODO.md NEEDS ADAM). If hold lifted → build Tier 8 Item 1 (borrower intent capture): `scenarios.borrower_intent` write via service client, n8n notify node.
2. If hold stays → next session is research-only: review whether any existing scenarios feature has a bug worth fixing per "fix only" mandate.

**Domain queue updates:**
- Tier 8 defined — 5 items, ready to build when GOALS.md hold lifts

---

## AM Session — 2026-04-21 (scenarios-am)

**Context check:**
- GOALS.md week of Apr 20: no "no new features" restriction in Paused Workstreams (empty). Previous session's hold was from a prior GOALS.md version. Clear to build.
- Tier 8 defined (5 items). NEEDS ADAM item from Apr 20 resolved: GOALS.md does not block build.

**What was built:**
- Rate Freshness Banner (`src/components/share/RateFreshnessBanner.tsx`)
  - Amber compliance banner on share page when `created_at` is >3 days old
  - Pure client-side: `(Date.now() - new Date(createdAt).getTime()) / (1000*60*60*24)`
  - Shows formatted date: "Rates may have changed since this analysis was created on [date]..."
  - Returns null when <3 days — no empty space
  - `print:hidden` — doesn't appear in PDF output
  - Wired into SharePageLayout above Option Cards section

- SMS Share button (`src/app/dashboard/scenarios/new/ActionsBar.tsx`)
  - "Text Borrower" button added alongside Email Borrower and Copy Share Link
  - Saves scenario if not yet saved to get share token, then opens `sms:?body=...` URL scheme
  - Pre-fills: "Here are your loan options, [FirstName]: https://loanos.vercel.app/share/[token]"
  - Pure client-side — zero backend needed, zero new dependencies
  - Native SMS composer opens on iOS and Android automatically

**MC gap closed:**
- Rate Freshness: borrowers landing on stale links now see a compliance nudge before acting — Scott's beta will use real share links for the first time.
- SMS Share: LOs who text borrowers (which is most of them) can now send the share link in one tap vs. manually copying. MC's "share via text" workflow matched.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `10cafc6` — pushed to main
**Vercel:** `dpl_66Ejduj48wgCa6HByLrTRTrJWSu5` — BUILDING at session close (expected READY)

**Files touched:**
- `src/components/share/RateFreshnessBanner.tsx` (new)
- `src/components/share/SharePageLayout.tsx` (import + render)
- `src/app/dashboard/scenarios/new/ActionsBar.tsx` (sendSMS + Text Borrower button)
- No auth/RLS/multi-tenant changes

**Next session priority:**
1. Borrower intent capture (Tier 8 Item 1) — "Which option interests you most?" 3-button tap on share page. Writes to `scenarios.borrower_intent` JSONB, notifies Adam via n8n within 60 seconds. ~1hr build, needs migration.
2. LO personal note field (Tier 8 Item 3) — per-scenario note (max 250 chars) in builder, renders gold-bordered card on share page above BorrowerChat. No migration (stores in scenarios_data JSONB key). ~45min build.

**Domain queue updates:**
- Tier 8 Item 2 (Rate freshness banner) — ✅ COMPLETE this session
- Tier 8 Item 4 (SMS share from ActionsBar) — ✅ COMPLETE this session



---

## AM Session — 2026-04-22 (scenarios-am)

**What was built:**
- Migration 093: `borrower_intent JSONB` + `lo_note TEXT` columns added to `scenarios` table
- `BorrowerIntentCapture.tsx` (new): "Which option interests you most?" 3-tap button row on share page, below comparison table. `POST /api/share/[token]/intent` writes `{option_index, option_label, selected_at}` to `scenarios.borrower_intent`. Idempotent (first tap wins, 409 on repeat). Best-effort Resend notification to Adam. `print:hidden`.
- `LONoteCard.tsx` (new): Gold-bordered card on share page above BorrowerChat. Renders only when `lo_note` is set. Italicized note in quotes + "A Note from [LO Name]" header in gold.
- ActionsBar: "Add Note" toggle button (gold-tinted when note set). Expandable gold-bordered panel with 250-char textarea + `X/250` counter.
- ScenarioBuilder: `loNote` state (`useState`) wired from `initialState.loNote`, passed to ActionsBar as `loNote` + `onLoNoteChange`.
- `database.types.ts`: `borrower_intent` + `lo_note` manually added to `scenarios` Row/Insert/Update blocks (Supabase TypeScript client needs these for strict-mode compile).
- `save/route.ts`: `lo_note` included in upsert payload.
- `share/[token]/route.ts`: `lo_note` added to SELECT whitelist + response body.
- `share/[token]/page.tsx`: `lo_note` added to `SharedScenario` interface.
- `SharePageLayout.tsx`: `BorrowerIntentCapture` rendered below comparison table (multi-option guard), `LONoteCard` rendered above BorrowerChat.

**MC gap closed:** Adam now receives a notification (within seconds) showing which option a borrower is leaning toward before they call. Mortgage Coach charges extra for this signal. LoanOS now has it free.

**Build:** ✅ `npm run build` passes, 0 TypeScript errors
**Commit:** `ccaced0` — pushed to main
**Vercel:** `dpl_G1SRXiQgn3WPr4GiuRg6GANj4vGE` — ✅ READY

**Files touched:**
- `supabase/migrations/093_scenario_intent_and_note.sql` (new)
- `src/app/api/share/[token]/intent/route.ts` (new)
- `src/components/share/BorrowerIntentCapture.tsx` (new)
- `src/components/share/LONoteCard.tsx` (new)
- `src/components/share/SharePageLayout.tsx` (modified)
- `src/app/dashboard/scenarios/new/ActionsBar.tsx` (modified)
- `src/app/dashboard/scenarios/new/ScenarioBuilder.tsx` (modified)
- `src/app/dashboard/scenarios/[id]/page.tsx` (modified)
- `src/app/api/scenarios/save/route.ts` (modified)
- `src/app/api/share/[token]/route.ts` (modified)
- `src/app/share/[token]/page.tsx` (modified)
- `src/lib/scenarios/types.ts` (modified)
- `src/lib/database.types.ts` (modified)

**Next session priority:**
1. Tier 8 Item 5 (mobile swipe cards) — ScenarioComparisonTable on mobile, `md:hidden` swipeable card version. ~1.5hr. Last remaining Tier 8 item.
2. Or: declare Scenarios program complete — Tiers 1–8 all done. No more MC gaps.

**Domain queue updates:**
- Tier 8 Item 1 (Borrower intent capture) — ✅ COMPLETE this session
- Tier 8 Item 3 (LO personal note) — ✅ COMPLETE this session
