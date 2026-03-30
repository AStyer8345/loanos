# Web Research — Loan Record UI Sprint — 2026-03-30

Session: PM — PUSH+CURATE
Active Topic: Loan Record UI — Simplification Sprint (Session 1 next)
Queries run: 3

---

## Query 1: "mortgage CRM loan detail view UI best practices 2026"

### Key Findings

- **Deals board view** is the standard: loans displayed by stage (new lead → application → funded) in a kanban-style for real-time status tracking. LoanOS already has this (Kanban added 2026-03-27).
- **AI summarization** is a 2026 trend: leading CRMs auto-summarize complex deals so LOs see key details at a glance. Not built in LoanOS yet — potentially high-value for the loan record redesign.
- **Activity logging** (calls/emails/tasks auto-captured) is table stakes. LoanOS has `activity_log` but it's lightly used.
- **Compliance tracking** (deadlines, disclosure timing, audit trails) should be built in, not separate.
- **Communication history** (calls/SMS/email) must be visible on the loan record — LoanOS's loan record has no communication log tab today.
- Sources: bankingbridge.com, softbliq.com, creatio.com, monday.com, zeitro.com

### Sources Found (authoritative)
- https://monday.com/blog/crm-and-sales/mortgage-crm/ — comprehensive mortgage CRM software comparison with UI feature descriptions
- https://www.creatio.com/glossary/mortgage-crm — mortgage CRM definition + feature expectations

---

## Query 2: "loan officer CRM loan record information hierarchy what matters 2026"

### Key Findings

- **LOs spend 60% of their week on admin tasks** (MBA data) — the primary UI goal should be reducing friction in those tasks, not adding information
- **Critical fields that must be visible immediately**: loan status, borrower name, loan amount, closing date, rate, last activity
- **Sync with LOS** (Arive) is non-negotiable — stale data on the CRM record creates trust problems. LoanOS syncs via WF2.
- **Dynamic profiles** — contact record should show behavioral + financial data together, not just static fields
- **Milestone reminders + compliance deadlines** should surface on the loan record automatically
- Sources: ijungo.com, zeitro.com, pathsoftware.com

### Sources Found (authoritative)
- https://ijungo.com/mortgage-crm-strategies-to-improve-loan-officer-productivity-in-2026/ — LO productivity strategies with specific CRM UI recommendations

---

## Query 3: "Total Expert Shape CRM loan detail page design pipeline view features"

### Key Findings

- **Total Expert**: pipeline view + loan tracking dashboard + co-borrower contact management. Customizable dashboards. LOS-integrated. Does NOT expose raw "loan detail page" design publicly.
- **Shape CRM**: described as an AI mortgage CRM. G2 has a features page. Setshape.com remains Cloudflare-blocked.
- **Key distinction**: Enterprise LO CRMs (Total Expert, Shape) invest heavily in pipeline views and automated communication — the detail page is dense but designed for power users, not simplicity.
- Sources: totalexpert.com, setshape.com (blocked), g2.com

### Sources Found (authoritative)
- None added — setshape remains blocked; Total Expert doesn't expose detail page screenshots publicly

---

## Sources Added to NotebookLM

| Source | ID | Reason |
|--------|-----|--------|
| https://ijungo.com/mortgage-crm-strategies-to-improve-loan-officer-productivity-in-2026/ | TBD | LO productivity focus + UI guidance for session 1 research |
| https://monday.com/blog/crm-and-sales/mortgage-crm/ | TBD | Mortgage CRM feature overview — good reference for what fields/sections leading tools expose |

---

## Briefing for Research Subagent (Session 1)

**Already in notebook — do NOT re-research:**
- Bankingbridge 2026 top 8 mortgage CRMs (source 2)
- Zeitro best CRM for loan officers (source 15)
- Aidium mortgage CRM (source 34)
- Mortgage pipeline management best practices (sources 29, 35)

**Research gaps for Session 1 to fill:**
- What does the LoanOS loan detail page CURRENTLY look like? (read the code — src/app/dashboard/loans/[id]/)
- What fields are rendered? How many sections? What's above the fold?
- What does Total Expert / SimpleNexus expose on their loan detail screen? (screenshots, docs)
- What are the "never-populated" fields in LoanOS loans table today? (quick Supabase audit)
