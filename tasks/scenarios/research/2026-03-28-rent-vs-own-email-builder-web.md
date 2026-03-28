# Web Research — 2026-03-28
## Topics: Rent vs Own UX, Email from Builder, Financial Visualization

---

## Rent vs Own Calculators (2026 Landscape)

**Source:** https://definitivecalc.com/blog/rent-vs-buy-2026-analysis
**Summary:** Comprehensive 2026 analysis of rent vs. buy at current rates (~6%). Key insight: the calculator must present the breakeven year clearly — the crossover point where buying overtakes renting in total value. Borrowers respond to a single clear "Year X you come out ahead" headline rather than a spreadsheet of assumptions. Urgency frame: rates at current levels still favor buying in most TX markets when 5+ year horizon assumed.

**Source:** https://www.newhomeapproval.com/post/buying-vs-renting-in-2026-why-homeownership-is-more-affordable-than-rent-in-most-u-s-counties
**Summary:** ATTOM 2026 data shows owning is more affordable than renting in 57.7% of 364 US counties. Presentation angle: frame the comparison as "buying wins in most markets" and show the user their specific market data. TX is favorable — this is a strong narrative hook for Austin borrowers.

---

## Financial Visualization & UX Best Practices

**Source:** https://medium.com/@marketingtd64/the-ux-behind-financial-data-visualization-tools-fb19548b8704
**Summary:** Financial data UX principles: (1) progressive disclosure — show the headline number first, reveal assumptions on demand; (2) visual hierarchy guides the eye to the decision-relevant metric; (3) interactive sliders beat static tables for engagement. For mortgage tools specifically: the equity build curve is the single most emotionally compelling chart — "your net worth grows like this" beats any payment comparison.

---

## Loan Officer Email Sharing Best Practices

**Source:** https://empowerlo.com/blog/mortgage-email-marketing
**Summary:** Best practice for scenario sharing: one clear CTA per email, segment by where the borrower is in the process (lead vs. under contract vs. closed). For scenario email from builder: subject line "Your mortgage options — [City] $[amount]" performs well. Include the key number (monthly payment or cash to close) in the preview text. Link directly to the share page, not to the LOS login. Mobile-first — 70%+ of borrowers open on phone.

---

## Design Notes for Rent vs Own Mode

Key UX patterns to implement:
- **Single headline metric**: "Break even in Year X" as the hero number
- **Timeline chart**: equity accumulation vs. renting cost over 5/10/15 years (line chart, not bar)
- **Input simplicity**: pre-fill from active loan, only ask for current monthly rent
- **Emotional frame**: "In 5 years, you'd own $X in equity vs. $0 renting"
- **Compliance**: present as illustrative estimate, note appreciation assumptions explicitly

## Design Notes for Email from Builder

- Add "Send to Borrower" button to results footer
- Pre-populate To: from loan contact email
- Subject: auto-generated from scenario data
- Body: share page link + key metric (e.g., "Monthly payment as low as $X")
- No LOS login required for share page — borrower just clicks link
