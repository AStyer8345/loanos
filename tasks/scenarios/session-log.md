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

