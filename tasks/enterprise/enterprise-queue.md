# LoanOS Enterprise Build Queue

---

CURRENT STATE (as of 2026-03-26):

PHASE 1 — COMPLETE ✅
  Core CRM: contacts (2,377), loans (817+), documents, activity log, email drafts, scenarios
  Automations: 8 n8n workflows (Pre-Approval, CD Email, Refi Intake, Referral Intro, Website Lead,
               New Application, Contract Received, Milestone Communication)
  Chat: AI assistant with attachments, voice, contact extraction, Hot Leads widget
  Marketing tab, daily briefing, performance reports, todo system
  Scenario Builder: 3-step wizard, branded PDF output, AI narrative

PHASE 2 — MULTI-TENANCY: COMPLETE ✅
  Full org-scoped RLS across all 15 tables (migrations 001–056)
  Onboarding flow: org create, member invite, role management (/api/org/*)
  NOT NULL hardened on all tables incl. activity_log (migration 056, 2026-03-25 PM)

  OUTSTANDING (carry to Phase 3 — not blockers):
  - [x] Adam must push WF1 (1tagvoU0UXtdDiMY) to n8n cloud — DONE 2026-03-25
  - [x] Adam must push WF2 (9JyzzwKac8v3uQ7d) to n8n cloud — DONE 2026-03-25
  - [x] activity_log.organization_id NOT NULL — APPLIED migration 056 — 2026-03-25 PM
  - [x] Performance page: localStorage seed data still shows real borrower names — FIXED 2026-03-25 PM
  - [x] Plan selection UI in onboarding — VERIFIED 2026-03-26: /api/org/create stores plan, onboarding page has working plan UI
  - [ ] Outlook Email Sync (JMmstRl2C5ylmuIY) blocked on Azure App Registration (not a Phase 2 blocker)

---

ACTIVE: Phase 3 — White-Label Options (building) / Billing (when Stripe unblocked)

  White-Label Options:
    Architecture spec COMPLETE: tasks/enterprise/specs/2026-03-29-phase3-whitelabel-spec.md
    Build sequence (3 sessions):
      Session 1: Branding Engine — migration 063, getBranding.ts, CSS var injection, branding settings page
      Session 2: Subdomain Routing — middleware extension, getTenantFromHostname.ts, domain API
      Session 3: Settings UI + polish — branding tab, entitlement gates, QA
    ADAM DECISION NEEDED before Session 2:
      - [ ] Confirm loanos.app DNS method (Vercel nameservers required for *.loanos.app wildcard)

  Billing (blocked):
    Architecture spec COMPLETE: tasks/enterprise/specs/2026-03-26-phase3-billing-spec.md
    Decision: Fixed-tier billing (Starter free, Professional $99/mo). Per-seat deferred to Phase 5.
    ADAM ACTION REQUIRED before build can start:
    - [ ] Create Stripe account (or use existing)
    - [ ] Create Product "LoanOS Professional" + Price $99/mo in Stripe Dashboard
    - [ ] Configure webhook endpoint: https://loanos.vercel.app/api/webhooks/stripe
    - [ ] Add to Vercel: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_PRICE_PROFESSIONAL_MONTHLY

---

QUEUE (Phase 3 build sequence):
- Billing + Subscriptions
    Stripe webhook setup. Plan tier enforcement (starter/pro/enterprise).
    Subscription management page. Failed payment handling. Usage metering.
- Tenant Admin Dashboard
    Internal dashboard: all tenants, plan tier, usage stats, last active, churn signals.
    Feature flag per tenant. Manual override for support.
- LO Onboarding Flow
    Signed-up LO: connect LOS (Arive or other), import contacts (CSV), configure automations.
    First 10-minute setup wizard. Default n8n workflow templates per new tenant.
- White-Label Options
    Custom subdomain (lo.loanos.app or custom CNAME). Logo + brand color per tenant.
    Email from-address per tenant (custom SMTP or shared).
- Security Hardening
    GLBA compliance review. SOC 2 prep (audit log completeness, access controls).
    PII handling — what gets encrypted beyond at-rest Supabase encryption?
- Marketplace / Integrations
    LOS connectors beyond Arive (Encompass, Byte, SimpleNexus).
    CRM connectors for LOs who don't want to fully migrate.
    API for third-party tools.

---

COMPLETED:
- Phase 1: Full core CRM + automations ✅
- Phase 2: Multi-tenancy RLS + onboarding ✅ (pending 5 items above)
- Phase 3: Tenant Admin MVP ✅ (2026-03-27)
- Phase 3: LO Onboarding Flow ✅ (2026-03-28 — all 3 sessions)
- Chat v4 with attachments, voice, AI extraction ✅
- Scenario Builder with branded PDF ✅
- Performance + reporting pages ✅

---

QUEUE RULES:
- Finish Phase 2 outstanding items before starting Phase 3 build work
- Phase 3 items require architecture spec before any execution
- No billing or tenant admin changes without Reviewer + QA sign-off
