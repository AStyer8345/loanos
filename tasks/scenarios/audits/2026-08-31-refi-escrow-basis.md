# Refi savings compares a PITI against a P&I — 2026-08-31 AM

**Severity: highest found in this program.** It reached a real stored borrower-facing
narrative, it inverts the conclusion of the analysis, and it is reachable by default on
both refi entry paths that do not come from a loan record.

---

## The defect

`calculations.ts:328`

```
monthlySavings = currentCalc.totalMonthlyPayment - newTotalMonthly
```

- `currentCalc.totalMonthlyPayment` (`:293`) = `pi + propertyTaxes + insurance + hoa + pmi` — **PITI**
- `newTotalMonthly` (`:325`) = `newPI + scenario.propertyTaxes + scenario.insurance + scenario.hoa + scenario.pmi`

The two sides are only comparable when the scenario carries the same escrow as the
current loan. When it does not, **the entire escrow is booked as refinance savings.**
A refinance does not remove property taxes or homeowners insurance.

## How the asymmetry is created — by default, not by misuse

| Path | Current-loan escrow | New-scenario escrow | Symmetric? |
|---|---|---|---|
| `?loan_id=` (`page.tsx:143-146`, `:169-172`) | from loan record | from loan record | ✅ yes |
| Blank start (`ScenarioBuilder.tsx` `DEFAULT_REFI_SCENARIO` / `DEFAULT_CURRENT_LOAN`) | `0` | `0` | ✅ at start |
| LO fills Current Loan card (`CurrentLoanCard.tsx:118-119`) | entered | still `0` | ❌ **breaks** |
| **Import Statement** (`StatementUpload.tsx:60-86`) | parsed from statement | **never written** | ❌ **breaks, silently** |

`StatementUpload.applyImport` builds a `Partial<CurrentLoanInput>`. It writes
`propertyTaxes`, `insurance` and `pmi` to the **current loan only** — there is no code
path by which it can touch a scenario. The AI statement-parse feature therefore
*manufactures* the asymmetry every time it is used on a statement that shows escrow.

Note the codebase already knows this class of problem exists: `RefiTimingSection.tsx:267`
discloses "Monthly savings shown are P&I only — taxes, insurance, and HOA may differ."
That disclosure covers the timing section only, not the headline comparison.

## Measured on real production data

Production row `fcb3ebb5-fc9a-4fcb-88af-e11137fdcdc5` (refinance, 2026-03-29).
Current loan: $465,000 @ 6.625%, 30yr, start 2024-06, taxes $1,016/mo, insurance $200/mo.
New scenario: $465,000 @ 6.375%, 30yr, closing costs $6,041, **taxes $0, insurance $0**.

Run through the real engine (`tests/scenarios/refiEscrowBasis.test.ts`):

| | As stored | Escrow carried forward | Error |
|---|---|---|---|
| Current payment | $4,193.45 (PITI) | $4,193.45 | — |
| New payment | $2,901.00 (P&I only) | $4,117.00 | |
| **Monthly savings** | **$1,292.45** | **$76.45** | **16.9×** |
| **Break-even** | **month 5** | **month 80** | 16× later |
| 5-year savings (gross) | $77,547 | $4,587 | |
| **5-year net** (− $6,041) | **+$71,506** | **−$1,454** | **sign flips** |

$1,216 of the $1,292.45 — **94%** — is escrow the refinance does not remove.
`newMonthlyPI` is identical in both runs: nothing but the escrow moved.

## It reached the borrower

The narrative stored on that row quotes every one of the wrong figures verbatim:

> "reduces your monthly payment by $1,292.45, dropping you from $4,193.45 down to
> $2,901.00. You'll recoup your closing costs in just five months… Over five years,
> you'll save $77,547 compared to staying in your current loan."

True position: about **$76/mo**, break-even **month 80**, and **−$1,454 at five years**.
The document tells the borrower a refinance pays for itself in five months when it does
not pay for itself inside the five-year window at all.

This is not a narrative-quality problem. The model was handed correct arithmetic on a
malformed comparison and described it faithfully. **The standing "narrative quality
untested" item is now partly answered: the prose is fine; its inputs were not.**

## What was shipped, and what deliberately was not

**Shipped — changes zero numbers.** An amber *Mixed comparison basis* banner in the refi
builder, between the Current Loan card and the option grid. It fires when the current
loan carries escrow and any scenario carries none, names the offending options and the
dollar amount, and states that a refinance does not remove escrow.

**Not shipped — the engine and the inputs are untouched.** `git diff -- src/lib/` is
empty. Auto-copying escrow into the scenario is *defensible* and is what the
`?loan_id=` path already does — but so is requiring the LO to enter it, since taxes and
insurance genuinely can change after closing (reassessment, escrow re-analysis, a new
carrier). **Two defensible fixes that mean different things to a borrower ⇒ Adam's
call**, by the same rule that keeps #2 open and that let #4b ship without one.

The banner was chosen precisely because it is the part *no* reading objects to: it
changes no figure, forecloses neither option, and makes the defect impossible to hit
silently while the decision is open.

## Correction to the standing record — the PDF is not puppeteer-based

`domain-queue.md` ("PDF generation (puppeteer-based)") and twelve sessions of "PDF
render untested" are wrong about the mechanism. `package.json` contains **no puppeteer
and no chromium**. `generate-pdf/route.ts:93-95` returns `new Response(html, {'Content-Type': 'text/html'})`
— the route is an HTML generator, and the PDF is produced by the browser's own
`window.print()` from the share page. There is no server-side render step to test.
"PDF render untested" should be restated as "the generated HTML has never been
eyeballed," which is a much smaller and cheaper gap.

## Verification

- `npx vitest run tests/scenarios/` → **51 passed** (46 prior + 5 new)
- `npm run build` → **exit 0**, `✓ Compiled successfully`, 107/107 static pages, types checked
- Production data read-only (two `select` queries); **no writes, no emails**

**Limit, stated plainly:** the banner was verified by type-check, build and the logic
that gates it — **it was not observed rendering.** The builder sits behind Supabase auth
and this is an unattended session. The gating expression is pure arithmetic over props
already in scope; the risk is cosmetic, not behavioral.
