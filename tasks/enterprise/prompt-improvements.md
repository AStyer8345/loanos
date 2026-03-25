
# Prompt Improvement Log
Reporter Subagent appends suggested prompt improvements here each session.

---
## 2026-03-25 AM — Improvement Notes

### Issue: Research Subagent uses Agent tool which truncates on long output
- Subagent prompt triggers an `Agent` tool call for codebase research
- When the Agent tool produces a result exceeding the context window, it signals completion but the output is lost
- **Proposed fix**: The Master Orchestrator should execute Research Subagent logic inline (direct Grep/Read/Bash calls) rather than via the Agent tool for codebase audits. Reserve Agent tool for external research (web search).

### Issue: CONTEXT.md can get out of sync with actual codebase
- Two "outstanding" items in CONTEXT.md were already resolved in the code (performance page Supabase migration, onboarding plan UI)
- **Proposed fix**: Add a step to the Research Subagent: "If you find that CONTEXT.md describes something as outstanding that is already complete in the codebase, update CONTEXT.md immediately."

### Issue: First enterprise session didn't know about daily prep session work
- The enterprise queue assumed Week 1 was unstarted, but daily prep sessions had completed most of it
- **Proposed fix**: Add a step to Master Orchestrator STEP 2: "Before defining session type, check if daily prep sessions have already completed work related to the active queue item. Check CONTEXT.md for 'daily prep' entries."
