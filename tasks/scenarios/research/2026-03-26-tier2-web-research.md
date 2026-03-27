# Web Research — Tier 2 Scenario Types (2-1 Buydown, Down Payment, Rent vs Own)
Date: 2026-03-26 PM
Session focus: Preparing for next Tier 2 builds

---

## 1. Guild Mortgage — Temporary Buydown Calculator
URL: https://www.guildmortgage.com/mortgage-calculators/temporary-buydown-calculator/
Summary: Guild's borrower-facing buydown calculator shows Year 1 / Year 2 / Year 3+ payment breakdown for 2-1 and 3-2-1 buydowns. Displays total buydown cost (typically 2-3% of loan), savings summary, and break-even. Reference for LoanOS 2-1 buydown UI layout — key fields: note rate, buydown type selector, loan amount, term.

## 2. NerdWallet — Rent vs Buy Calculator
URL: https://www.nerdwallet.com/mortgages/calculators/rent-vs-buy-calculator
Summary: Best-in-class rent vs buy UX — factors in all homeownership costs (mortgage, taxes, insurance, maintenance, HOA) and computes break-even year. Includes appreciation rate and rent inflation sliders. Generally finds buying wins at 3-5yr horizon. Reference for LoanOS Rent vs Own mode — key metric: "break-even year" displayed prominently.

## 3. Homebuyer.com — Rent vs Buy Calculator
URL: https://homebuyer.com/tools/rent-vs-buy-calculator
Summary: Described as "World's Best Rent vs Buy Calculator." 5-year break-even emphasis with wealth-building narrative — frames the comparison as equity accumulation vs. rent sunk cost. Relevant for LoanOS emotional narrative approach — rent vs own should feel like a story, not just a table.

## 4. Bree Smith Design — Mortgage Calculator UX Case Study
URL: http://www.breesmithdesign.com/mortgage-calculator-case-study
Summary: UX research case study finding that time-on-task for mortgage calculators averages 1:37 — too slow. Recommends number inputs over sliders for precision, pre-populated common inputs, and "time travel" amortization snapshots (select a year vs. scroll full table). Directly applicable to LoanOS Scenarios input speed and down payment comparison mode design.

## 5. Angel Oak — 2-1 Buydown Calculator
URL: https://angeloakms.com/2-1-buydown-calculator/
Summary: Clean loan officer tool for 2-1 buydown client presentations. Minimal inputs: loan amount, rate, term. Output: Year 1 payment, Year 2 payment, Year 3+ payment, total buydown cost. Simple competitor reference — LoanOS should match this baseline and exceed it with narrative + share link.

---

## Key Takeaways for Next Session (2-1 Buydown Build)

1. **Core fields needed**: note rate, loan amount, term → auto-compute Year 1 (-2%), Year 2 (-1%), Year 3+ (note rate)
2. **Buydown cost**: display prominently — typically 2-3% of loan, often seller-paid
3. **Break-even framing**: "If you refinance before month 36, the buydown saves you $X"
4. **Narrative hook**: "Your payment starts at $X in Year 1 — here's how it steps up"
5. **Rent vs Own**: Break-even year is the key metric — display it as hero number, not buried in table
