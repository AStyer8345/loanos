# LoanOS Enterprise Build Queue

---

CURRENT STATE (as of 2026-03-25):

PHASE 1 — COMPLETE ✅
  Core CRM: contacts (2,377), loans (817+), documents, activity log, email drafts, scenarios
  Automations: 8 n8n workflows (Pre-Approval, CD Email, Refi Intake, Referral Intro, Website Lead,
               New Application, Contract Received, Milestone Communication)
  Chat: AI assistant with attachments, voice, contact extraction, Hot Leads widget
  Marketing tab, daily briefing, performance reports, todo system
  Scenario Builder: 3-step wizard, branded PDF output, AI narrative

PHASE 2 — MULTI-TENANCY: ~95% COMPLETE ✅
  Full org-scoped RLS across all 15 tables (migrations 001–053)
  Onboarding flow: org create, member invite, role management (/api/org/*)
  NOT NULL hardened on 8 tables (migration 053, 2026-03-25)

  OUTSTANDING (finish before Phase 3 launch):
  - [ ] Adam must push WF1 (1tagvoU0UXtdDiMY) to n8n cloud — still running old version
  - [ ] Adam must push WF2 (9JyzzwKac8v3uQ7d) to n8n cloud — same
  - [ ] activity_log.organization_id NOT NULL — safe once WF1/WF2 confirmed pushed
  - [ ] Performance page: localStorage seed data still shows real borrower names — fix or remove
  - [ ] Plan selection UI in onboarding — currently defaults to 'starter', no user choice
  - [ ] Outlook Email Sync (JMmstRl2C5ylmuIY) blocked on Azure App Registration

---

ACTIVE: Phase 2 Closeout + Phase 3 Planning

  Priority 1 — Finish Phase 2:
  Resolve the 5 outstanding items above. Each is a known bug or missing piece.
  WF1/WF2 cloud push unblocks activity_log NOT NULL hardening.
  Performance page localStorage fix is a data privacy issue.

  Priority 2 — Phase 3 Design:
  LoanOS is production-ready for Adam. Phase 3 = licensing to other LOs.
  Key questions for Phase 3:
    - Billing: Stripe subscription per tenant (plan: starter/pro/enterprise)
    - Plan limits: what's gated per tier? (contacts, loans, users, automations)
    - White-label: custom domain + logo per tenant, or shared domain with slug?
    - Admin dashboard: tenant list, usage metrics, support tools
    - Onboarding for other LOs: what data do they bring in? (CSV import, LOS connection)

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
- Chat v4 with attachments, voice, AI extraction ✅
- Scenario Builder with branded PDF ✅
- Performance + reporting pages ✅

---

QUEUE RULES:
- Finish Phase 2 outstanding items before starting Phase 3 build work
- Phase 3 items require architecture spec before any execution
- No billing or tenant admin changes without Reviewer + QA sign-off
