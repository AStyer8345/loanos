# NotebookLM Staleness Audit — 2026-03-28 PM

**Notebook:** LoanOS Lead Gen Intelligence (4213513c-22ac-45af-96c1-3365ba3477eb)
**Total sources at audit start:** 38
**Auditor:** Lead Gen PM Subagent
**Timestamp:** 2026-03-28 22:05:00

---

## Audit Summary

All 38 sources reviewed. Two sources flagged as stale (Cloudflare-blocked URLs confirmed in AM audit as well). No foundational docs removed. No single-topic coverage gaps created by removals.

---

## Stale Sources — REMOVE

| # | ID | Title | Reason |
|---|-----|--------|--------|
| 1 | `63437ae7-ea0a-421b-bb5a-c4958cc78aea` | "Attention Required! \| Cloudflare" (HousingWire trigger lead ban) | Cloudflare-blocked — content never loaded. Topic covered by Scotsman Guide source `5557b6c9` which IS readable. Redundant + broken. |
| 2 | `d434f16c-447c-48de-a242-19e916bec9dd` | "Attention Required! \| Cloudflare" (HousingWire mortgage lead gen) | Cloudflare-blocked — content never loaded. HousingWire 16 Marketing Strategies article is the preferred replacement — adding new. |

**Action:** Delete both. Topic coverage maintained by Scotsman Guide + new HousingWire source.

---

## Sources Reviewed — KEEP

| Source | Age | Status | Notes |
|--------|-----|--------|-------|
| CFPB Reg Z (3c2b8328) | Evergreen | KEEP | Regulatory — never stale |
| 2026-03-25-current-state-audit.md (d96893f8) | 3 days | KEEP | Core baseline, still active |
| 2026-03-25-lead-flow-web.md (36861031) | 3 days | KEEP | FCC consent rule research still active |
| 2026-03-25-week1-baseline-web.md (1a34b5b2) | 3 days | KEEP | Baseline doc, foundational |
| 2026-03-26-form-destination-audit.md (0bfc5d39) | 2 days | KEEP | BLOCKER-002 context, resolved but historical |
| 2026-03-26-pm-web-research.md (1ba29751) | 2 days | KEEP | Conversion benchmarks still relevant |
| 2026-03-27-pre-approval-funnel-build.md (a39d8f6e) | 1 day | KEEP | Active build, pending deploy |
| 2026-03-27-pre-approval-funnel-research.md (09006e6d) | 1 day | KEEP | Superseded by spec but useful context |
| 2026-03-27-pre-approval-funnel-spec.md (49df1def) | 1 day | KEEP | Spec in active use |
| 2026-03-28-pre-approval-funnel-qa.md (74ff0a0a) | Today | KEEP | Active QA result |
| 2026-03-28-pre-approval-funnel-review.md (7e7680d1) | Today | KEEP | Active review |
| 2026-03-28-rate-alert-funnel-research.md (d10265f7) | Today | KEEP | Active research, Rate Alert is next build |
| Mailchimp nurture guide (e700655f) | Evergreen | KEEP | Referenced in sequence design |
| CAN-SPAM FTC (c068a394) | Evergreen | KEEP | Compliance reference |
| CONTEXT.md (8f68b74c) | Foundational | KEEP | Never remove |
| Mailchimp Customer Journey (0d5b5f0b) | Evergreen | KEEP | Active implementation reference |
| Mailchimp benchmarks (62c12d52) | Evergreen | KEEP | Benchmark data |
| Scotsman Guide flip the script (6a4d53e5) | Evergreen | KEEP | Lead gen strategy |
| Netlify Forms docs (eba34114) | Evergreen | KEEP | Active implementation |
| TDHCA homeownership (38753c4d) | Evergreen | KEEP | Texas DPA programs reference |
| Phonexa lead cost 2026 (483fcd02) | Current | KEEP | 2026 data, still valid |
| Scotsman Guide closing ratios (00d6085f) | Evergreen | KEEP | Benchmark data |
| Mailchimp landing page best practices (bcfe9aaa) | Evergreen | KEEP | Active reference |
| Mailchimp Landing Pages API (58eeb658) | Evergreen | KEEP | Dev reference |
| Mailchimp automations API (7b226788) | Evergreen | KEEP | Dev reference |
| FAQ structured data (2625e66b) | Evergreen | KEEP | SEO reference |
| Scotsman Guide power up marketing (67e7b163) | Evergreen | KEEP | Strategy reference |
| 1003app register page (c6252f0c) | Active | KEEP | CTA destination link |
| Scotsman Guide AI/automation (f9fad3f5) | Current | KEEP | 2026 data |
| Texas Mortgage Pros (d3e342a1) | Active | KEEP | Competitor reference |
| Scotsman Guide trigger leads law (5557b6c9) | Current | KEEP | 2026 law coverage |
| Unbounce landing pages explainer (34e879ff) | Evergreen | KEEP | Foundational reference |
| Mailchimp email sequence (82fd08ba) | Evergreen | KEEP | Active implementation reference |
| Unbounce conversion rates Q4 2024 (10b1f5bc) | Current | KEEP | Benchmark data |
| domain-queue.md (83d563e9) | Foundational | KEEP | Never remove |
| lessons.md (3a6b24a1) | Foundational | KEEP | Never remove |

---

## Result

- **Stale sources removed:** 2 (both Cloudflare-blocked HousingWire URLs)
- **Sources after audit:** 36
- **No foundational docs removed** ✓
- **No single-topic coverage gaps** ✓ (both removed topics covered by other sources)
