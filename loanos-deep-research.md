# LoanOS Deep Research — March 2026

## Purpose
This document is the strategic research foundation for the LoanOS rebuild. Every build session should reference this for architectural decisions, feature prioritization, and competitive context.

---

## Competitive Intelligence: Mortgage CRM Landscape

### Key Competitors & Pricing
- **Jungo**: $96–125/mo + Salesforce licensing. Good referral partner tracking (Reffinity). Bad: Salesforce dependency, limited API, painful for solo LOs.
- **BNTouch**: $165/mo. Best post-close automation (15-year drip campaigns). Bad: dated UI, 5K contact cap on lower tiers.
- **Shape Software**: $119/user/mo. AI lead scoring, built-in dialer, LOS integrations. Built for internet lead teams, not relationship LOs.
- **Total Expert**: $100–165/mo. Enterprise marketing platform. Requires multi-user minimums.
- **Surefire (ICE)**: Enterprise. Tied to Encompass ecosystem. Not viable for independent brokers.
- **GoHighLevel**: $97–297/mo. Good automation, no mortgage-specific features. Heavy customization needed.
- **Mortgage Coach (TrustEngine)**: $150/mo. Clunky 10+ screen workflow. Market standard for scenario presentations.

### The Gap LoanOS Fills
No incumbent is AI-native, mobile-first, and built for producing solo LOs at $97–397/mo that replaces the entire tech stack. Every competitor bolts AI onto legacy architecture.

### What LOs Actually Pay Monthly (Full Stack)
CRM ($100–165) + Mortgage Coach ($150) + Lead Gen ($50–200) + Automation ($50–100) + Texting ($25–50) = **$375–665/mo total**. LoanOS at $197 replaces 3-4 of these.

---

## CRM Best Practices for Loan Officers

### What Top Producers Actually Use (Top 5 Features by Adoption)
1. **Visual pipeline boards** — opened first every day, sorted by "needs attention"
2. **Automated milestone communications** — borrower + realtor updates without manual work
3. **Speed-to-lead automation** — leads contacted within 5 min convert 21x more than 30-min contacts
4. **Click-to-call/text from contact record** — eliminates friction for 40+ daily calls
5. **Referral partner reporting** — automated weekly pipeline summaries to realtors

### What Gets Ignored
Complex campaign builders, advanced reporting dashboards, social posting tools, deep customization. LOs use pre-built templates or nothing.

### The Stickiness Factor
LOS integration that eliminates double-entry is the #1 adoption driver. When Arive status changes auto-update the CRM pipeline, trigger notifications, and send realtor updates — the CRM becomes invisible infrastructure.

### North Star Metric
How fast can an LO answer "what needs my attention right now?" If > 30 seconds, the UI has failed.

---

## Pipeline Architecture

### 10-Stage Model (Each Stage = Automation Trigger)
Lead → Contacted → Pre-Qualification → Application → Processing → Underwriting → Conditional Approval → Clear to Close → Funded → Post-Close/Past Client

### Stage Rules
- Each stage has a maximum dwell time before alerts fire
- Stale-deal monitoring: loans that stop moving = #1 revenue killer
- Stage transitions trigger: borrower notification, realtor update, activity log, task creation

### Contact Segmentation (Two Dimensions)

**Contact Types:**
- Active Borrowers (in pipeline)
- Past Clients (sub-segmented by loan type, close date, current rate for refi monitoring)
- Prospects (not yet applied)
- Referral Partners (separate sub-taxonomy below)

**Referral Partner Types:**
- Realtors (A/B/C tier by referral volume + conversion quality)
- Financial Advisors
- CPAs
- Builders
- Divorce Attorneys
- Title/Escrow Contacts
- Insurance Agents

### Referral Attribution (Dual-Level)
- **Referral Partner Field** → links to business contact record, triggers partner portal, feeds automated reports
- **Referral Source Field** → captures marketing channel (Zillow, website SEO, past client referral, open house)
- Both needed: a lead can come through Realtor Jane Smith (partner) who found borrower via co-branded Instagram ad (source = social media)

---

## Lead Sources Ranked by ROI

### Critical Stat: 87% of funded business comes from referrals + past clients

### 1. Realtor Referrals (Highest ROI)
- 77% of agents have ONE preferred lender
- 76% of borrowers choose LO based on agent recommendation
- Agents want: speed, communication, creative solutions
- Focus on 10–15 "power partners" vs. spreading across 50
- A-tier: real-time updates, co-branded materials, quarterly in-person check-ins
- B-tier: weekly batch updates
- C-tier: monthly newsletters

### 2. Past Clients (Lowest Cost)
- 72% of borrowers NEVER hear from their LO after closing
- Post-close sequence: Day 2 review request → Day 14 referral ask → Month 3 check-in call → Month 6 market update → Month 12 annual review + housiversary
- Monthly home value/equity digests get 30% engagement (10–30x generic email)
- Refi monitoring: trigger personalized alert when savings cross meaningful threshold

### 3. Online Leads (Expensive but Necessary)
- Google Ads: $85–160/lead, 3–5x higher conversion than social
- Facebook/Instagram: $15–25/lead, need 9+ touchpoints before application
- Bankrate leads: $200–250, highest quality aggregator
- LendingTree: $30–100, shared across multiple lenders, speed-to-lead game
- **Critical benchmark**: Leads contacted within 1 MINUTE = 391% higher conversion. Only 0.1% of mortgage leads are engaged within 5 minutes.

### 4. Financial Advisors & CPAs (Overlooked, High Quality)
- "Perhaps the most overlooked referral source"
- Clients are well-documented, financially disciplined, less price-sensitive
- Value exchange: tax-planning insights, wealth-building through RE strategies
- Lower volume, significantly higher quality

### 5. Divorce Attorneys (Specialized Niche)
- Minimal LO competition in this space
- Divorcing couples need: sell home, refi to remove spouse, buy 1-2 new properties
- CDLP® certification required — attorneys won't meet with uncertified LOs
- ~10% of total business from this single channel (reported by practitioners)

### 6. Builders (Steady Pipeline)
- Preferred lender status = consistent purchase deals
- Earned through: reliability, speed, construction timeline expertise
- Need: 60+ day rate locks, new construction appraisal knowledge, on-time closing every time
- RESPA compliance: can offer incentives, cannot require their lender

---

## Automation Playbook (Ranked by ROI)

### Key Principle: Arive handles in-process loan comms (rigid templates). LoanOS owns the 95% of client lifecycle OUTSIDE active loan process.

### Phase 1 Automations (Build First)
1. **Speed-to-Lead Response** (Highest ROI single automation)
   - Fires within 30 seconds of lead submission
   - SMS: "Hi [Name], just received your inquiry — calling you shortly"
   - Email: intro with LO photo + "What to Expect" guide
   - CRM record creation + push notification to LO phone
   - If no connect in 5 min: escalating sequence (15-min SMS, 2-hour email, next-day call) through 6 attempts over 14 days → long-term nurture
   - Can add 1+ closed loans per month

2. **Loan Milestone Notifications** (via Arive → n8n → Supabase)
   - Replace Arive's rigid templates with personalized, branded communications
   - Borrower gets warm contextual update + realtor gets pipeline status email
   - Both branded to LO, both feeling personal

3. **Document Collection Sequences**
   - Day 0: initial request via SMS with custom upload link
   - Day 3: email reminder with specific missing items
   - Day 7: SMS nudge
   - Day 10: escalation alert to LO for personal follow-up
   - Recovers 1–2 hours/day of admin time

### Phase 2 Automations (After Core Pipeline Works)
- Referral partner weekly updates (co-branded pipeline summaries to each realtor)
- Birthday and housiversary messages
- Rate monitoring + refi alerts (daily n8n workflow comparing rates vs. past client data)

### Phase 3 Automations (Months 3+)
- 15-year "Client for Life" post-close drip
- Pre-qual long-term nurture for borrowers not yet under contract
- Re-engagement for cold leads
- Cross-sell: HELOC + investment property when equity reaches threshold

### NEVER Automate
- Delivering bad news (denials, appraisal shortfalls)
- Complex scenario guidance for self-employed/credit-challenged
- Initial strategy consultations
- Escalation handling with underwriting
- Key celebrations (clear-to-close phone call, funding congrats)
- Position: "automation as assistant" — handles routine, surfaces hot moments for personal calls

---

## AI Feature Architecture

### 1. Mortgage Coach Killer: AI Scenario Presentations
- Natural language input → branded PDF in seconds
- Claude API generates plain-English narrative: "Option B saves $847/mo but costs $34K more over 5 years..."
- **V1: Manual rate/pricing input** — LO types in rate, fees, terms. NO expensive pricing engine API ($500-1500/mo for Optimal Blue, $200+/mo for BankingBridge). The math and narrative are the value, not the data entry.
- **V1.5: Auto-populate from MISMO 3.4 import or Arive webhook data** — if loan exists in Supabase, pre-fill scenario builder fields. LO just reviews and generates.
- **V2 (post-beta): Pricing engine API** — add as Pro/Enterprise tier premium feature once revenue justifies cost
- PDF generation: Puppeteer for complex styled output, @react-pdf/renderer for structured docs
- **This single feature can justify the entire $197/mo subscription**

### 1a. MISMO 3.4 Import (Critical LOS-Agnostic Feature)
- Every LOS exports MISMO 3.4 XML — Arive, Encompass, BytePro, Calyx, LendingPad
- Upload MISMO file → server-side parser → creates/updates loan + contact + fees records in Supabase
- Extracts: borrower info, property, loan terms, income, liabilities, closing costs, underwriting data
- Auto-populates scenario builder — LO uploads file, reviews pre-filled data, clicks generate
- Also serves as loan record creation — alternative to manual entry or Arive webhook
- Tech: `fast-xml-parser` or `xml2js` (Node.js), API route only (not client-side), SSN masked to last 4
- **SaaS competitive advantage: makes LoanOS LOS-agnostic from day one**

### 2. Underwriting Guidelines AI (RAG System)
- Supabase pgvector for vector storage
- OpenAI text-embedding-3-small for chunking ($0.02/1M tokens)
- Claude/GPT-4 for answering guideline questions with citations
- "AE Directory" concept: searchable tribal knowledge about wholesale lenders
- Compliance note: Freddie Mac mandates AI governance framework effective March 3, 2026

### 3. Conditions → Borrower Needs List
- LLM converts underwriting conditions to plain-English borrower requests
- Custom upload link per borrower baked in
- No standalone product exists for this — genuine market gap

### 4. Credit Action Plans
- Read credit report data → generate recommendations
- Position as educational guidance, not credit repair tool
- Cannot replace Experian's official simulator for accuracy — include disclaimers

### 5. Daily Command Center / AI Briefing
- Aggregates: pipeline data, calendar, rate changes, tasks, behavioral signals
- Morning digest: stale loans, expiring rate locks, housiversaries, refi opportunities, dormant referral partners

### 6. Chat-to-Loan-Notes
- Every AI interaction saved to loan/contact record
- Creates complete paper trail inside the file
- The connective tissue that makes the entire platform sticky

---

## UI/UX Design Principles

### Information Hierarchy (5-Second Test)
- Top-left (prime real estate): pipeline value or "needs attention" count
- Top row: active leads, loans in process, tasks due, closings this week
- Below: pipeline Kanban board, drag-and-drop, color-coded by health (green/yellow/red)
- Progressive disclosure: summary cards → click to expand → deep-dive pages

### Design Rules
- Default to light mode (better reading accuracy for dense text), offer dark mode toggle
- Mobile: PWA first, not native app. Pipeline view, contact lookup, click-to-call, quick notes
- 44×44px minimum touch targets on mobile
- Monospaced fonts for financial figures (enables column scanning)
- Semantic color coding: green = on track, yellow = attention, red = overdue
- Show null fields as em dashes (not hidden) — Arive data gaps stay auditable
- IBM Plex Mono + IBM Plex Sans, dark gold accent #C9A84C (existing brand system)

### Pipeline Board is the Centerpiece
- Kanban with drag-and-drop stage transitions
- Each card shows: borrower name, loan amount, stage dwell time, referring agent, next action due
- Funnel chart: conversion rates between stages
- Monthly production tracker vs. goals
- Referral partner performance cards

---

## Technical Architecture

### Multi-Tenant from Day One
- Every table gets `org_id` column + RLS policies
- `SECURITY DEFINER` helper function `get_user_org_ids()` for bulletproof isolation
- Shared Supabase database with composite indexes on `(org_id, column)`
- `organizations` table: tenant metadata, Stripe customer ID, subscription status
- `org_members` join table with roles: owner/admin/member

### Next.js 14 App Router Structure
- Route groups: `(marketing)` for public SSG, `(auth)` for login, `(dashboard)` for app
- Middleware: session refresh, tenant resolution, redirects
- Server Components default — minimize `'use client'` to interactive components only

### n8n Multi-Tenant Strategy
- Soft isolation: single n8n instance, every workflow accepts `tenant_id` via webhook
- All DB operations filter by tenant ID
- Tenant-specific credentials in Supabase Vault or encrypted settings table
- Hard isolation (separate Docker instances) for enterprise tenants later

### AI Stack
- Supabase pgvector with HNSW indexing for guidelines RAG
- Vercel AI SDK `streamText` for streaming responses
- Claude Haiku/GPT-4o-mini for simple tasks, Sonnet/GPT-4 for complex reasoning
- Per-tenant token budgets for SaaS cost management

### Full Stack
- Next.js 14 + Supabase + n8n + Tailwind + Shadcn UI
- Resend + React Email for transactional email
- Twilio for SMS (10DLC compliance)
- Stripe Checkout + Billing Portal
- PostHog for analytics
- Sentry for error tracking
- Vitest + Playwright for testing
- React Hook Form + Zod for form validation

---

## Market Sizing

- ~221,000 producing LOs in the U.S. (2025, first annual increase since pandemic)
- Broker segment growing 12.5% YoY
- MBA projects 6.5M originations in 2025 (+28% from 2024)
- Mortgage software market: $16.8B → $48.5B projected by 2033
- Individual LO SaaS TAM: $265M–$437M annually (221K × $100–165/mo avg CRM spend)

### Pricing Tiers (Confirmed)
- **Starter $97/mo**: Core CRM, pipeline, basic automations, mobile PWA. Replaces Jungo.
- **Pro $197/mo**: + AI scenario builder, AI email drafting, advanced automations, drip campaigns, rate alerts, daily briefing. Replaces CRM + Mortgage Coach + automation tool.
- **Enterprise $397/mo**: + Guidelines AI, credit action plans, conditions translator, AE directory, white-label, API access. For top producers + teams.
