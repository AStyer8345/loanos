# LoanOS Documentation

This directory contains developer, operator, security, and agent-facing docs for LoanOS.

For current product status, read `CONTEXT.md` at the repo root first. Some documents in this repo are historical artifacts from earlier phases; prefer the files below when starting new work.

## Start Here

| File | Use |
| --- | --- |
| `../CONTEXT.md` | Current project status and handoff context. |
| `../README.md` | Local setup, deploy workflow, and key links. |
| `AI_AGENT_ONBOARDING.md` | Top friction points and safe workflow for new AI agents. |
| `REPO_STRUCTURE.md` | Map of the repo by ownership area. |
| `../ARCHITECTURE.md` | Technical architecture reference. |
| `../DECISIONS.md` | Why major architecture decisions were made. |
| `../TODO.md` | Open work and Adam-blocked decisions. |

## Product And Design

| File | Use |
| --- | --- |
| `THEME.md` | UI theme and design system rules. |
| `marketing-strategy.md` | Marketing strategy notes. |
| `salesperson-training.md` | Sales/user training context. |
| `developer-training.md` | Developer training context. |
| `../LOANOS_SYSTEM_KNOWLEDGE_BASE.md` | Product truth and marketing-safe claims. |

## Setup And Integrations

| File | Use |
| --- | --- |
| `agents-n8n-setup.md` | Agent and n8n setup. |
| `n8n-credentials-setup.md` | n8n credential setup. |
| `contract-automation-setup.md` | Contract automation setup. |
| `outlook-azure-setup.md` | Historical Outlook/Azure setup context. Verify current email provider in code and `CONTEXT.md` before using. |
| `multitenancy-checklist.md` | Tenant-safety checklist. |

## Security

| File | Use |
| --- | --- |
| `security/WISP.md` | Written Information Security Program. |
| `security/data-retention-policy.md` | Data retention policy. |
| `security/secret-rotation-runbook.md` | Secret rotation procedure. |

## Generated Public Docs

| File | Use |
| --- | --- |
| `loanos.html` | Build tracker source copied to `public/docs/loanos.html`. |
| `loanos-system-map.html` | System map source copied to `public/docs/loanos-system-map.html`. |

## Maintenance Rule

When a doc becomes historical or contradicts `CONTEXT.md`, either update it or label it clearly as historical. Do not leave stale deployment targets, schema counts, or auth descriptions in startup docs.
