# Web Research — 2026-03-27 PM
Topic: Tenant Admin + Stripe Checkout Patterns

---

## Query 1: Stripe Checkout Next.js 2026 subscription integration

### https://github.com/vercel/nextjs-subscription-payments
Official Vercel template for SaaS subscription apps with Next.js and Stripe. Covers the complete subscription lifecycle: checkout sessions, webhooks, and customer portal. Directly applicable to LoanOS Phase 3 build.

### https://makerkit.dev/docs/next-supabase-turbo/installation/introduction
Production-ready Next.js + Supabase SaaS starter kit with built-in Stripe billing, authentication, and team management. Admin dashboard and multi-tenant support included — good reference for Phase 3 Sessions 1-3.

---

## Query 2: SaaS internal admin dashboard Next.js Supabase tenant management

### https://makerkit.dev/docs/next-supabase-turbo/admin
Dedicated admin dashboard guide for Next.js + Supabase SaaS apps with tools for managing users, monitoring subscriptions, and app oversight. Direct reference for LoanOS Tenant Admin MVP.

### https://github.com/hubbleai/supabase-user-management-dashboard
Multi-tenant SaaS dashboard with user management, API key management, tenant isolation, and role assignment. Practical reference for the /admin tenant list + detail pages in the spec.

---

## Query 3: Tenant Admin dashboard role-based access Next.js pattern

### https://clerk.com/docs/guides/secure/basic-rbac
Official Clerk RBAC guide — metadata-driven permissions, session attachment, route protection. Relevant if LoanOS adds Clerk later; shows the standard RBAC pattern.

### https://authjs.dev/guides/role-based-access-control
Auth.js RBAC with session callbacks and permission checking. Useful reference for the requireAdmin() helper pattern in the Tenant Admin spec.

---

*Generated: 2026-03-27 PM session*
*Sources added to NotebookLM: 4 (Vercel template, MakerKit admin guide, MakerKit starter, Hubble dashboard)*
