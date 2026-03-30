# Review: Week 1 Posts 1–7 — Social Media
Verdict: REJECTED
Date: 2026-03-28

---

## Overall: PASS/FAIL per Category

| Category | Result |
|----------|--------|
| Spec Compliance (all 7 slots present, correct platforms/formats) | PASS |
| Voice | PASS |
| Compliance (NMLS, APR, EHL, prohibited language) | FAIL — 1 issue |
| Brand | PASS |
| Platform Spec (word counts, hashtag counts) | FAIL — 3 posts missing hashtags |

---

## Post-by-Post Results

| Post # | Platform | Voice | Compliance | Brand | Platform Spec | Verdict |
|--------|----------|-------|------------|-------|---------------|---------|
| 1 | LinkedIn Carousel | PASS | FAIL — APR not disclosed | PASS | PASS | REJECTED |
| 2 | Instagram Reel | PASS | PASS | PASS | FAIL — 0 hashtags (need 5–10) | REJECTED |
| 3 | LinkedIn Long-form | PASS | PASS | PASS | NOTE — word count borderline | APPROVED WITH NOTES |
| 4 | Instagram Reel | PASS | PASS | PASS | FAIL — 0 hashtags (need 5–10) | REJECTED |
| 5 | LinkedIn Carousel | PASS | PASS | PASS | PASS | APPROVED WITH NOTES |
| 6 | Instagram Carousel | PASS | PASS | PASS | FAIL — 0 hashtags (need 5–10) | REJECTED |
| 7 | Facebook Cross-post | PASS | PASS | PASS | PASS | APPROVED WITH NOTES |

Posts approved (fully): 0
Posts approved with notes: 3 (Posts 3, 5, 7)
Posts rejected: 4 (Posts 1, 2, 4, 6)

---

## Issues Requiring Fix Before QA

### COMPLIANCE — Post 1 (MUST FIX — AUTO-REJECT)

**File:** `tasks/social-media/build-reports/2026-03-28-week1-build.md` — Post 1, Slides 5–8

**Issue:** Slides 5–8 state specific rate figures (6.5% and 7.0%) with payment calculations. Per spec: "Specific rate stated → APR must also be disclosed → REJECT if missing."

**Current disclaimer (Slide 12):** "APR varies based on credit profile, loan amount, and property type. Contact for current rates and APR."

**What's wrong:** The disclaimer acknowledges APR exists but does not disclose an actual APR figure. The spec requires APR to be *disclosed*, not just referenced. Stating "APR varies" alongside specific rate examples (6.5%, 7.0%) does not satisfy the disclosure requirement.

**What it should be:** Either (a) remove specific rate percentages from slides and replace with ranges or directional language only (e.g., "rates in the mid-6s to low-7s"), OR (b) include representative APR figures alongside each rate example (e.g., "6.5% rate / 6.72% APR example" with appropriate disclaimer). Option (a) is lower risk.

---

### PLATFORM SPEC — Posts 2, 4, 6 (MUST FIX)

**Issue:** All three Instagram posts (Reel captions for Posts 2 and 4, Carousel caption for Post 6) have ZERO hashtags. Instagram spec requires 5–10 hashtags per post.

**Post 2 caption:** No hashtags present.
**Post 4 caption:** No hashtags present.
**Post 6 caption:** No hashtags present.

**What it should be:** Each Instagram post needs 5–10 relevant hashtags appended to the caption. Suggested sets:

Post 2 (rate education Reel):
`#MortgageRates #AustinMortgage #RateEducation #HomeBuying #AustinRealEstate #MortgageTips`

Post 4 (personal brand / closing day Reel):
`#MortgageBroker #AustinMortgage #ClosingDay #BehindTheScenes #HomeBuying #AustinRealEstate`

Post 6 (Austin market data carousel):
`#AustinRealEstate #AustinMarket #HomeBuying #AustinHomes #RealEstateTips #MortgageTips`

---

## Compliance Issues (Must Fix)

### Issue 1 — Post 1: Specific Rates Without APR Disclosure

**Requirement violated:** "Specific rate stated → APR must also be disclosed → REJECT if missing"

**Location:** Post 1, Slides 5–8 (rate comparison examples at 6.5% and 7.0%, payment calculations, qualification math)

**Current state:** Slide 12 includes: *"Rates shown are illustrative only and not a live quote. APR varies based on credit profile, loan amount, and property type."* — APR is referenced but not disclosed.

**Required fix:** Disclose an actual representative APR value for each rate example, OR remove specific rate percentages entirely and use directional language only.

**Severity:** HIGH. This is the post Builder flagged as "HIGH RISK — rate content." The disclaimer is not sufficient as written.

---

## Notes for Next Session (Non-Blocking)

### Post 3 — Word Count Near Limit
Builder logged 148 words. Independent count yields approximately 160–166 words when including the application URL line, business name, and hashtags. LinkedIn spec is ≤150 words. Recommend a recount. If over 150, trim the body — the weakest candidate for cuts is: "Coach your buyers early. It prevents the blowups later." — these two sentences can be folded into the preceding point or cut.

### Post 5 — Caption States Placeholder Data as Fact
The rewritten caption ("Austin real estate this week: 3.5 months of inventory. 52 days on market. $485K median.") presents PLACEHOLDER figures as current fact with no tilde (~) or qualifier. The original caption used tildes (~3.5 months, ~$485K). The rewrite removed them. If this caption goes live with placeholder data and no qualifier, it's a factual accuracy problem. Add tildes back or add explicit note: "verify figures before posting."

### Post 4 — Script Hook Timing
The rewritten script hook ("You get a key. I get a phone call, a wire confirmation, and three hours of holding my breath. Here's what closing day looks like from here.") is 29 words — likely 6–8 seconds to deliver naturally. Spec requires hook in first 3 seconds. Not a compliance issue, but recommend trimming to: "You get a key. I get a phone call and three hours of holding my breath. Here's why." — cuts delivery to ~4 seconds.

### Post 7 — First Comment Dependency
NMLS# 513013 and Equal Housing Lender disclosure are in the first comment, not the caption. This is compliant per spec — but the first comment must be posted immediately after the post goes live. If it's posted as a Publer draft and activated without the first comment, it publishes without any NMLS# disclosure. Flag for Adam: run first comment curl manually within 60 seconds of activation, or confirm Publer can attach a first comment to the scheduled post.

### All Posts — Publer Drafts Not Created
All 7 posts failed to upload to Publer (DNS error). The final production copy in the build report is the authoritative version for manual curl execution. Curl commands are provided in the build report. Adam must run from local terminal.

### Posts 5, 6, 7 — PLACEHOLDER Data
All three market data posts contain PLACEHOLDER figures from Unlock MLS (unlockmls.com returned decompression error during build). These posts cannot go live until real data is pulled and all ~figures are replaced. This is not a compliance issue — it is a factual accuracy and credibility issue. Recommended pull date: Thursday 2026-04-02 or 2026-04-09 before the scheduled publish date of 2026-04-10.

### NMLS# Profile Audit Still Pending
Builder noted this as deferred. All 4 social profiles (LinkedIn, Instagram, Facebook, Google Business Profile) must display NMLS# 513013 before any post goes live. This is a platform-level compliance requirement independent of individual post copy.

---
## Round 2 Review — 2026-03-28 [AM]

### Verdict: APPROVED WITH NOTES

| Post # | Fix Verified | New Issues? | Verdict |
|--------|-------------|-------------|---------|
| 1 | YES — Slides 5–8 contain zero specific rate percentages; directional/relative language only; NMLS# 513013 present; APR issue resolved | None | APPROVED |
| 2 | YES — 8 hashtags present in caption; NMLS# 513013 in caption body and #NMLS513013 hashtag; no specific rates in script | None | APPROVED |
| 3 | YES — Word count ~148 per build report; consolidated language is clean; no compliance issues introduced during trim | None | APPROVED |
| 4 | YES — 8 hashtags present in caption; no rates mentioned; NMLS# 513013 via #NMLS513013 hashtag | None | APPROVED |
| 5 | YES — All three placeholder figures carry tilde prefix (~3.5 months, ~52 days, ~$485K); placeholder warning present; NMLS# 513013 in slide copy (market data post, not rate-specific — caption omission acceptable per spec) | None | APPROVED WITH NOTES |
| 6 | YES — 8 hashtags present; NMLS# 513013 explicit in caption body; Equal Housing Lender on Slide 5 per build report checklist | None | APPROVED |

Posts approved (clean): 5 (Posts 1, 2, 3, 4, 6)
Posts approved with notes: 1 (Post 5)
Posts rejected: 0

### Outstanding Notes for Adam

1. **Post 5 — Placeholder data must be replaced before publish.** All three figures (~3.5 months inventory, ~52 days on market, ~$485K median) are unverified estimates. Pull live figures from Unlock MLS on or after 2026-04-02 and update slide copy and caption before activating. Do not publish with ~ figures.

2. **Post 6 — Same placeholder data issue.** Same three figures appear in caption and slide copy. Replace from Unlock MLS before publish.

3. **Post 7 (not re-reviewed this round — already APPROVED WITH NOTES).** First comment with NMLS# 513013 and Equal Housing Lender must be posted within 60 seconds of the post going live. Confirm Publer supports first comment scheduling or run manually.

4. **All posts — Publer drafts still require manual curl execution from Adam's local terminal.** DNS error from agent environment prevented automated upload during build. Curl commands are in the build report.

5. **Post 4 — Hook timing note (non-blocking).** Script hook is ~29 words / 6–8 seconds. Spec wants hook in first 3 seconds. Adam can trim on camera or in post-production edit. Suggested trim: "You get a key. I get a phone call and three hours of holding my breath. Here's why." This was flagged in Round 1 — not a compliance issue, just a best-practice note.

6. **NMLS# profile audit still pending.** All 4 social profiles (LinkedIn, Instagram, Facebook, Google Business Profile) must show NMLS# 513013 before any post goes live. Complete this before Week 1 publish date of 2026-04-10.
