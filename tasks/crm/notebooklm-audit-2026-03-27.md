# NotebookLM Staleness Audit — 2026-03-27

**Notebook:** LoanOS CRM Intelligence (7b40d6c2-5bed-4151-b25c-1c9e6d8ded6b)
**Sources at time of audit:** 41
**Audited by:** NotebookLM Curator Subagent (PUSH+CURATE mode)

---

## Audit Criteria

A source is STALE if:
- Older than 60 days AND superseded by a newer source on the same topic
- Contains field mappings revised in a later spec
- References a schema that was later migrated/changed
- Is a first-draft file replaced by a refined spec

---

## Source Inventory Review

### Markdown Sources (Internal)

| # | Title | Created | Assessment |
|---|-------|---------|------------|
| 3 | 2026-03-12_LoanOS-Automation-Audit.md | 2026-03-25 | POTENTIALLY STALE — pre-dates today's automation coverage audit; superseded by 2026-03-27-automation-coverage-audit.md on same topic. Keep for historical reference — not identical scope. RETAIN. |
| 4 | 2026-03-25-contact-data-architecture.md | 2026-03-25 | CURRENT — contact schema architecture. Not yet superseded. RETAIN. |
| 5 | 2026-03-25-contact-dedup-spec.md | 2026-03-25 | CURRENT — dedup spec. Not superseded. RETAIN. |
| 6 | 2026-03-25-decommission-audit-research.md | 2026-03-25 | CURRENT — decommission research. RETAIN. |
| 7 | 2026-03-25-dedup-field-mapping.md | 2026-03-25 | CURRENT — field mapping spec. RETAIN. |
| 8 | 2026-03-26-contact-stage-fix-build.md | 2026-03-26 | CURRENT. RETAIN. |
| 9 | 2026-03-26-loan-pipeline-organization.md | 2026-03-26 | CURRENT. RETAIN. |
| 10 | 2026-03-26-phase3-billing-ui.md | 2026-03-26 | CURRENT. RETAIN. |
| 11 | 2026-03-26-phase3-tenant-admin-spec.md | 2026-03-26 | CURRENT. RETAIN. |
| 12 | 2026-03-26-phase3-webhook-impl.md | 2026-03-26 | CURRENT. RETAIN. |
| 13 | 2026-03-26-pipeline-ui-build.md | 2026-03-26 | CURRENT. RETAIN. |
| 14 | 2026-03-27-wf2-enhancements-build.md | 2026-03-27 | CURRENT — today's AM session. RETAIN. |
| 16 | ARCHITECTURE.md | 2026-03-25 | CURRENT — core reference. RETAIN. |
| 18 | CLAUDE.md | 2026-03-25 | CURRENT — project instructions. RETAIN. |
| 19 | CONTEXT.md | 2026-03-25 | POTENTIALLY STALE — this is a snapshot. Needs re-add if git diff shows changes today. See Step 4 check. |
| 23 | LOANOS_SYSTEM_KNOWLEDGE_BASE.md | 2026-03-25 | CURRENT. RETAIN. |
| 25 | LoanOS_CRM_Audit_2026-03-13.md | 2026-03-25 | HISTORICAL — March 13 audit. Predates current schema migrations but useful as baseline. RETAIN for historical comparison. |
| 32 | WISP.md | 2026-03-25 | CURRENT. RETAIN. |
| 33 | agents-n8n-setup.md | 2026-03-25 | CURRENT. RETAIN. |
| 34 | data-retention-policy.md | 2026-03-25 | CURRENT. RETAIN. |
| 35 | domain-queue.md | 2026-03-26 | CURRENT. RETAIN. |
| 36 | lessons.md | 2026-03-25 | CURRENT. RETAIN. |
| 37 | loans-contacts-audit.md | 2026-03-25 | CURRENT. RETAIN. |
| 38 | n8n-credentials-setup.md | 2026-03-25 | CURRENT. RETAIN. |
| 39 | rls-audit-2026-03-18.md | 2026-03-25 | CURRENT — RLS audit is point-in-time. RETAIN. |
| 40 | schema-audit.md | 2026-03-25 | FLAG — schema-audit is generic title; may contain field structures now superseded by contact-data-architecture.md. No newer schema audit file exists to confirm — RETAIN but flag for human review. |
| 41 | zapier_webhook_fields.md | 2026-03-25 | CURRENT. RETAIN. |

### Web Sources

| # | Title | Created | Assessment |
|---|-------|---------|------------|
| 1 | CFPB Reg C | 2026-03-25 | CURRENT — regulatory reference. RETAIN. |
| 2 | 2026's Top 8 Mortgage CRMs | 2026-03-25 | CURRENT. RETAIN. |
| 15 | 500 Error (themortgagereports.com) | 2026-03-25 | **STALE/BROKEN** — loaded as a 500 error page. No useful content. CANDIDATE FOR REMOVAL. |
| 17 | n8n integrations | 2026-03-25 | CURRENT. RETAIN. |
| 20 | Salesforce Contact Object Ref | 2026-03-25 | CURRENT. RETAIN. |
| 21 | Supabase Full Text Search | 2026-03-25 | CURRENT. RETAIN. |
| 22 | NAR Profile of Buyers & Sellers | 2026-03-25 | CURRENT. RETAIN. |
| 24 | Mailchimp Lists API | 2026-03-25 | CURRENT. RETAIN. |
| 26 | Mailchimp Customer Journeys API | 2026-03-25 | CURRENT. RETAIN. |
| 27 | Mailchimp Automations API | 2026-03-25 | CURRENT. RETAIN. |
| 28 | Empower LO — Pipeline Management | 2026-03-26 | CURRENT. RETAIN. |
| 29 | ActiveProspect TCPA Checklist | 2026-03-25 | CURRENT. RETAIN. |
| 30 | Supabase Realtime | 2026-03-25 | CURRENT. RETAIN. |
| 31 | PacificEast TCPA 2026 | 2026-03-25 | CURRENT. RETAIN. |

---

## Stale / Flagged Sources

| Source ID | Title | Reason | Action |
|-----------|-------|--------|--------|
| `5dd7fd56-7f77-4455-a401-0331d68c2d5d` | "500: Internal Server Error." | Loaded as broken page — no useful content | **REMOVE** |

**Total stale sources identified: 1**
**Recommended removals: 1** (the broken 500 error page)

---

## Missing Sources (to add today)

1. `tasks/crm/research/2026-03-27-automation-coverage-audit.md` — today's PM session research
2. CONTEXT.md re-add — pending git diff check (see Step 4)
3. Up to 3 new web sources from today's web research sweep

---

## Notes

- All March 25-27 sources are within the 60-day staleness window — none are stale by age
- The 2026-03-12_LoanOS-Automation-Audit.md predates the current automation coverage work but covers different scope (system-level vs. gap analysis) — retain for context
- schema-audit.md flagged for human review — title is ambiguous and may contain superseded field mappings
- CONTEXT.md needs re-add if it changed today (checked via git diff in Step 4)
