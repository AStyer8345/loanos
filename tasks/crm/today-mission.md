## Mission Brief — 2026-03-27 PM

### Domain
LoanOS CRM

### Focus Area
Automation Coverage Audit — map every meaningful borrower lifecycle event against existing n8n workflows, identify gaps, and prioritize what to build next.

### Session Type
[x] Research + Planning (Sequence A)

### Objectives
1. Inventory every touchpoint in a borrower's lifecycle (from lead to 1yr anniversary) and determine if an n8n automation exists for it
2. Map each lifecycle event to the n8n workflows in MEMORY.md — confirm which are live, which are built but inactive, and which have no automation yet
3. Prioritize gaps by impact (ROI, compliance, relationship quality) and complexity (low vs. high effort to build)

### Definition of Done
- Research file written to tasks/crm/research/2026-03-27-automation-coverage-audit.md
- Every borrower lifecycle event accounted for (live coverage, gap, or intentional skip)
- Top 3-5 automation gaps identified with priority ranking and estimated build complexity
- Open questions for Adam documented (what we can't decide without his input)

### Resources / Files in Scope
- /Users/adamstyer/Documents/CLAUDE.md — n8n workflow index (source of truth for what's built)
- tasks/crm/session-log.md — prior automation work and context
- tasks/crm/research/2026-03-25-decommission-audit-research.md — prior automation gap analysis
- tasks/crm/domain-queue.md — queue context
- Live Supabase query — contacts/loans counts, activity_log for recent milestone events
- n8n via MCP — live workflow status check

### HIGH RISK Items
None — this is a research-only session. No schema changes, no workflow activations.

### Context from Prior Sessions
- AM session (2026-03-27): WF2 now syncs closing_date + contact current_rate/current_loan_balance on fund
- 2026-03-25 PM decommission audit found: 5 live automations, 7 needing action, 6 not built, 1 blocked
- email_opt_out enforcement added to milestone route (2026-03-26 AM)
- Contacts: 2,376 | Loans: 854 total (841 active) | do_not_call column live (all false)
- Pipeline UI: summary bar, Kanban toggle, Last Milestone column all built
- Next queue item after Automation Coverage Audit: Realtor Relationship System
