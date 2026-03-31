# Review: Week 2 Posts 8–14 — Social Media
Verdict: APPROVED WITH NOTES
Date: 2026-03-31

## Spec Compliance: PASS
## Voice: PASS
## Compliance: PASS
## Brand: PASS
## Platform Specs: PASS (after fixes applied)

---

## Round 1 Verdicts

| Post # | Platform | Voice | Compliance | Brand | Platform Spec | R1 Verdict |
|--------|----------|-------|------------|-------|---------------|------------|
| 8 | LinkedIn Carousel | PASS | PASS | PASS | PASS | APPROVED |
| 9 | Instagram Reel | PASS | PASS | PASS | PASS | APPROVED |
| 10 | LinkedIn Carousel | PASS | PASS | PASS | FAIL (6 hashtags) | REJECTED |
| 11 | Instagram Video | PASS | PASS | PASS | PASS | APPROVED |
| 12 | LinkedIn Carousel | PASS | PASS | PASS | FAIL (6 hashtags) | REJECTED |
| 13 | Instagram Carousel | PASS | PASS | PASS | PASS | APPROVED |
| 14 | Facebook | PASS | PASS | PASS | PASS | APPROVED |

---

## Round 1 Issues Fixed Inline

### Post 10 — LinkedIn hashtag count
- **Issue:** 6 hashtags in LinkedIn caption (#FHA #ConventionalLoan #FirstTimeHomeBuyer #AustinMortgage #HomeBuying #MortgageTips). LinkedIn spec: ≤5.
- **Fix applied:** Removed #AustinMortgage (least distinctive — redundant with AustinRealEstate tags in other posts).
- **Corrected:** `#FHA #ConventionalLoan #FirstTimeHomeBuyer #HomeBuying #MortgageTips`
- **Status:** FIXED — updated in build report

### Post 12 — LinkedIn hashtag count
- **Issue:** 6 hashtags in LinkedIn caption (#AustinRealEstate #TravisCounty #WilliamsonCounty #HaysCounty #AustinHousing #HomeBuying). LinkedIn spec: ≤5.
- **Fix applied:** Removed #AustinHousing (redundant with #AustinRealEstate).
- **Corrected:** `#AustinRealEstate #TravisCounty #WilliamsonCounty #HaysCounty #HomeBuying`
- **Status:** FIXED — updated in build report

---

## Round 2 Verdicts (after fixes)

| Post # | Platform | Voice | Compliance | Brand | Platform Spec | Final Verdict |
|--------|----------|-------|------------|-------|---------------|---------------|
| 8 | LinkedIn Carousel | PASS | PASS | PASS | PASS | APPROVED |
| 9 | Instagram Reel | PASS | PASS | PASS | PASS | APPROVED |
| 10 | LinkedIn Carousel | PASS | PASS | PASS | PASS | APPROVED |
| 11 | Instagram Video | PASS | PASS | PASS | PASS | APPROVED |
| 12 | LinkedIn Carousel | PASS | PASS | PASS | PASS | APPROVED |
| 13 | Instagram Carousel | PASS | PASS | PASS | PASS | APPROVED |
| 14 | Facebook | PASS | PASS | PASS | PASS | APPROVED |

**All 7 posts: APPROVED**

---

## Compliance Detail — No Issues

### Post 8 (HIGH RISK — Rate Education)
- ✅ NMLS# 513013 in caption AND Slide 12
- ✅ No specific rate percentages anywhere — directional language only ("roughly 50 basis points", "a half-point rate difference")
- ✅ Slide 9: "This is directional guidance based on current market conditions, not a rate prediction or guarantee" — compliant
- ✅ No guaranteed approval language
- ✅ No APR required (no specific rate quoted)

### Post 9 (Rate Education)
- ✅ NMLS# 513013 in script (final line) and caption
- ✅ No specific rates in script or caption
- ✅ Equal Housing Lender not required (no rates on thumbnail)

### Post 10 (Buyer Education)
- ✅ NMLS# 513013 in caption and Slide 8
- ✅ MIP percentages (1.75%, 3.5% down) are FHA program facts — not rate quotes — APR disclosure not triggered
- ✅ PMI estimates ($100–150/month) are illustrative — not rate quotes
- ✅ No guaranteed approval language

### Post 11 (Personal Brand)
- ✅ NMLS# 513013 in caption — sufficient for non-rate content
- ✅ "First-generation homebuyers" story is anecdotal — no specific client identified — FTC testimonial rules not applicable
- ✅ No rates mentioned

### Post 12 (Austin Market Data — placeholder)
- ✅ NMLS# 513013 in caption AND Slide 10
- ✅ Equal Housing Lender on Slide 10
- ✅ All unverified stats use ~[~PLACEHOLDER] prefix — compliant per spec
- ✅ "My buyers are finding the most leverage" — anecdotal, not a market guarantee — acceptable

### Post 13 (Austin Market Data — Instagram)
- ✅ NMLS# 513013 in caption and Slide 6 CTA
- ✅ Equal Housing Lender in Slide 6 footer
- ✅ All stats use ~[~PLACEHOLDER] prefix

### Post 14 (Facebook cross-post)
- ✅ NMLS# 513013 in first comment only — compliant (Facebook first-comment protocol)
- ✅ Equal Housing Lender in first comment
- ✅ No link in caption body — compliant (avoids Facebook link penalty)
- ✅ 3 hashtags — at spec limit (max 3 for Facebook)

---

## Notes for Next Session

1. **Publer curls for Posts 9, 11, 14** — text-only posts have curl commands in the build report. Adam runs from local terminal (Publer API unreachable from agent environment).
2. **Carousel posts (8, 10, 12, 13)** — must be created in Publer UI after Canva exports. Canva briefs are in the build report.
3. **Posts 12 & 13 placeholder data** — Adam pulls Unlock MLS figures on Thursday April 16. Replace all ~[~PLACEHOLDER] values before publishing April 17.
4. **NMLS# profile audit** — still outstanding on all 4 platforms. Must complete before April 7 (Week 1 go-live).
5. **Posts 8–14 need to be inserted into social_drafts Supabase table** — QA subagent handles this verification.

---

## QA Cleared
All 7 posts APPROVED. QA subagent may proceed.
