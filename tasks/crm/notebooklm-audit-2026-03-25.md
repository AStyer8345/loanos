# NotebookLM Staleness Audit — CRM — 2026-03-25 PM

## Sources Flagged as Stale / Error

| Source | Age | Reason | Action |
|--------|-----|--------|--------|
| 029_add_multitenancy.sql | 0 days | ERROR status — NotebookLM doesn't accept .sql format. Never loaded. No knowledge contribution. | REMOVED |
| 031_multitenancy_rls.sql | 0 days | ERROR status — same reason. Never loaded. | REMOVED |

Both SQL sources removed. The schema knowledge they contained is covered by:
- CONTEXT.md (multi-tenancy status documented in text)
- schema-audit.md
- rls-audit-2026-03-18.md

## Sources Confirmed Current

All 18 remaining sources are from 2026-03-25 (today). No 60-day age threshold met.
No superseded content detected.

| Source | Age | Status |
|--------|-----|--------|
| CONTEXT.md | 0 days | CURRENT — updated this session |
| CLAUDE.md | 0 days | CURRENT |
| ARCHITECTURE.md | 0 days | CURRENT |
| LOANOS_SYSTEM_KNOWLEDGE_BASE.md | 0 days | CURRENT |
| LoanOS_CRM_Audit_2026-03-13.md | 12 days | CURRENT — baseline audit, still authoritative |
| 2026-03-12_LoanOS-Automation-Audit.md | 13 days | CURRENT — automation inventory, still accurate |
| 2026-03-25-contact-dedup-spec.md | 0 days | CURRENT — written AM session; NOT to be executed per Adam |
| 2026-03-25-dedup-field-mapping.md | 0 days | CURRENT — AM research |
| domain-queue.md | 0 days | CURRENT — updated today |
| schema-audit.md | varies | CURRENT |
| rls-audit-2026-03-18.md | 7 days | CURRENT |
| loans-contacts-audit.md | varies | CURRENT |
| lessons.md | 0 days | CURRENT — ongoing |
| WISP.md | varies | CURRENT |
| data-retention-policy.md | varies | CURRENT |
| agents-n8n-setup.md | varies | CURRENT |
| n8n-credentials-setup.md | varies | CURRENT |
| zapier_webhook_fields.md | varies | CURRENT |

## PM Session — New Source Added

| Source | ID | Status |
|--------|-----|--------|
| 2026-03-25-decommission-audit-research.md | 8318a654-454c-4bb6-b014-54d5b7effc3d | ready |

## Web Research Sweep

Searched: "n8n Salesforce CRM replacement mortgage automation 2026" + "Supabase CRM decommission migration checklist best practices 2026"

Results: n8n docs and Supabase general migration docs returned. No domain-specific mortgage CRM decommission guidance found. No new web sources added (general docs don't meet the authoritative domain + topic-specific threshold).

## Summary
- Stale sources removed: 2 (both were error-status SQL files that never loaded)
- New sources added: 1 (decommission audit research)
- Web sources added: 0
- Total sources: 19
