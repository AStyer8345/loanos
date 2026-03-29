# Realtor Relationship System — Research Report
**Date:** 2026-03-28
**Author:** CRM Research Subagent
**Scope:** Audit existing LoanOS realtor data, research best-in-class LO-realtor CRM practices, produce concrete build recommendations.

---

## 1. Current State Audit

### 1.1 Realtor Contact Volume

Total realtor records: **1,060** (contacts where `contact_type = 'realtor'`)

### 1.2 Tier / Stage Distribution

| production_tier | realtor_stage | Count | % of total |
|-----------------|---------------|-------|-----------|
| NULL (untiered) | NULL | 943 | 89.0% |
| A | NULL | 111 | 10.5% |
| B | NULL | 6 | 0.6% |

`realtor_stage` is NULL for every single realtor record — the column exists but has never been populated.

Legacy boolean flags (`top_realtor`, `target_realtor`) are still present in the schema alongside `production_tier`. The overlap:
- `top_realtor = true` + `target_realtor = false` + tier A: 79 records
- `top_realtor = true` + `target_realtor = true` + tier A: 32 records
- `top_realtor = false` + `target_realtor = true` + tier B: 6 records
- All others (no flags, no tier): 943 records

**The schema is mid-migration.** Old boolean flags still exist, new `production_tier` text field has been added, but the two systems have never been reconciled and `realtor_stage` was never put into use.

### 1.3 Field Population Health

| Field | Populated | % |
|-------|-----------|---|
| email | 1,060 / 1,060 | 100% |
| phone | 1,035 / 1,060 | 97.6% |
| birthdate | 668 / 1,060 | 63.0% |
| company_name | 344 / 1,060 | 32.5% |
| production_tier | 117 / 1,060 | 11.0% |
| last_touch_at | 15 / 1,060 | 1.4% |
| realtor_stage | 0 / 1,060 | 0% |
| salesforce_id | 0 / 1,060 | 0% |

**Critical gaps:**
- `last_touch_at` is populated on only 15 of 1,060 realtors. There is no reliable "when did I last contact this person" signal in the system.
- `company_name` is missing on 716 records (67.5%). Broker affiliation is essential for co-marketing, event targeting, and brokerage-level relationship analysis.
- `realtor_stage` has never been used. No record of where any realtor is in the relationship lifecycle.

### 1.4 Referral Volume Data

**`referred_by` column type problem:** The `referred_by` field on the `contacts` table is `text` and stores plain names (e.g., "Crystal Kilpatrick"), not UUIDs. This means referral attribution cannot be joined to realtor contact records via SQL foreign key. It is a data integrity problem that must be resolved.

**Top referrers from `referred_by` text values (borrowers only):**

| Name | Referrals Sent |
|------|---------------|
| Crystal Kilpatrick | 53 |
| Sean Waeiss | 10 |
| Sam Archer | 7 |
| John Dunham | 5 |
| Jo Vincent | 5 |
| Albert Allen | 5 |
| Carson Haney | 4 |
| Kristee Leonard | 3 |
| Brian Esway | 3 |
| Kelly Hover | 2 |
| Christina Parker | 2 |

Crystal Kilpatrick has sent 53 referrals — nearly 5x the second-highest producer — and appears to have no `production_tier` assigned (name not matching a tiered record). This is the highest-value relationship in the database and it is not being managed or tracked in any automated way.

### 1.5 Loan-Level Realtor Linkage

The `loans` table has `buyer_agent_contact_id` (uuid) and `listing_agent_contact_id` (uuid) — proper foreign keys to `contacts`. However, they are sparsely populated:

| Field | Populated |
|-------|-----------|
| buyer_agent_contact_id | 30 / 854 loans (3.5%) |
| listing_agent_contact_id | 5 / 854 loans (0.6%) |
| buyer_agent_name (text) | 406 / 854 loans (47.5%) |
| listing_agent_name (text) | 126 / 854 loans (14.7%) |
| referring_agent_name (text) | 30 / 854 loans |

The structured IDs exist for only 35 loans combined. The other 532 loans with agent name text have no linked realtor contact. This means the primary mechanism for measuring which realtors generate closed business is broken for ~94% of the loan history.

**Realtors with confirmed closed deals** (via `buyer_agent_contact_id` / `listing_agent_contact_id`):

| Name | Tier | Total Deals | Last Closing |
|------|------|-------------|-------------|
| Paul Jennings | B | 5 | 2026-03-01 |
| Vanessa Torres | A | 4 | 2026-03-31 |
| Kim Nakamura | A | 3 | 2026-03-31 |
| Derek Osei | B | 3 | 2026-03-06 |
| Greg Stafford | B | 3 | 2026-02-25 |
| Blake Hood | A | 2 | 2026-03-30 |
| Thomas Everett | A | 2 | — |
| Christina Parker | (none) | 2 | 2026-05-04 |

---

## 2. Best-in-Class LO-Realtor CRM Practices

Research from industry sources (iJungo, Homebot, BankingBridge, MortgageMaker, Surefire CRM) identifies these patterns among top-producing loan officers:

### 2.1 Tiered Outreach Cadence

Top LOs maintain a differentiated cadence by relationship value:

- **A-tier partners (top producers):** Weekly or bi-weekly contact. Mix of phone calls, texts, deal updates, co-marketing collaboration, and in-person meetings. These realtors are treated as business partners, not contacts.
- **B-tier partners (active but lower volume):** Monthly touchpoint. Rate updates, market data, periodic check-ins.
- **C-tier / prospect realtors:** Quarterly or event-driven. Market updates, educational content, building awareness.
- **New/unworked contacts:** 5-7 touch nurture sequence over 60-90 days to qualify and move to an active tier.

### 2.2 Referral Tracking and Pipeline Transparency

The single highest-ROI feature for realtor relationships: **sending realtors pipeline status updates on their clients' loans.** Realtors who feel in the loop on their buyers' transactions refer more and faster. Best practices:
- Automated milestone emails to the agent when their buyer hits Application, Approval, CTC, and Closing
- Weekly pipeline summary if the agent has multiple active deals
- Referral scorecards showing YTD referrals and closed loans — realtors like knowing their production data

### 2.3 Co-Marketing

96% of top originators cite realtor agents as their primary referral source. Co-marketing amplifies both parties:
- Co-branded buyer guides, rate flyers, social posts
- Joint open house support (pre-approval flyers, QR codes to loan app)
- Co-branded market update emails sent to the realtor's sphere
- All co-marketing should be tracked for RESPA compliance (cost splits, documentation)

### 2.4 Recognition and Appreciation Touchpoints

- Referral thank-you within 24 hours of receiving a referral
- Milestone celebrations: first referral, 5th referral, 10th referral
- Annual recognition: "Top Partner" acknowledgment
- Birthday and work anniversary touches (high open rates, personal)
- Closing gift or card when a mutual deal closes

### 2.5 Top-of-Mind Content

- Weekly or biweekly rate update with market commentary (short, useful)
- Monthly market data for their farm area (avg price, days on market, absorption rate)
- Homebuyer education content they can share with their leads
- Social proof: closed deal announcements they can share or tag

### 2.6 Compliance Note

Co-marketing arrangements must be documented and must reflect fair market value exchanges under RESPA Section 8. LoanOS should track `co_marketing_sent_count` and co-marketing cost split per realtor.

---

## 3. LoanOS Gap Analysis

### 3.1 Schema Gaps

| Gap | Impact |
|-----|--------|
| `referred_by` is text (not UUID FK) | Cannot join referral volume to realtor records. Crystal Kilpatrick's 53 referrals are invisible to any query. |
| No `last_referral_date` field | No way to identify realtors who have gone quiet |
| No `referral_ytd_count` or `referral_lifetime_count` | No scorecarding or tier promotion triggers |
| No `last_deal_closed_date` | Cannot identify realtors with closed production vs. referrals that didn't convert |
| No `last_outreach_date` or `last_outreach_channel` | `last_touch_at` is populated on 1.4% of records — effectively unusable |
| No `preferred_contact_method` | All outreach defaults to email; some realtors respond only to text or calls |
| No `co_marketing_active` flag | No way to segment realtors enrolled in co-marketing vs. not |
| No `co_marketing_sent_count` | No RESPA compliance tracking, no ROI measurement |
| `realtor_stage` column exists but is 100% NULL | Relationship lifecycle is untracked |
| `company_name` missing on 67.5% of records | Cannot do brokerage-level analysis or targeting |
| Legacy `top_realtor`/`target_realtor` booleans still exist | Schema duplication, confusing alongside `production_tier` |

### 3.2 Loan Linkage Gaps

| Gap | Impact |
|-----|--------|
| `buyer_agent_contact_id` populated on only 3.5% of loans | 406 loans with a buyer agent name text have no linked realtor record |
| `loans.referring_agent_name` text field not linked to contacts | 30 loans have a referring agent name with no UUID linkage |
| No `realtor_id` field on loans (dedicated referral source FK) | Conflates "agent on the deal" with "person who sent the referral" |

### 3.3 Automation Gaps

Zero automated touchpoints exist for any of the 1,060 realtor contacts. Specific missing automations:
- No referral thank-you message
- No pipeline milestone update to the realtor on their client's loan
- No rate update drip
- No birthday or anniversary touch
- No referral milestone celebration
- No re-engagement sequence for realtors who have gone quiet
- No welcome sequence for newly added realtors

### 3.4 Smart List / View Gaps

Current smart lists cover broad categories (All Realtors, Top Realtors, Target Realtors). Missing operational views:
- No "Realtors due for outreach" list
- No "Top producers last 90 days" list
- No "Realtors who have referred but never had a deal close" list
- No "New realtors added in last 30 days" list
- No "Realtors with open deals right now" list (linked via loans)

---

## 4. Recommended Schema Additions

All additions to the `contacts` table. Add via `apply_migration`.

```sql
-- Referral performance fields
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referral_ytd_count integer DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referral_lifetime_count integer DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_referral_date date;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_deal_closed_date date;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deals_ytd_count integer DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS deals_lifetime_count integer DEFAULT 0;

-- Outreach tracking
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_outreach_date date;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_outreach_channel text; -- 'email', 'text', 'call', 'in_person'
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred_contact_method text; -- 'email', 'text', 'call'
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS outreach_cadence text; -- 'weekly', 'monthly', 'quarterly'

-- Co-marketing tracking
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS co_marketing_active boolean DEFAULT false;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS co_marketing_sent_count integer DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS co_marketing_last_sent_at date;

-- Relationship lifecycle
-- realtor_stage already exists but is unpopulated; define valid values:
-- 'prospect', 'new_partner', 'active_partner', 'dormant', 'churned'

-- Data quality
-- company_name already exists — focus on backfill, not new column
-- referral_source_notes text field for freeform referral context
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referral_source_notes text;
```

**`referred_by` fix (separate migration, requires data work):**
```sql
-- Add a proper UUID foreign key alongside the text field
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS referred_by_contact_id uuid REFERENCES contacts(id);
-- Then run a one-time backfill matching referred_by text to contact names
-- Then deprecate the text field once backfill is verified
```

**Loans table addition:**
```sql
-- Dedicated referral source FK (separate from buyer/listing agent)
ALTER TABLE loans ADD COLUMN IF NOT EXISTS referral_contact_id uuid REFERENCES contacts(id);
```

---

## 5. Recommended Smart Lists

These are filterable views in the LoanOS CRM, defined as saved filter sets on the contacts table.

| Smart List | Filter Logic | Purpose |
|------------|-------------|---------|
| **Top Producers Last 90 Days** | `contact_type = 'realtor'` AND `last_referral_date >= NOW() - 90 days` AND `referral_ytd_count >= 2` | Identify currently active referrers for A-tier treatment |
| **Realtors Due for Outreach (60+ days)** | `contact_type = 'realtor'` AND `last_outreach_date < NOW() - 60 days` OR `last_outreach_date IS NULL` | Re-engagement queue |
| **New Realtors — Never Referred** | `contact_type = 'realtor'` AND `referral_lifetime_count = 0` AND `created_at >= NOW() - 90 days` | New partner nurture sequence candidates |
| **Dormant Partners (Referred Before, Quiet Now)** | `contact_type = 'realtor'` AND `referral_lifetime_count > 0` AND `last_referral_date < NOW() - 180 days` | Win-back targets |
| **Active Deal Realtors** | `contact_type = 'realtor'` AND `id IN (SELECT buyer_agent_contact_id OR listing_agent_contact_id FROM loans WHERE status NOT IN ('Closed', 'Cancelled', 'Denied'))` | Who has skin in the game right now — highest-priority contacts |
| **Tier A — Missing Outreach This Month** | `production_tier = 'A'` AND `last_outreach_date < DATE_TRUNC('month', NOW())` | Prevents A-tier partners from slipping through the cracks |
| **Realtors Missing Company Name** | `contact_type = 'realtor'` AND `company_name IS NULL` | Data quality cleanup queue |
| **High Referrers — No Production Tier** | `contact_type = 'realtor'` AND `referral_lifetime_count >= 3` AND `production_tier IS NULL` | Candidates for tier assignment — Crystal Kilpatrick (53 referrals) is the top example |

---

## 6. Recommended Automations (n8n Workflows)

These are net-new n8n workflows to build. None exist today. Listed in priority order.

### WF-R1: Referral Thank-You (Priority: Immediate)

**Trigger:** Webhook from LoanOS when a new borrower contact is created with `referred_by` set
**Logic:**
1. Look up the realtor by name match on `contacts` (or by `referred_by_contact_id` once the FK is added)
2. Send a personalized email/text to the realtor: "Just wanted to let you know [First Name] reached out — I'll take great care of them."
3. Log the touch to `activity_log` with `activity_type = 'referral_thank_you'`
4. Update `last_outreach_date` on the realtor contact

**Timing:** Within 1 hour of referral receipt
**Channel:** Text (preferred for speed), Email as fallback

---

### WF-R2: Loan Milestone Update to Realtor (Priority: High)

**Trigger:** Existing n8n workflow `LoanOS — Arive Status Update → Supabase` (ID: `9JyzzwKac8v3uQ7d`) hits Supabase — extend or add a downstream step
**Logic:**
1. On milestone change (Application → Approved → CTC → Closed), check if loan has `buyer_agent_contact_id` or `listing_agent_contact_id`
2. If yes, send milestone email to the linked realtor
3. Milestones to notify: Approved, CTC, Closing Scheduled, Funded

**Note:** This requires `buyer_agent_contact_id` to be populated, which is currently only 3.5% of loans. The backfill and data entry improvement needs to happen in parallel.

---

### WF-R3: Rate Update Drip to Realtors (Priority: High)

**Trigger:** Manual trigger or scheduled weekly (Monday morning)
**Logic:**
1. Query all realtors where `email_opt_out = false`
2. Segment by tier: A-tier gets a personal-feel email from Adam; B/C-tier gets a cleaner broadcast version
3. Send via Outlook (same pattern as existing WF workflows)
4. Log send count; increment `co_marketing_sent_count` if applicable

**Note:** The existing "send-rate-update" skill handles website + content generation. This workflow specifically handles the realtor email segment as a separate send from borrower/general lists.

---

### WF-R4: Referral Milestone Celebration (Priority: Medium)

**Trigger:** Scheduled daily check OR triggered when `referral_lifetime_count` is updated
**Logic:**
- On 1st referral: send welcome-to-partnership email/text
- On 5th referral: send a personal note + small recognition (e.g., Starbucks gift card mention)
- On 10th referral: send a "Top Partner" acknowledgment + offer co-marketing

**Implementation note:** Until `referred_by_contact_id` FK is fixed, this workflow needs to match on text name. Build it to be FK-ready.

---

### WF-R5: 60-Day Re-Engagement (Priority: Medium)

**Trigger:** Scheduled daily — query `contacts` for realtors where `last_outreach_date < NOW() - 60 days` AND `referral_lifetime_count > 0`
**Logic:**
1. Pull the list
2. For A-tier: queue a call reminder task in LoanOS (or send Adam a summary text/email)
3. For B-tier: auto-send a "checking in" email with current market stats
4. Update `last_outreach_date`

---

### WF-R6: Birthday Touch (Priority: Medium)

**Trigger:** Scheduled daily — query realtors where `birthdate` month/day matches today
**Logic:**
1. 668 of 1,060 realtors (63%) have a birthdate — meaningful coverage
2. Send a short personal birthday text (not a generic email blast)
3. Log to `activity_log`

**Existing pattern:** Similar to the borrower birthday logic if it exists. Check for a model in the existing 15 active workflows.

---

### WF-R7: New Realtor Welcome Sequence (Priority: Medium)

**Trigger:** New contact created with `contact_type = 'realtor'`
**Logic:** 5-step drip over 30 days using existing `drip_campaigns`/`drip_steps`/`drip_enrollments` infrastructure:
- Day 0: "Great connecting with you" intro email
- Day 3: One-page buyer guide or rate sheet
- Day 7: How I work / what your buyers can expect
- Day 14: A recent success story or testimonial
- Day 30: Check-in / coffee invite

**Note:** The drip infrastructure already exists in Supabase. This workflow just needs a campaign record and enrollment trigger.

---

### WF-R8: Post-Close Realtor Thank-You (Priority: Low-Medium)

**Trigger:** Loan milestone changes to "Funded" or `closing_date` is set
**Logic:**
1. Check `buyer_agent_contact_id` or `listing_agent_contact_id` on the loan
2. Send a personalized thank-you to the realtor: "We closed [Borrower First Name] — thank you for trusting me with your client."
3. Optionally: send a co-branded social post template they can use to announce the closing
4. Log as a referral appreciation touch

---

## 7. Open Questions

These are decisions Adam needs to make before building can proceed:

**Data integrity:**
1. **`referred_by` FK migration** — Do you want to run a backfill to link the 53+ Crystal Kilpatrick referrals (and others) to realtor contact IDs? This requires a one-time SQL script + manual review for name ambiguity. Scope: ~1-2 hours of work.
2. **Loan-realtor linkage** — For the 406 loans with `buyer_agent_name` text but no `buyer_agent_contact_id`, do you want to attempt an automated match? Same risk: name collisions.

**Schema cleanup:**
3. **Legacy boolean flags** — `top_realtor` and `target_realtor` columns are still on the schema alongside `production_tier`. Drop them or keep them as a read-only legacy reference?
4. **`realtor_stage` values** — The column exists but is empty. Define the stages: recommend `prospect → new_partner → active_partner → dormant → churned`. Who owns updating this — manual by Adam, or automated based on activity triggers?

**Automation channels:**
5. **Text vs. email for realtor outreach** — WF-R1 (referral thank-you) and WF-R6 (birthday) are more effective as texts. Do you have an n8n-connected SMS sender (Twilio, etc.) or should these default to Outlook email?
6. **Rate update realtor list** — Should the weekly rate update go to all 1,060 realtors (with opt-out), or only to tiered realtors (117), or only to realtors who have ever referred?

**Tier management:**
7. **Tier assignment process** — 943 of 1,060 realtors have no tier. Recommend an automated rule: any realtor with `referral_lifetime_count >= 3` auto-qualifies for Tier A. Do you want to implement this as a nightly job, or keep tier assignment manual?
8. **Crystal Kilpatrick** — 53 referrals and no tier assigned. Is this person in the realtor database under a different name, or genuinely untiered? This needs manual review before automation is built.

**Co-marketing:**
9. **RESPA documentation** — Do you want LoanOS to track co-marketing cost splits and documentation, or handle that separately? If in LoanOS, the `co_marketing_active`, `co_marketing_sent_count` fields need a companion UI and document storage hook.

---

## Appendix: Key IDs Referenced

| Entity | ID / Key |
|--------|---------|
| Supabase project | `uuqedsvjlkeszrbwzizl` |
| n8n Arive Status Update workflow | `9JyzzwKac8v3uQ7d` |
| n8n New Application Received | `cWESnXXy9UOLB13q` |
| n8n Drip Email Scheduler | `LqBb3YDLjS2eUrDE` |
| Top realtor by referred_by volume | Crystal Kilpatrick (53 referrals, no UUID link) |
| Top realtor by closed deals (loan FK) | Paul Jennings (5 deals, tier B) |
| Tier A with most confirmed deals | Vanessa Torres (4 deals), Kim Nakamura (3 deals) |

---

## Adam's Answers — 2026-03-28

| # | Question | Answer |
|---|----------|--------|
| 5 | referred_by fix | Add UUID FK column (keep text column, add new `referred_by_contact_id uuid FK`) |
| 6 | Schema cleanup — deprecate booleans? | Yes — production_tier is the canonical system; deprecate `top_realtor`/`target_realtor` |
| 7 | last_touch_at auto-update | Yes — auto-update when n8n sends |
| 8 | Crystal Kilpatrick tier | Yes — assign to production_tier A |
| 9 | Outreach cadence | A-tier weekly, B-tier monthly, everyone else monthly |
| 10 | Co-marketing tracking | No — skip co_marketing_sent_count and co_marketing_active |
| 11 | Preferred contact method field | Skip |

**Status:** All 7 realtor questions answered. Builder can proceed.
