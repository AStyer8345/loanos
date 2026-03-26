# Strategy Spec: Week 2 — Keyword Cluster Map + Week 3 Implementation Blueprint
Date: 2026-03-26
Status: READY FOR EXECUTION (Week 3)

---

## Scope

### In Scope
- Homepage H1 and meta description rewrite
- Suburb page meta description trims (5 of 9 confirmed over 155 chars)
- Loan page title and description audit
- Blog placeholder pages — noindex recommendation
- Austin housing market 2025 page — stale content decision
- DSCR page title NMLS# fix
- Self-employed mortgage — content gap recommendation

### Out of Scope
- No new pages this session (Week 3 is on-page optimization only)
- No sitemap changes (already completed 2026-03-26 — 25 pages added)
- No Google Ads changes
- No structural/visual site changes

---

## SITEMAP STATUS UPDATE

**The sitemap fix is DONE.** Commit `9313067` (2026-03-26) added 25 missing pages:
- 15 suburb pages (hutto through florence)
- 3 blog posts
- 4 calculator/LP pages

**No further sitemap work needed in Week 3.** Remove from Builder's task list.

---

## Keyword Cluster Priority Map

### PRIMARY — Highest ROI

| Cluster | Primary Keyword | Priority Page | Current State | Week 3 Action |
|---------|----------------|---------------|---------------|---------------|
| Austin Broker | mortgage broker Austin TX | Homepage | H1 keyword-weak | **H1 rewrite** |
| Austin Broker | Austin mortgage broker | Homepage | Title says "Lender" not "Broker" | Title update |
| Austin Broker | mortgage pre-approval Austin | /mortgage-pre-approval-austin.html | Unknown quality | Audit + optimize |
| First-Time Buyer | first time home buyer Austin TX | /first-time-home-buyer.html | Landing page live ✅ | Meta description check |
| Suburb — Round Rock | mortgage lender Round Rock TX | /round-rock-mortgage-lender.html | Desc 158 chars (over) | Trim to 150 |
| Suburb — Georgetown | mortgage lender Georgetown TX | /georgetown-mortgage-lender.html | Desc 158 chars (over) | Trim to 150 |
| Suburb — Cedar Park | mortgage lender Cedar Park TX | /cedar-park-mortgage-lender.html | Desc 158 chars (over) | Trim to 150 |

### SECONDARY — Medium ROI

| Cluster | Primary Keyword | Priority Page | Current State | Week 3 Action |
|---------|----------------|---------------|---------------|---------------|
| Refinance | refinance mortgage Austin TX | /loans/refinance.html | H1/desc unknown | Audit |
| VA Loans | VA loan Austin TX | /loans/va | Desc 158 chars (over) | Trim to 150 |
| Suburb — Leander | mortgage lender Leander TX | /leander-mortgage-lender.html | Desc 152 chars ✅ | No action needed |
| Suburb — Pflugerville | mortgage lender Pflugerville TX | /pflugerville-mortgage-lender.html | Desc 162 chars (over) | Trim to 150 |
| DSCR | DSCR loan Austin TX | /dscr-loan-austin-tx.html | Title missing NMLS# | Add NMLS# |
| Rates | Austin mortgage rates today | /austin-mortgage-rates | Page new (2026-03-25) | Verify meta, add lastmod to sitemap |

### CONTENT GAPS — New Pages Needed (Weeks 4-5)

| Missing Keyword Cluster | Opportunity | Recommended Page |
|------------------------|-------------|-----------------|
| self employed mortgage Austin TX | Leahy Lending owns this — no other Austin broker competes | /self-employed-mortgage-austin.html |
| mortgage broker vs bank Austin | Decision-stage buyers comparison | /mortgage-broker-vs-bank.html (page exists — verify/optimize) |
| best mortgage broker Austin TX | Commercial intent, high conversion | Testimonials page SEO + homepage trust signals |
| how much house can I afford Austin | Informational | /how-much-house-can-i-afford-austin.html (page exists — verify) |

---

## Execution Instructions for Builder (Week 3)

### TASK 1 — Homepage H1 Rewrite (HIGHEST PRIORITY)
**File:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/index.html`
**Risk:** LOW — H1 change only. Reversible with git revert.

**Current:**
```html
<h1>Your Austin Home Loan Simplified</h1>
<p class="hero-subtitle">Let Adam Styer guide you to a fast, reliable pre-approval in Austin.</p>
```

**Proposed:**
```html
<h1>Mortgage Broker Austin TX</h1>
<p class="hero-subtitle">Adam Styer helps Austin homebuyers get pre-approved fast — with honest advice and wholesale rates from 40+ lenders.</p>
```

**Why:** "mortgage broker Austin TX" is the #1 target keyword. It appears nowhere in the current H1. Google weights H1 heavily for ranking signal. This single change is the highest-ROI on-page fix on the site.

---

### TASK 2 — Homepage Title Rewrite
**File:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/index.html`
**Risk:** LOW

**Current:** `Austin TX Mortgage Lender | Adam Styer | NMLS #513013` (53 chars)

**Proposed:** `Mortgage Broker Austin TX | Adam Styer | NMLS #513013` (52 chars)

**Why:** Changes "Lender" to "Broker" (accurate — Adam IS a broker) and moves the primary keyword to the front of the title tag, which Google weights more heavily. Target keyword: "mortgage broker Austin TX".

---

### TASK 3 — Homepage Meta Description Rewrite (CRITICAL — 173 chars, must fix)
**File:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/index.html`
**Risk:** LOW

**Current (173 chars — truncated by Google):**
`Austin's top-rated independent mortgage broker for home loans, refinancing, and pre-approval. Get pre-approved in 24 hours. 136+ five-star reviews. Adam Styer, NMLS #513013.`

**Proposed (148 chars — within limit):**
`Austin mortgage broker Adam Styer — 136+ five-star reviews, 21-day avg close, 40+ wholesale lenders. Get pre-approved today. NMLS #513013.`

**Verification:** Count = 140 chars. ✅ Under 155.

---

### TASK 4 — Suburb Meta Description Trims

All of these are 158–162 chars and get truncated by Google. Trim each to ~148–152 chars (safe zone).

#### Round Rock (158 chars → target 150)
**File:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/round-rock-mortgage-lender.html`

Read current full description, then trim to:
`Round Rock TX mortgage lender Adam Styer — home loans, pre-approval, and refinancing. 136+ five-star reviews. 40+ wholesale lenders. NMLS #513013.` (147 chars)

#### Cedar Park (158 chars → target 150)
**File:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/cedar-park-mortgage-lender.html`

Trim to:
`Cedar Park TX mortgage lender Adam Styer — home loans, pre-approval, and refinancing. 136+ five-star reviews. 40+ wholesale lenders. NMLS #513013.` (147 chars)

#### Georgetown (158 chars → target 150)
**File:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/georgetown-mortgage-lender.html`

Trim to:
`Georgetown TX mortgage lender Adam Styer — home loans, pre-approval, and refinancing. 136+ five-star reviews. 40+ wholesale lenders. NMLS #513013.` (147 chars)

#### Pflugerville (162 chars → target 150)
**File:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/pflugerville-mortgage-lender.html`

Trim to:
`Pflugerville TX mortgage lender Adam Styer — home loans, pre-approval, and refinancing. 136+ five-star reviews. 40+ wholesale lenders. NMLS #513013.` (148 chars)

#### VA Loans (158 chars → target 150)
**File:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/loans/va.html`

Read current and trim. Target: 148–152 chars.

---

### TASK 5 — DSCR Page Title — Add NMLS#
**File:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/dscr-loan-austin-tx.html`
**Risk:** LOW

**Current:** `DSCR Loans Austin TX | Investor Mortgage | Adam Styer` (53 chars, missing NMLS#)

**Proposed:** `DSCR Loans Austin TX | Investor Mortgage | Adam Styer | NMLS #513013` (69 chars — slightly long)

**Alternative (shorter):** `DSCR Loans Austin TX | Adam Styer | NMLS #513013` (48 chars)

Recommend the alternative for cleaner length.

---

### TASK 6 — Blog Placeholder Pages — Add Noindex
**Files:**
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/blog/2026-03-06-temp-placeholder.html`
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/blog/2026-03-10-temp-placeholder.html`

**Risk:** LOW — these are empty pages; noindex prevents thin content penalty.

Add to `<head>` section:
```html
<meta name="robots" content="noindex, nofollow">
```

These should also be verified against the sitemap — ensure they are NOT in sitemap.xml (they should not be). If found in sitemap, remove them.

---

### TASK 7 — Austin Housing Market 2025 Page
**File:** `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/austin-housing-market-2025.html`

**Decision needed:** This page has "2025" in the URL. Options:
- **Option A (Recommended):** Update content to 2026 context + add 301 redirect from old URL to /austin-mortgage-rates (the new evergreen rates page). This is the cleanest long-term solution.
- **Option B:** Simply update the title to say "2026" but keep the URL — creates confusion.
- **Option C:** Add noindex + leave as-is.

**Recommend Option A** for Week 3 if Builder has time; otherwise add noindex and defer to Week 4.

---

### TASK 8 — Update styermortgage-context.md (END OF SESSION)
After completing all Builder tasks, update:
- `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/styermortgage-context.md`
- Update "KNOWN ISSUES" section with any items resolved
- Update "LAST UPDATED" line

---

## Files in ~/Documents/Claude/styerteam-mortgage-site/ to Modify

| File | Task | Type of Change |
|------|------|----------------|
| index.html | Tasks 1, 2, 3 | H1 rewrite, title rewrite, meta description rewrite |
| round-rock-mortgage-lender.html | Task 4 | Meta description trim |
| cedar-park-mortgage-lender.html | Task 4 | Meta description trim |
| georgetown-mortgage-lender.html | Task 4 | Meta description trim |
| pflugerville-mortgage-lender.html | Task 4 | Meta description trim |
| loans/va.html | Task 4 | Meta description trim |
| dscr-loan-austin-tx.html | Task 5 | Title tag update |
| blog/2026-03-06-temp-placeholder.html | Task 6 | Add noindex |
| blog/2026-03-10-temp-placeholder.html | Task 6 | Add noindex |
| austin-housing-market-2025.html | Task 7 | Noindex or redirect |
| styermortgage-context.md | Task 8 | Update known issues + last updated |

---

## Tools / Accounts / Credentials Needed

- GitHub access: AStyer8345 (for git push → Netlify auto-deploys)
- Google Search Console: Adam needs to export 90-day query report (open question from this session)
- No Google Ads changes this week

---

## Implementation Order

1. Homepage changes (Tasks 1-3) — highest SEO impact, do first
2. Suburb meta descriptions (Task 4) — quick wins, 4 files, ~5 min each
3. DSCR title fix (Task 5) — 2-minute fix
4. Blog placeholder noindex (Task 6) — prevent thin content penalty
5. Austin housing 2025 page (Task 7) — most complex, do last
6. Context file update (Task 8) — always last

---

## Risk Register

| Action | Risk | What Could Go Wrong | Mitigation |
|--------|------|---------------------|------------|
| Homepage H1 change | LOW | Rankings could shift temporarily before Google re-crawls | Expected — short-term volatility, long-term gain |
| Homepage title change | LOW | "Lender" → "Broker" is accurate and keyword-aligned | No risk |
| Meta description rewrites | LOW | Meta descriptions are not a direct ranking factor — they affect CTR | If CTR drops, revert; watch GSC CTR report |
| Add noindex to placeholder pages | LOW | Could deindex pages if wrong file targeted | Verify filenames carefully — only 2026-03-06 and 2026-03-10 temp placeholders |
| 301 redirect (Task 7) | MEDIUM | If austin-housing-market-2025 has backlinks, 301 preserves them. Risk: low if no external backlinks | Check for backlinks first if possible |
| NEVER add noindex to indexed pages | CRITICAL | Never add noindex to suburb pages, loan pages, homepage | Builder must only add noindex to confirmed temp/placeholder pages |

---

## Content Gap Backlog (Weeks 4-5)

These are NOT in scope for Week 3 but Builder should be aware for planning:

1. `/self-employed-mortgage-austin.html` — NEW page targeting Leahy Lending's niche
   - Primary keyword: "self employed mortgage Austin TX"
   - Search volume: 150–300/mo estimated
   - Difficulty: MEDIUM — only Leahy competes in Austin
   - Content angle: Bank statement loans, P&L loans, DSCR for business owners

2. Verify `/mortgage-broker-vs-bank.html` quality — page exists in sitemap, check if it has real content
   - Primary keyword: "mortgage broker vs bank Austin"
   - Important for commercial-intent buyers

3. Blog post: "How Long Does Mortgage Pre-Approval Take in Austin TX?"
   - Primary keyword: "mortgage pre-approval Austin TX" (long-tail variation)
   - Structured as answer-first (answer in first paragraph) for AI Overview capture

---

## Definition of Done

Week 3 Builder session is complete when:
- [ ] Homepage H1 updated to "Mortgage Broker Austin TX" (exact)
- [ ] Homepage title changed from "Lender" to "Broker"
- [ ] Homepage meta description ≤155 chars
- [ ] 4 suburb page meta descriptions trimmed to ≤152 chars
- [ ] VA loans meta description trimmed
- [ ] DSCR page title includes NMLS #513013
- [ ] Both temp placeholder blog posts have noindex
- [ ] Austin housing 2025 page: noindex added OR 301 redirect implemented
- [ ] All changes committed and pushed to GitHub (Netlify auto-deploys)
- [ ] styermortgage-context.md updated
- [ ] Reviewer and QA subagents have run

---

## Commit Message Format

All Week 3 commits should use:
```
seo: [description of change]
```

Example: `seo: rewrite homepage H1 and title to target mortgage broker Austin TX`

---

## Open Questions for Adam (No Blockers — Informational)

1. **GSC data**: Export Search Console > Performance > Queries (last 90 days, all queries) and share. This will tell us which keywords are on page 2-3 (fastest wins).
2. **Self-employed mortgage page**: Want to build a page targeting bank statement/P&L loans? This is an uncontested keyword cluster where Leahy Lending is the only Austin competitor.
3. **Austin housing 2025 page**: Keep and update, or redirect to /austin-mortgage-rates? No rush — adding noindex in Week 3 is fine as a placeholder decision.
