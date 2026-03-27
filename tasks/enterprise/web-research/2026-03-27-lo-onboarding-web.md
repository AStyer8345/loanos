# Web Research — LO Onboarding Flow
Date: 2026-03-27 PM
Session: Enterprise PM
Topic: LO Onboarding Flow — multi-step wizard, LOS connection, CSV import, feature gating

---

## Sources Added to NotebookLM

### 1. Vercel Multi-Tenant Next.js Guide
URL: https://vercel.com/guides/nextjs-multi-tenant-application
Summary: Official Vercel guide on multi-tenant architecture patterns for Next.js, including subdomain/path-based tenancy and authorization approaches. Relevant to the tenant-aware onboarding context and feature gating implementation.

### 2. Next.js Multi-Tenant Official Docs
URL: https://nextjs.org/docs/app/guides/multi-tenant
Summary: Official Next.js App Router documentation on multi-tenant architecture, covering RLS patterns and authorization approaches for plan-based feature enforcement. Reference for canAccessFeature helper and plan gate UI.

### 3. Stripe Build Subscriptions Guide
URL: https://docs.stripe.com/billing/subscriptions/build-subscriptions
Summary: Stripe's official guide to building subscription-based billing flows, covering checkout sessions, customer portal, and upgrade/downgrade handling. Directly applicable to Phase 3 billing Build Sessions 2-3.

### 4. LOS API Integrations Guide
URL: https://lendfoundry.com/blog/5-ways-api-first-integrations-strengthen-loan-origination-software/
Summary: Industry-specific guide to webhook and API patterns for integrating Loan Origination Systems, covering two-way data sync and event notification architectures for multi-tenant lending platforms. Relevant to the Arive webhook setup step in LO onboarding.

### 5. CSV Deduplication Patterns
URL: https://blog.csvbox.io/prevent-duplicate-records-spreadsheet-uploads/
Summary: Practical guide to CSV deduplication strategies in SaaS applications, including email normalization, unique constraint enforcement, and batch processing patterns for contact imports. Directly applicable to the CSV contact import step in LO onboarding.

---

## Key Research Findings

### SaaS Onboarding Best Practices (Applicable to LO Setup Wizard)
- **First 10 minutes are critical** — if an LO doesn't see value in the first session, churn risk is high
- **Progressive disclosure** — don't show all setup steps at once. 3-step wizard with clear labels beats 8-step detailed flow
- **Skip/defer mechanism** — each step should have "do this later" option tracked in org_settings
- **Completion indicators** — show percentage complete or step X of Y prominently
- **Immediate value demonstration** — first action should produce visible output (e.g., AI greeting email preview)

### LOS Integration Pattern (Arive Webhook Setup)
- **Webhook URL delivery** — the onboarding step should display the tenant's unique n8n webhook URL they need to configure in Arive
- **Tenant URL format**: `https://styer.app.n8n.cloud/webhook/arive-new-loan?org_id=[ORG_ID]`
- **Copy button + test mechanism** — LOs should be able to copy the URL and verify it works before leaving the step
- **Async verification** — after they claim to have set it up, system can verify by polling for first webhook event (optional but powerful)

### CSV Import Deduplication
- **Email as canonical key** — for contacts, deduplicate on email address (normalized lowercase, trimmed)
- **Pre-import preview** — show LO a preview: X new contacts, Y duplicates (will skip), Z invalid rows
- **Field mapping UI** — LO's CSV headers may differ. Map their columns to LoanOS fields before import
- **Batch size** — for large imports (1000+), use streaming or chunked inserts with progress indicator

### Feature Gating Pattern (Plan Enforcement)
- **Entitlements helper** — `canAccessFeature(org, 'team_members')` returns boolean
- **Soft gates** — show feature but overlay UpgradePrompt instead of hard 404
- **Hard gates** — API routes check plan server-side before executing
- **Trial period** — consider 14-day professional trial on signup (all features unlocked, no payment required)
