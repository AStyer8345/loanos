# LoanOS Full System Audit — Claude Code Prompt

## Context
You are auditing the LoanOS repo to produce a comprehensive gap analysis. LoanOS is a mortgage operating system built on Next.js 14 + Supabase + n8n, designed for a producing loan officer (Adam Styer, Austin TX) and eventually licensed as SaaS to other loan officers at $97–397/mo.

## Step 0: Read These Files First
1. Read `CONTEXT.md` in the repo root — this is the living project status document
2. Read `tasks/loanos-deep-research.md` — this is the strategic research foundation
3. Read `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` if it exists — this has schema, patterns, code examples
4. Read `.cursor/instructions` if it exists — this has dev rules
5. Scan the full directory tree to understand current file structure

## Step 1: Inventory Everything That Exists
For every page, component, API route, and utility in the repo, document:
- **File path**
- **What it does** (1 sentence)
- **Status**: Working / Partially Working / Broken / Stub / Not Started
- **Dependencies**: What other files/services it depends on
- **Compliance status**: Does it have proper disclaimers, consent checks, audit logging? (see Compliance section below)

Organize the inventory by category:
- Pages (app router pages)
- Components (React components)
- API Routes (app/api/*)
- Utilities / Helpers (lib/*, utils/*)
- Database (Supabase schema, migrations, RLS policies)
- n8n Workflows (if any config files exist)
- Config files (env vars referenced, package.json deps)

## Step 2: Gap Analysis Against Target Architecture

Compare what exists against these 7 modules (in priority order):

### Module 1: Smart CRM (Priority: CRITICAL — build first)
Target features:
- [ ] Contact records: borrowers, realtors, builders, past clients, financial advisors, CPAs, divorce attorneys
- [ ] Pipeline board (Kanban): Lead → Contacted → Pre-Qual → Application → Processing → Underwriting → Conditional → CTC → Funded → Post-Close
- [ ] Drag-and-drop stage transitions that trigger automations
- [ ] Auto last-touch tracking with timestamp + note
- [ ] Contact tagging: credit issue, investor, move-up, first-time buyer, etc.
- [ ] Smart duplicate detection before record creation
- [ ] Activity timeline per contact: calls, emails, texts, tasks in one feed
- [ ] Referral source attribution (dual-level: referral partner + marketing channel)
- [ ] Referral partner tiering: A/B/C with different automation cadences
- [ ] Closed loan history — searchable for refi opportunities
- [ ] Bulk import via CSV (Jungo migration)
- [ ] Arive sync via n8n webhook
- [ ] MISMO 3.4 XML import (drag-and-drop upload → server-side parser → creates/updates loan + contact + fees records in Supabase)
  - Parser extracts: borrower info, property details, loan terms, income, liabilities, closing costs, underwriting data
  - Use `fast-xml-parser` or `xml2js` for Node.js server-side parsing (API route, NOT client-side)
  - Accepts both .xml and .zip (Arive exports both formats)
  - SSN must be masked (store last 4 only) — PII compliance critical
  - Store original MISMO file in Supabase Storage (encrypted at rest)
  - Log to activity_log: "MISMO 3.4 imported — [filename] — [loan number]"
  - This makes LoanOS LOS-agnostic — every LOS exports MISMO 3.4 (Encompass, BytePro, Calyx, LendingPad, Arive)
- [ ] Contact search (fast, full-text)
- [ ] Mobile-responsive pipeline view

For each: mark as ✅ Built / 🟡 Partial / ❌ Missing and note what specifically is done vs. remaining.

### Module 2: Automation Engine (Priority: CRITICAL — build alongside CRM)
Target features:
- [ ] Speed-to-lead: new lead → SMS (30s) + email (60s) + LO push notification (2min) + escalating follow-up sequence
- [ ] Loan milestone notifications: Arive status change → personalized borrower email + realtor update
- [ ] Document collection sequences: Day 0 SMS with upload link → Day 3 email → Day 7 SMS → Day 10 escalation
- [ ] Post-close review request: loan funded → wait 2 days → Google/Zillow review email
- [ ] Referral partner weekly pipeline summaries (auto-generated per realtor)
- [ ] Birthday/housiversary auto-messages
- [ ] Rate monitoring: daily compare current rates vs. past client rates → trigger refi alert when savings meaningful
- [ ] Contract intake: PDF upload → Claude extract → email drafts → Supabase record + Arive checklist
- [ ] Pre-approval email: PDF upload → Claude extract → branded email → Outlook draft
- [ ] Final CD email: PDF upload → Claude extract → populated email → Outlook draft
- [ ] Just Closed social post: borrower/house photo + branding + realtor tag → Instagram + LinkedIn + Facebook
- [ ] Testimonial weekly post: pull from Google Sheet → Gemini image → multi-platform post
- [ ] All automation fires logged to `automation_logs` table with full audit trail

### Module 3: Marketing Command Center (Priority: HIGH — migrate from Netlify)
Target features:
- [ ] Weekly cadence dashboard: Mon=Realtors, Tue=Leads, Wed=LIP, Thu=Pre-Approvals, Fri=Blast
- [ ] Email campaign builder with saved HTML templates
- [ ] Mailchimp sync via n8n
- [ ] Rate update publisher: Claude generates content → website page + Mailchimp teaser
- [ ] Newsletter generator (borrower + realtor versions)
- [ ] Social poster: LinkedIn + Facebook (currently live on Netlify)
- [ ] Call list panels segmented by contact group
- [ ] Campaign analytics: opens, clicks, replies per segment
- [ ] AI draft generator: paste topic → Claude API → email copy
- [ ] Google Ads creative automation: Claude drafts headline/description variants

### Module 4: LO Toolkit / Mortgage Coach Replacement (Priority: HIGH)
Target features:
- [ ] Loan Scenario Comparator — side-by-side rate/term/down payment comparison
- [ ] Refi Analyzer — current vs. new loan, break-even, lifetime savings
- [ ] Rent vs. Buy — PITI vs rent, opportunity cost, break-even
- [ ] Total Cost of Homeownership — 5yr/10yr with taxes, insurance, PMI, appreciation
- [ ] Max Purchase Price — back into price from income/debt/target payment
- [ ] Buy Now vs. Wait — cost of waiting 6-12 months
- [ ] Claude API narrative summary for every scenario
- [ ] Branded PDF output (Puppeteer or @react-pdf/renderer)
- [ ] Shareable link per scenario
- [ ] Integration with Supabase loan records
- [ ] V1: Manual rate/pricing input (LO types in rate, fees, loan terms — NO expensive pricing engine API)
- [ ] V1.5: Auto-populate from existing Supabase loan record (if synced from Arive webhook or MISMO import)
- [ ] V2 (future): Pricing engine API integration (Optimal Blue / Polly / BankingBridge) — only after beta proves demand, as add-on for Pro/Enterprise tier
- [ ] MISMO 3.4 import as data source for scenario builder — upload MISMO file, all fields auto-populate, LO reviews and clicks generate

### Module 5: Lead Funnels (Priority: MEDIUM)
Target features:
- [ ] First-time homebuyer resource hub / landing page
- [ ] Pre-approval landing page with form → Supabase CRM auto-creation → speed-to-lead trigger
- [ ] Rate alert signup: prospect info → weekly rate email
- [ ] Realtor co-branded landing page generator
- [ ] Mortgage calculator widget (embeddable for realtors)
- [ ] UTM tracking on all form submissions
- [ ] Lead scoring: auto-assign hot/warm/cold based on engagement

### Module 6: Market Intelligence (Priority: MEDIUM)
Target features:
- [ ] Rate feed (FRED API or Optimal Blue)
- [ ] Fed meeting calendar with rate decision tracker
- [ ] Weekly market summary auto-generated by Claude
- [ ] Local market data by zip code
- [ ] One-click publish to website + email list

### Module 7: Multi-Tenant / SaaS Infrastructure (Priority: LATER — but schema prep NOW)
Target features:
- [ ] `org_id` column on every table with RLS policies
- [ ] `organizations` table with tenant metadata + Stripe customer ID
- [ ] `org_members` join table with roles (owner/admin/member)
- [ ] `SECURITY DEFINER` helper function `get_user_org_ids()`
- [ ] Supabase Auth with magic link
- [ ] Stripe Checkout + Billing Portal
- [ ] Basic onboarding wizard

## Step 3: Compliance Audit (CRITICAL — Bake Into Everything)

Check every existing feature for these compliance requirements:

### TCPA / CAN-SPAM (Every Email + SMS)
- [ ] Every automated email has physical mailing address in footer
- [ ] Every automated email has one-click unsubscribe link
- [ ] `consent_status` field exists on contacts table and is checked before any automated send
- [ ] No automated SMS sent before 8am or after 9pm recipient's local time
- [ ] SMS opt-out ("STOP") handling exists
- [ ] Consent is logged with timestamp and source

### Fair Lending / ECOA (AI Outputs)
- [ ] AI scenario builder does NOT factor in or reference protected classes (race, religion, sex, national origin, etc.)
- [ ] Credit action plan tool includes disclaimer: "This is educational guidance, not credit repair advice"
- [ ] Underwriting guidelines AI includes disclaimer: "Consult your lender for official guideline interpretation"
- [ ] No AI output makes lending decisions — all outputs are informational/educational

### RESPA (Referral Partner Features)
- [ ] Co-branded marketing materials include proper disclosure
- [ ] No feature enables or suggests kickbacks/referral fees to realtors
- [ ] Builder preferred lender features don't imply exclusivity requirements

### Data Privacy (PII Handling)
- [ ] Supabase RLS policies exist on ALL tables containing borrower data
- [ ] No borrower PII exposed in client-side console logs or error messages
- [ ] File uploads (contracts, CDs, pre-approvals) stored in Supabase Storage with proper access policies
- [ ] Terms of Service / Privacy Policy page exists (even placeholder)
- [ ] Data deletion capability exists or is planned (CCPA/GDPR readiness)

### AI Governance (Freddie Mac Mandate)
- [ ] AI tools inventory document exists (which features use Claude API, what they do)
- [ ] Every AI-generated output has a disclaimer appended — not optional, not toggleable
- [ ] AI interactions are logged to activity_log with: timestamp, input summary, output summary, loan_id/contact_id
- [ ] Human review step exists before AI output reaches a borrower (e.g., draft → review → send, not auto-send)

### Audit Trail
- [ ] `activity_log` table exists with: id, org_id, contact_id, loan_id, action_type, description, metadata (JSON), created_at, created_by
- [ ] Every automation writes to activity_log
- [ ] Every manual action (email sent, note added, stage changed) writes to activity_log
- [ ] Logs are immutable (no UPDATE or DELETE permissions for non-admin roles)

## Step 4: Database Schema Review

Pull the current Supabase schema (if migrations exist) or infer from code. Document:
- All existing tables, their columns, and relationships
- Missing tables needed for target architecture
- RLS policies that exist vs. need to be created
- Indexes that should exist for performance (especially on `org_id` composite indexes)
- Whether `org_id` column exists on tables (multi-tenant prep)

## Step 5: Environment & Infrastructure Check

- [ ] `supabase link` connected? (project ref: `uuqedsvjlkeszrbwzizl`)
- [ ] All required env vars documented and present in `.env.local`?
- [ ] Vercel deployment working? Last successful deploy?
- [ ] n8n instance accessible? What workflows exist?
- [ ] Netlify (styer-mortgage-site) — what's still running there that hasn't been migrated?
- [ ] Microsoft Graph / Outlook auth status — is Azure access working?

## Step 6: Output

Write the complete audit to: `tasks/audit-reports/full-audit-2026-03-15.md`

Structure the output as:

```
# LoanOS Full Audit — March 15, 2026

## Executive Summary
(3-5 sentences: what's the real state of the project, what's the biggest risk, what should be built next)

## File Inventory
(Every file, organized by category, with status)

## Module Gap Analysis
(For each of the 7 modules: what's built, what's partial, what's missing)

## Compliance Gaps
(Every compliance item that's missing or incomplete, ranked by risk)

## Database Schema Status
(Current vs. target, with specific migration needs)

## Infrastructure Status
(What's connected, what's broken, what's blocked)

## Recommended Sprint Sequence
(Based on the audit: what gets built first, second, third — one feature at a time, fully shipped)

## Estimated Timeline to Beta
(Realistic timeline to get 5-10 LOs using the platform, with compliance baked in)
```

## Rules
- Be brutally honest. If something is broken, say it's broken.
- If you can't access something (Supabase, n8n, Vercel), note it as "unable to verify" — don't guess.
- Don't fix anything during the audit. Just document.
- If the repo has diverged from CONTEXT.md, trust the repo — CONTEXT.md may be stale.
- Flag any features that are built to 70% but not shippable — these are the ones that need to be finished or cut.
- Every recommendation must pass the filter: does it eliminate a non-revenue task or surface a revenue opportunity?
