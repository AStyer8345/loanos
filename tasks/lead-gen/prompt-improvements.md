# Prompt Improvement Suggestions — Lead Generation Agent

# Append-only. Do not delete entries.

---
## 2026-03-25 Improvement Suggestions

### From this session:
- **01-research.md** should explicitly instruct: "Check if Netlify Forms is active and where form submissions currently route — this is critical before building any web form automation." The audit identified that web form destination was unknown but the subagent prompt didn't specifically call this out.
- **00-notebooklm.md** PULL mode: NotebookLM queries on a freshly-created notebook produce generic context from seeded files. On subsequent sessions, queries will be more useful. Flag in pull report when notebook is brand new.

---
## 2026-03-26 Improvement Suggestions

### From this session:
- **master-agent.md** should distinguish between "emergency fix" work and "Week 1 = research only" rule. Rule should read "Do NOT build or deploy funnels" not "Do NOT write any code." Writing a TCPA fix HTML snippet (prep only, Adam deploys) is appropriate for research sessions.
- **00-notebooklm.md** pull report should note session number (e.g., "Session 3") to contextualize query quality — first-session queries are generic, later sessions produce more specific answers.

---
## 2026-03-27 Improvement Suggestions

### From this session:
- **02-architect.md** should require a "Decision Needed" block in the spec: "For each open question that blocks Builder execution, add a TODO item to ADAM-TODO.md." Open questions (SMS provider, Calendly type, business hours) were left only in the research file — they should have been surfaced to Adam explicitly.
- **02-architect.md** should formalize the spec format: Execution Instructions section with numbered steps and exact file paths/code snippets is what makes specs actionable for Builder. Add this as a required section in the Architect prompt.
- **06-reporter.md** should include a step: "For each open question that blocks Builder execution, check if an ADAM-TODO item has been created. If not, create it."

---
## 2026-03-28 Improvement Suggestions

### From this session:
- **03-builder.md** should include a post-build step: "Update BLOCKERS.md with the current status of any blockers affected by this build." The reviewer found BLOCKER-002 was already resolved before this session with no status update in BLOCKERS.md.
- **05-qa.md** should include step: "Verify n8n workflow active status via MCP `search_workflows` or `get_workflow_details` before reporting. Do not rely on build report for workflow status."
- **02-architect.md** should add: "Search site repo for existing pages related to the new funnel — they may be natural promotion points or require modification." The Rate Alert architect session organically found `austin-mortgage-rates.html` as a promotion point; this should be a required step.

---
## 2026-03-29 Improvement Suggestions

### From this session:
- **05-qa.md** should add fallback note: "If `mcp__n8n-mcp__get_workflow_details` returns 'Workflow is not available in MCP' (workflows with `availableInMCP: false`), fall back to `mcp__n8n-mcp__search_workflows` with the workflow name as query. The search result will show `active: true/false`."
- **03-builder.md** should add explicit Step 1 for any session that introduces new funnels or touches subscribe-lead.js: "Read `netlify/functions/subscribe-lead.js` and verify the `lead_source` gate conditions before writing any new HTML or JS. Document which functions will and will NOT fire for the new funnel's lead_source value."
- **04-reviewer.md** Quality input validation: The 03b Quality → 04 Reviewer ordering worked well this session — 0 rewrites required at review stage because 03b had already cleared all quality issues. Add a line to the Reviewer prompt: "Quality subagent (03b) has already reviewed copy. Do not re-score copy quality. Focus exclusively on compliance, spec adherence, brand, and technical correctness."

---
## 2026-03-30 Improvement Suggestions

### From this session:
- **05-qa.md post-deploy protocol** should add: "For any Netlify function that calls external services, check EACH service's sub-key in the response body separately (e.g., `mailchimp: "ok"`, `loanos: "failed"`). A top-level `success: true` is deceptive — it reflects Netlify function completion, not end-to-end success. A partial failure will be hidden unless sub-keys are read." The LOANOS failure was missed by surface-level response inspection.
- **05-qa.md** should include a serverless async code review step during post-deploy QA: "For any async function invoked inside a serverless handler (Netlify, Vercel, AWS Lambda), verify it is awaited. If not awaited, flag as BLOCKER — fire-and-forget in serverless terminates before the async call completes." The `notifyPreApprovalLead()` bug escaped code-level QA.
- **03-builder.md** subscribe-lead.js checklist should require: "Verify the `LOANOS_URL` constant resolves to a real, reachable Vercel project domain. If hardcoded, look up actual Vercel project domains via `mcp__ffdaa602-...list_projects` and confirm match. Flag hardcoded URLs as deploy risks if they cannot be externally verified."
