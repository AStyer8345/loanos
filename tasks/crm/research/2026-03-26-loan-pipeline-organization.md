# Research: Loan Pipeline Organization
Date: 2026-03-26
Session: AM (scheduled)
Status: COMPLETE

---

## Question

What does the best-in-class loan pipeline look like for an independent mortgage LO?
- What stages make sense for Adam's volume and workflow?
- What info should be visible at a glance per loan?
- What's buried that should surface?
- How do top LOS/CRM views (Encompass, Byte, SimpleNexus) organize their pipeline?

---

## Current State (LoanOS as of 2026-03-26)

Pulled from live Supabase:
- 817+ loans in the `loans` table
- Loan statuses: mapped from Arive webhook payload via WF2 (status_updated)
- Pipeline page likely shows loans in table/list format sorted by some default
- No Kanban view for loans (only contacts has Kanban prototype)
- No visible "days in stage" or "days to close" indicators
- Status labels come from `getStageLabel()` in `loan-stages.ts`

---

## What Top LOs Actually Track Per Loan

### Industry research: Encompass, SimpleNexus, Arive pipeline views

The best pipeline views for mortgage LOs share these common attributes:

**Tier 1 — Must See at a Glance (above the fold)**
1. Borrower name + loan amount
2. Current status / stage
3. Days in current stage (time-on-stage)
4. Close date (contract close of escrow)
5. Rate lock expiry date (critical — locks expire and cost money)
6. LO assigned (relevant once multi-tenant)
7. Realtor partner name

**Tier 2 — Visible on Row Expand or Side Panel**
8. Loan type (Conv, FHA, VA, USDA)
9. Purchase price / loan amount / LTV
10. Interest rate
11. P&I payment
12. Property address
13. Lead source (where did this borrower come from?)
14. Processing notes (last Janie touch)

**Tier 3 — Available but Not Primary**
15. Co-borrower name
16. Loan number (Arive)
17. Appraisal status
18. Condition list open/cleared ratio

---

## Stage Definitions: What Makes Sense for Adam

### Current Arive Webhook Stages (from WF2)
Based on the `MILESTONE_LABELS` in the milestone route:
- application_received
- processing
- appraisal_ordered
- conditional_approval
- clear_to_close
- closing_scheduled
- funded

### Best Practice Stage Sequence (7-stage model)
This aligns with what top-performing LOs use in Encompass and SimpleNexus:

| Stage | LoanOS Status | Meaning | Action Trigger |
|-------|-------------|---------|----------------|
| 1. Application | application_received | App submitted, file opening | Send "App Received" email (milestone) |
| 2. Processing | processing | Janie has file, collecting docs | Borrower doc checklist email |
| 3. Submitted to UW | — (gap) | File packaged and submitted | Internal notification only |
| 4. Approved w/ Conditions | conditional_approval | CU/conditional approval issued | Send approval email |
| 5. Clear to Close | clear_to_close | All conditions cleared | CD disclosure (CD email workflow) |
| 6. Closing Scheduled | closing_scheduled | Signing date confirmed | Logistics email to borrower + realtor |
| 7. Funded | funded | Wire out, keys delivered | Review request + congratulations |

**Gap identified:** "Submitted to UW" is missing from LoanOS milestone list. Arive likely fires a status event for this. Low priority but worth adding for pipeline visibility.

### Stage Count Recommendation
7 stages is the sweet spot. Fewer (5) loses visibility. More (10+) creates fatigue.
Current LoanOS MILESTONE_LABELS has 7 — this is correct.

---

## What's Buried That Should Surface

### 1. Days in Stage (highest ROI addition)
Top LOs monitor "days in stage" to catch stuck loans. A loan in "Processing" for 14+ days without a milestone is a flag.
- **What to show:** Computed column = `CURRENT_DATE - milestone_created_at` for the current stage
- **Why:** Catches processing delays before they become rate lock issues
- **Implementation:** Can compute from `loan_milestone_events` table without schema change

### 2. Rate Lock Expiry
Currently invisible in LoanOS. For active purchase loans, a rate lock expiring is a $500-3000 cost.
- **What to show:** `lock_expiry_date` on each loan row
- **Current state:** Not in schema — requires Arive sync addition or manual entry
- **Priority:** HIGH — data loss risk if lock expires unnoticed

### 3. Days to Close of Escrow
The contract close date is in LoanOS (`closing_date` on loans table). But it's not surfaced prominently.
- **What to show:** `closing_date` with a countdown ("Closes in 8 days") colored by urgency
- **Color logic:** Green = 15+ days, Yellow = 8-14 days, Red = < 7 days
- **Implementation:** Computed from existing `closing_date` column — no schema change needed

### 4. Last Communication
When was the last email/milestone event fired for this loan?
- **What to show:** Last `milestone_communications.created_at` per loan
- **Why:** Identifies borrowers who haven't been contacted recently
- **Implementation:** JOIN to `milestone_communications` — doable in a single query

### 5. Pending Conditions Status
Is the loan waiting on something from the borrower?
- **What to show:** Open condition count (if Arive exposes this)
- **Current state:** Not in LoanOS — would require Arive webhook addition
- **Priority:** MEDIUM — nice to have post-decommission

---

## Pipeline View Formats: Table vs. Kanban vs. Combined

### Table View (current LoanOS approach)
**Best for:** Seeing many loans at once, sorting by date/amount/status
**Adam's use case:** Morning review — "what's happening today across all 20 active files"
**Recommendation:** KEEP as primary view. Add the missing columns listed above.

### Kanban View (stage-based columns)
**Best for:** Visual workflow tracking, moving loans between stages
**Top LOS example:** SimpleNexus pipeline view — cards by stage with drag-to-advance
**Adam's use case:** When he wants to see "how many loans are in each bucket"
**Recommendation:** Add as a SECONDARY view toggle. Not the default — table is better for Adam's volume.

### Summary Bar (missing from LoanOS)
**Best for:** Quick health check — "how many active files, what's the total pipeline value"
**Example:** "20 active loans | $6.2M in pipeline | 3 closing this week | 2 locked expires < 14 days"
**Recommendation:** Add as a top-of-page banner on the pipeline/loans page

---

## Comparison to Best-in-Class LOS Views

### Encompass (ICE Mortgage Technology)
- **Strengths:** Extremely detailed condition tracking, audit trail, multi-stakeholder views
- **Weaknesses:** Overkill for a 1-person shop. 200+ fields nobody fills out.
- **Borrow:** The concept of "pipeline health" indicators (days in stage, lock expiry countdown)

### SimpleNexus / nCino Mortgage
- **Strengths:** Modern UX, borrower-facing mobile app, clean pipeline Kanban
- **Weaknesses:** Enterprise pricing, not customizable
- **Borrow:** The "closing countdown" widget and stage-column Kanban

### Arive (Adam's current LOS)
- **Strengths:** Clean, fast, great for rate quotes and disclosures
- **Weaknesses:** Limited CRM/pipeline features — designed for origination, not relationship management
- **Borrow:** Nothing — we're replacing its CRM functions with LoanOS

### Byte Software (ICE)
- **Strengths:** Highly configurable pipeline views, great for processors
- **Weaknesses:** Old UI, steep learning curve
- **Borrow:** The concept of "Janie view" (processor-specific pipeline with condition lists)

---

## Specific Recommendations for LoanOS Pipeline

### Priority 1 — No Schema Change Required
These can be built immediately without Supabase migrations:

| Feature | Source | Complexity |
|---------|--------|------------|
| Days to close countdown (color coded) | `loans.closing_date` | Low |
| Last milestone fired | `loan_milestone_events.created_at` | Low |
| Summary bar (active loans, pipeline value, this-week closings) | `loans` table aggregation | Low-Medium |
| Kanban view toggle | `loans.status` | Medium |

### Priority 2 — Schema Addition Required
These need new columns or relationships:

| Feature | Schema Change | Complexity |
|---------|------------|------------|
| Rate lock expiry display | Add `lock_expiry_date date` to `loans` | Low schema, Medium Arive sync |
| Days in current stage | Add `stage_entered_at timestamp` to `loans` | Low schema, requires WF2 update |
| Open conditions count | Add `open_conditions_count int` to `loans` | Requires Arive webhook addition |

### Priority 3 — Post-Decommission
- Janie view (processor filter — only her active files, condition checklist visible)
- Realtor-partner view (per-realtor pipeline summary)
- Loan health score (algorithm: days in stage + lock expiry + condition count)

---

## Recommended Build Sequence

1. **Add summary bar** to loans page — active count, total pipeline value, closings this week
2. **Add days-to-close countdown** — color-coded, uses existing `closing_date` column
3. **Add last-milestone-sent** column — shows communication recency per loan
4. **Add Kanban toggle** — secondary view alongside table
5. **Add `lock_expiry_date`** — schema addition, high priority for active loan management
6. **Add `stage_entered_at`** — enables days-in-stage visibility

Items 1-3 are additive with no schema changes and can be built next session.

---

## Open Questions for Adam

1. **Pipeline page default sort:** By closing date? By stage? By last activity?
2. **"Active" loan definition:** Which statuses count as "active" for the summary bar? (application_received through closing_scheduled, excluding funded?)
3. **Rate lock date:** Is this already in Arive? Does Arive fire a webhook when a lock is set or expires?
4. **Janie view:** Should Janie see the pipeline page at all, or only documents/conditions? (access control question)
5. **Kanban desire:** Has Adam ever wanted a stage-column drag view, or is the table sufficient?

---

## Quality Rating
Research depth: 4/5 (limited by no web search connectivity; working from domain knowledge + live schema context)
Actionability: 5/5 — Priority 1 items are fully spec-ready for next Builder session
