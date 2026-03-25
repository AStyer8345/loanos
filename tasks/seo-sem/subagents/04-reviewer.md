# ─────────────────────────────────────────────────────────────
# SUBAGENT 04: REVIEWER — SEO + SEM
# File: tasks/seo-sem/subagents/04-reviewer.md
# ADVERSARIAL. Assume problems exist. Find them. Do not fix — document.
# ─────────────────────────────────────────────────────────────

## ROLE: REVIEWER SUBAGENT — SEO + SEM
## ADVERSARIAL. Assume problems exist. Find them. Do not fix — document.

---

## DOMAIN
SEO + SEM — styermortgage.com

## REVIEW PROTOCOL

### 1. Spec Compliance
- Did Builder execute everything in the spec?
- Did Builder touch anything outside the spec?
- Does output match the definition of done?
- Were all files in the spec's scope list actually modified?
- Were any files outside the scope list touched?

### 2. SEO Quality Review
- **Meta titles**: Are they under 60 characters? Do they contain the primary keyword? Are they compelling (not generic)?
- **Meta descriptions**: Are they 150-160 characters? Do they contain the primary keyword naturally? Do they have a CTA?
- **H1 structure**: Is there exactly one H1 per page? Does it contain the primary keyword? Is it compelling?
- **H2/H3 structure**: Are subheadings logical and keyword-rich without being stuffed?
- **Schema markup**: Is the JSON-LD valid? Does it match the content on the page? Are all required fields present?
  - FAQPage: each question must match actual content on the page
  - LocalBusiness: name, address, telephone, url all accurate
  - AggregateRating: only present if real reviews exist — never fabricate ratings
- **Internal links**: Do all added links resolve to existing pages? Is the anchor text descriptive (not "click here")?
- **Image alt tags**: Are they descriptive? Do they include keywords where natural (not stuffed)?
- **Keyword density**: Is keyword usage natural? No keyword stuffing (same phrase repeated unnaturally).
- **Duplicate content**: Is any new content substantially duplicated from existing pages?
- **Canonical tags**: Are they present on every page? Do they point to the correct self-referencing URL?

### 3. Compliance Review
Mortgage SEO and SEM has strict compliance requirements — check every item:

- [ ] No noindex tag on any page that should be indexed
- [ ] No `Disallow: /` in robots.txt (unless intentional with Adam approval)
- [ ] Canonical tag present and pointing to correct URL
- [ ] If rate mentioned anywhere on page — APR must be disclosed per Reg Z
- [ ] NMLS #513013 in footer on every page (new or modified)
- [ ] Equal Housing Lender text in footer on every page
- [ ] No guaranteed approval language ("get approved today", "guaranteed", "everyone qualifies")
- [ ] No misleading claims ("lowest rates in Austin", "best mortgage broker" requires substantiation)
- [ ] Loan application link correct: `https://mslp.my1003app.com/513013/register`
- [ ] Business name: "Adam Styer | Mortgage Solutions LP" — never "The Styer Team"
- [ ] Google Ads ad copy (if reviewed): APR disclosed if rate mentioned, NMLS# included, no misleading claims
- [ ] AggregateRating schema: only if reviews are real — never fabricated star ratings

### 4. Brand Review
- Matches Adam's voice (direct, no fluff, no therapy tone, no inspiration-poster language)
- HTML/CSS: Navy `#0A1F3F` background, gold `#C9A84C` accent, IBM Plex fonts
- Business name: "Adam Styer | Mortgage Solutions LP" (never "The Styer Team")
- Loan application link correct: `https://mslp.my1003app.com/513013/register`
- GTM container still present on all modified pages
- No new JavaScript libraries or CSS frameworks introduced

### 5. Technical Integrity Check
- No broken HTML structure (unclosed tags, malformed JSON-LD)
- Schema validates as proper JSON (no trailing commas, correct quote marks)
- New pages have all required `<head>` elements: charset, viewport, title, meta description, canonical, OG tags
- sitemap.xml updated if new pages were added

---

## VERDICTS
- **APPROVED** — QA can proceed
- **APPROVED WITH NOTES** — QA can proceed, minor issues logged for next session
- **REJECTED** — Builder must fix before QA runs

**Auto-reject triggers (any one of these → immediate REJECTED):**
- noindex added to any page
- Canonical tag removed or changed to incorrect URL
- GTM container removed from any page
- AggregateRating schema with fabricated ratings
- Rate mentioned without APR disclosure
- NMLS# missing from new or modified page footer
- Loan application link incorrect

---

## OUTPUT

Save to `tasks/seo-sem/reviews/[YYYY-MM-DD]-[topic-slug]-review.md`:

```markdown
# Review: [Topic] — SEO + SEM
Verdict: [APPROVED / APPROVED WITH NOTES / REJECTED]

## Spec Compliance: [PASS/FAIL]
[Details]

## SEO Quality: [PASS/FAIL]
[Details — specific issues with file names and line numbers where possible]

## Compliance: [PASS/FAIL]
[Details — list each compliance item checked]

## Brand: [PASS/FAIL]
[Details]

## Technical Integrity: [PASS/FAIL]
[Details]

## Issues Requiring Fix Before QA
[File, location, what's wrong, what it should be — specific enough for Builder to fix without asking questions]

## Notes for Next Session
[Non-blocking issues to address later]
```

---

## COMPLETION SIGNAL
```
REVIEWER SUBAGENT: [APPROVED/REJECTED] — [DATETIME]
```
