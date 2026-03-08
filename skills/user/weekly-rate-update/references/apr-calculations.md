# APR Calculation Reference

APR (Annual Percentage Rate) reflects the true annual cost of a mortgage including fees, expressed as a percentage. It's always higher than the note rate because it factors in closing costs spread over the loan term.

## Base Assumptions

All calculations assume:
- **No discount points or origination fees** (Adam's standard quote)
- **740+ credit score**
- **20% down payment** for Conventional Primary
- Loan amount: **$400,000** (use as standard calc basis — APR ratio stays consistent across amounts)

## Fee Assumptions by Product

These are the typical third-party and lender fees that get rolled into APR calculation. Since Adam quotes with no points/origination, the APR bump comes from standard closing costs only.

### Conventional 30-yr Fixed (Primary)
- Typical fees factored into APR: ~$3,500
  - Appraisal: $500
  - Title insurance & search: $1,500
  - Recording fees: $200
  - Credit report: $75
  - Flood cert: $25
  - Tax service: $75
  - Processing/underwriting: $1,125
- **Expected APR spread over rate: +0.030% to +0.040%**

### Conventional 15-yr Fixed
- Same fee structure as 30-yr: ~$3,500
- Shorter amortization means fees spread over fewer years
- **Expected APR spread over rate: +0.090% to +0.120%**

### 30-yr Jumbo
- Similar fees, slightly higher due to larger loan review: ~$3,800
- **Expected APR spread over rate: +0.030% to +0.040%**

### VA 30-yr
- VA Funding Fee: 2.15% of loan amount for first use (this is the big one)
  - On $400K loan = $8,600
  - BUT: many veterans are exempt or have reduced fee
- For APR calc, assume **funding fee is financed** (standard)
- Other fees similar to conventional: ~$3,000
- **Expected APR spread over rate: +0.150% to +0.180%**
- Note: If Adam specifies "exempt" or "second use", adjust accordingly

### FHA 30-yr
- UFMIP (Upfront Mortgage Insurance Premium): 1.75% of loan amount
  - On $400K = $7,000 (typically financed into loan)
- Annual MIP: 0.55% (factored into APR as ongoing cost)
- Standard fees: ~$3,000
- **Expected APR spread over rate: +0.550% to +0.580%**
- The big APR jump on FHA is almost entirely from MIP

### FHA 5-yr ARM
- Same UFMIP: 1.75% financed
- Same annual MIP: 0.55%
- Standard fees: ~$3,000
- ARM APR calculation uses the initial rate for the fixed period, then assumes the fully indexed rate for remaining term
- **Expected APR spread over rate: +1.050% to +1.100%**
- ARM APRs look high because they project rate adjustments after the fixed period

## Simplified APR Formula

For quick calculation without running a full amortization:

```
APR ≈ Rate + (Total Fees / Loan Amount) × (1 / Loan Term in Years) × 100

More precisely for 30-yr:
APR ≈ Rate + (Total Fees / Loan Amount) × 3.33

For 15-yr:
APR ≈ Rate + (Total Fees / Loan Amount) × 6.67

For 5-yr ARM (initial period):
APR factors in rate reset assumptions — use the spread ranges above
```

## Quick Reference Spreads

When in doubt, use these APR spreads over the note rate:

| Product | APR Spread (add to rate) |
|---------|------------------------|
| Conv 30-yr | +0.035% |
| Conv 15-yr | +0.107% |
| Jumbo 30-yr | +0.036% |
| VA 30-yr | +0.172% |
| FHA 30-yr | +0.568% |
| FHA 5-yr ARM | +1.071% |

These are calibrated to a $400K loan with no points/origination. They're close enough for a weekly rate update — this isn't a loan estimate, it's market intelligence.

## Validation

Cross-check your calculated APRs against Adam's example from the screenshot:
- Conv 30-yr: 5.875% rate → 5.910% APR (spread: +0.035%) ✓
- 15-yr: 5.25% → 5.357% (spread: +0.107%) ✓
- Jumbo: 6.125% → 6.161% (spread: +0.036%) ✓
- VA: 5.375% → 5.547% (spread: +0.172%) ✓
- FHA 30: 5.375% → 5.943% (spread: +0.568%) ✓
- FHA ARM: 4.75% → 5.821% (spread: +1.071%) ✓

These match. Use these spreads consistently.
