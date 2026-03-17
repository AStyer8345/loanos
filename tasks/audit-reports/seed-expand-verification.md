# Seed Expansion Verification — (seed-expand.sql)
**Date:** 2026-03-16
**Test User:** test@loanos.dev (deadbeef-dead-beef-dead-beefdeadbe01)

## Contacts (45 total)
| Type | Count |
|------|-------|
| borrower | 34 |
| realtor | 9 |
| other (financial advisors) | 2 |
| **Total** | **45** |

## Loans (37 total)
| Status | Count | Dashboard Stage |
|--------|-------|-----------------|
| lead | 3 | Pre-Approval |
| application_intake | 4 | Pre-Approval |
| pre_approved | 6 | Pre-Approval |
| processing | 3 | Processing |
| underwriting | 4 | Underwriting |
| clear_to_close | 4 | Clear to Close |
| funded | 13 | Funded |
| **Total** | **37** | |

### Funded by Month
| Month | Count |
|-------|-------|
| Jan 2026 | 5 |
| Feb 2026 | 5 |
| Mar 2026 | 3 |
| **Total Funded** | **13** |

Note: The "funded" count includes 1 from the initial seed (Brandon Wells, Mar 3) + 12 from expansion = 13 total. Mar funded = 3 (Wells + Khalil + Shaw).

### Pipeline Breakdown (Dashboard view — active stages)
| Dashboard Stage | Count |
|-----------------|-------|
| Pre-Approval | 13 (lead + app_intake + pre_approved) |
| Processing | 3 |
| Underwriting | 4 |
| Clear to Close | 4 |
| **Active Pipeline** | **24** |

## Activity Log (72 total)
| Type | Count |
|------|-------|
| Call | 28 |
| Email | 25 |
| Text | 19 |
| **Total** | **72** |

## Special Cases Verified
- [x] Nathan Burke (L34): last activity 10 days ago — triggers "needs attention" flag
- [x] David Park: has 2 loans (L19 processing + L28 investment property new app)
- [x] Robert Cheng: financial advisor contact + borrower on L27
- [x] Sarah Blackwell: financial advisor contact + borrower on L29 (referred by Cheng)
- [x] Michael Torres (L30): lead_source = 'Web Lead'
- [x] Patricia Lowe (L37): lead_source = 'Past Client', refi opportunity
