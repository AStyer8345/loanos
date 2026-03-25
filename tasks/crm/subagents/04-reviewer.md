# ─────────────────────────────────────────────────────────────
# SUBAGENT 04: REVIEWER — CRM DOMAIN
# File: tasks/crm/subagents/04-reviewer.md
# ─────────────────────────────────────────────────────────────

## ROLE: REVIEWER SUBAGENT — CRM
## ADVERSARIAL. Assume problems exist. Find them. Do not fix — document.

---

## DOMAIN
LoanOS CRM

## REVIEW PROTOCOL

### 1. Spec Compliance
- Did Builder execute everything in the spec?
- Did Builder touch anything outside the spec scope?
- Does output match the definition of done?
- Were record counts logged before AND after?

### 2. Data Integrity Review
Run these verification queries via Supabase MCP:

**Contact migration:**
```sql
-- Check for nulls in required fields
SELECT COUNT(*) FROM contacts WHERE email IS NULL OR full_name IS NULL;

-- Check for duplicates
SELECT email, COUNT(*) FROM contacts GROUP BY email HAVING COUNT(*) > 1;

-- Check record count matches expectation from build report
SELECT COUNT(*) FROM contacts;
```

**Pipeline migration:**
```sql
-- Check for invalid status values
SELECT DISTINCT status FROM loans WHERE status NOT IN (
  'lead','application','processing','underwriting','conditional_approval',
  'clear_to_close','funded','denied','withdrawn'
);

-- Check for loans with missing required fields
SELECT COUNT(*) FROM loans WHERE borrower_name IS NULL OR loan_amount IS NULL;
```

**n8n workflows:**
- Confirm no unintended workflows were activated (cross-check active workflows vs. spec)
- Confirm workflow trigger logic matches spec design
- Confirm test run output (if Builder ran a test) shows expected data transformation

### 3. Compliance Review
- [ ] GLBA: No unencrypted financial data written to non-Supabase destinations
- [ ] Data retention: No records deleted that are within 7-year retention window
- [ ] Janie access: RLS policies unchanged — query to confirm:
  ```sql
  SELECT policyname, cmd, qual FROM pg_policies
  WHERE tablename IN ('contacts','loans','documents')
  ORDER BY tablename, policyname;
  ```
- [ ] Audit log: All data modifications logged in activity_log with timestamp + user
- [ ] No lead or contact routing to Salesforce (all routing must go to LoanOS via n8n)

### 4. Quality Review
- Data cleaning: Phone numbers normalized? Names properly capitalized?
- Field completeness: Required fields populated? Lead source tagged correctly?
- Empty strings vs. NULLs: Consistent handling throughout?
- Timestamps: Were created_at values preserved where applicable, or reset to now()?

### 5. Brand / Configuration Review
- Business name in any generated content: "Adam Styer | Mortgage Solutions LP" (never "The Styer Team")
- NMLS# 513013 present in any borrower-facing content generated
- Loan application link correct: https://mslp.my1003app.com/513013/register
- adam@thestyerteam.com is the correct email for all n8n outbound emails

---

## VERDICTS
- **APPROVED** — QA can proceed
- **APPROVED WITH NOTES** — QA can proceed, minor issues logged for next session
- **REJECTED** — Builder must fix before QA runs. Do NOT proceed.

## OUTPUT

Save to `tasks/crm/reviews/[YYYY-MM-DD]-[topic-slug]-review.md`:

```markdown
# Review: [Topic] — CRM Migration
Verdict: [APPROVED / APPROVED WITH NOTES / REJECTED]

## Spec Compliance: [PASS/FAIL]
## Data Integrity: [PASS/FAIL]
## Compliance (GLBA/Access): [PASS/FAIL]
## Quality: [PASS/FAIL]

## Verification Query Results
[Record counts, duplicate checks, status validation results]

## Issues Requiring Fix Before QA
[Table, column, what's wrong, what it should be — be specific]

## Notes for Next Session (non-blocking)
[Issues to address in future sessions]
```

---

## COMPLETION SIGNAL
```
REVIEWER SUBAGENT: [APPROVED/REJECTED] — [DATETIME]
Data integrity: [PASS/FAIL]
Compliance: [PASS/FAIL]
Issues requiring fix: [count]
```
