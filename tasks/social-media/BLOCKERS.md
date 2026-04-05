# Active Blockers — Social Media

## 2026-04-05 — BLOCKED: n8n GBP webhook `loanos-build` theme branch (Task 12)

**Blocker:** The `Weekly GBP + Social Post` workflow (ID `V6RhmJpOb7pOzMte`) has `availableInMCP: false` and cannot be modified via the n8n MCP. Attempted `get_workflow_details` returns: `"Workflow is not available in MCP. Enable MCP access in workflow settings."`

**What Adam needs to do:**
1. Open https://styer.app.n8n.cloud
2. Open workflow `Weekly GBP + Social Post` (ID `V6RhmJpOb7pOzMte`)
3. In workflow Settings, enable MCP access (toggle)
4. Save

**After unblock:** Re-run Task 12 of `tasks/social-media/plans/2026-04-05-pillar-framework-v2-plan.md` — adds `loanos-build` theme branch with builder-voice Gemini prompt + Imagen-skip + direct-image passthrough.

**Impact if not resolved:** GBP + cross-platform distribution of LoanOS content will still run through the existing rate/blog/newsletter theme prompts, which will incorrectly adapt LoanOS build-in-public posts with mortgage sales language. Only affects Tier 1 (immediate) GBP distribution of LoanOS content — Tier 2 (platform-native posts drafted by Architect/Builder) is unaffected and continues working.

**Codex fallback unavailable:** Codex CLI is not installed on this machine, so could not delegate the modification.
