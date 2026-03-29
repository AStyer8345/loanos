# Web Research — White-Label Options
Date: 2026-03-29
Session: PM
Active Topic: Phase 3 — White-Label Options

---

## Source 1: Vercel for Platforms — Multi-Tenant Domains
URL: https://vercel.com/docs/multi-tenant
Summary: Vercel for Platforms enables custom subdomains and custom CNAMEs for each tenant via a single deployment. Wildcard DNS (`*.loanos.app`) requires Vercel nameservers for automatic DNS-01 SSL certificate issuance. Programmatic domain management via the Vercel REST API (`POST /v1/projects/:id/domains`).
Relevance: HIGH — confirms feasibility of subdomain routing and custom CNAME support

## Source 2: Vercel for Platforms — Configuring Domains
URL: https://vercel.com/platforms/docs/multi-tenant-platforms/configuring-domains
Summary: Covers how to programmatically add domains to a Vercel project, validate CNAME records, and issue SSL certificates automatically. Domain additions happen via API or CLI. Each tenant's custom domain resolves to the same Next.js deployment — routing logic lives in middleware.
Relevance: HIGH — exact implementation path for custom domain support

## Source 3: Vercel Wildcard Domains Announcement
URL: https://vercel.com/blog/wildcard-domains
Summary: Vercel uses DNS-01 challenge for wildcard cert issuance, requiring Vercel nameservers. Once *.loanos.app is added, every new subdomain auto-resolves. Per-tenant subdomains are live instantly with no manual DNS changes.
Relevance: HIGH — confirms wildcard SSL works with Vercel nameservers (loanos.app is already on Vercel)

## Source 4: Per-Tenant CSS Variables Theming Pattern
URL: https://www.nextsaaspilot.com/blogs/themes-next
Summary: The recommended pattern for per-tenant branding in Next.js App Router: load org's brand_color + logo_url in the Root Layout server component, then inject `<style>` tag with `--primary-color: #xxx; --logo-url: url(...)` CSS custom properties. All downstream Tailwind/CSS references use `var(--primary-color)`. No React context needed — pure CSS cascade. Compatible with shadcn/ui's `hsl(var(--primary))` token system.
Relevance: HIGH — directly applicable to LoanOS (already has brand_color + logo_url in organizations table)

## Source 5: Resend Domain Management for Multi-Tenant SaaS
URL: https://resend.com/docs/dashboard/domains/introduction
Summary: Resend supports per-domain sending via API: each domain must be verified with DNS TXT + MX records. Sending from `adam@thestyerteam.com` vs `amy@amymortgage.com` requires a separate verified domain in Resend. The from-address can be programmatically set per API call. For Phase 3 MVP, a "reply-to override" per tenant is simpler — all emails go from a shared sender (noreply@loanos.app) but reply-to is the LO's email address. Full custom sender domains are Phase 4 scope.
Relevance: MEDIUM — confirms Resend supports custom domains but complexity justifies deferring to Phase 4

---

## Key Decisions Informed by Research

1. **Subdomain routing**: Use Vercel for Platforms middleware pattern — rewrite request to `/{tenant-slug}` based on hostname header. loanos.app is already on Vercel; add `*.loanos.app` wildcard.

2. **Branding injection**: Load `brand_color` + `logo_url` in root layout server component → inject as CSS custom properties via `<style>` tag. Tailwind CSS variables already use `hsl(var(--primary))` — override with org's brand color.

3. **Custom CNAME**: Phase 3 MVP = subdomains only (`tenant.loanos.app`). Custom CNAME (`loans.acme.com`) is Phase 4 — requires Vercel Domains API programmatic provisioning + user DNS education.

4. **Email from-address**: Phase 3 = reply-to override per tenant (simple). Phase 4 = verified per-tenant sender domain in Resend.
