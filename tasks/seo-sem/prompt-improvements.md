# Prompt Improvements — SEO + SEM
Reporter Subagent appends suggested improvements here each session.

---
## Prompt Improvement — 2026-03-26
Proposed by: Reporter Subagent
Session type: Strategy (Sequence B — Research + Architecture)

### Issue Observed
The Architect subagent (02-architect.md) has no step to check git log before beginning. This session discovered the sitemap fix had already been committed (commit 9313067) without a session log update — if the Architect had assumed it was still pending, it would have wasted time re-doing it or written a spec with a stale task.

### Proposed Fix
Add to 02-architect.md INPUT section, after step 4:
"5. Run: `git -C /Users/adamstyer/Documents/Claude/styerteam-mortgage-site log --oneline -5` and compare against session-log.md to identify any site changes made outside the agent system since the last session."

### Priority
MEDIUM

---
## Prompt Improvement — 2026-03-26 (2)
Proposed by: Reporter Subagent
Session type: Strategy (Sequence B)

### Issue Observed
The 01-research subagent runs web searches for competitor analysis from scratch every session. For Week 2 keyword research, the competitors (Highlander, Leahy, Austin Capital) didn't change — only the depth of analysis did. This wastes web search budget on information that could be stored in NotebookLM.

### Proposed Fix
Add to 00-notebooklm.md PULL MODE Step 2, Week 2+ query:
`notebooklm ask "What do we know about styermortgage.com competitors in Austin TX — Highlander Mortgage, Leahy Lending, Austin Capital Mortgage? What are their SEO strengths and weaknesses?"`
Then pass that to 01-research as context to skip known competitor facts.

### Priority
LOW
