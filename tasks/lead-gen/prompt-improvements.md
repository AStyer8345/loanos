# Prompt Improvements — Lead Generation
Reporter Subagent appends suggested improvements here each session.

---
## 2026-03-25 AM Improvement Suggestions

### From this session:
- **01-research.md** should add a Step 5 item: "Verify where styermortgage.com form submissions are routed today — check if Netlify Forms is configured (look at form HTML for `netlify` or `data-netlify` attribute), whether a confirmation redirect URL is set, and whether Adam currently receives email notifications for new submissions." This is a prerequisite gap for all web funnel work and the research subagent missed it because the prompt doesn't call it out explicitly.
- **00-notebooklm.md PULL mode** should add a note at the start: "If this is the first session (notebook was just created), the pull queries will return context seeded from foundational docs only. Note this in the pull report so downstream subagents understand the context is foundational, not historical."
- **master-agent.md** Step 1 instructs to read `notebooklm-pull-[TODAY].md` but this file doesn't exist at Step 1 — it's created in Step 3. The EXECUTION ORDER should reflect that the pull report is available after Step 3, not before. Reorder: Step 1 reads session-log + domain-queue + CONTEXT + BLOCKERS. Step 3 runs NotebookLM and produces the pull report. Step 4 incorporates the pull report findings.
- **01-research.md** should explicitly instruct: "Check if there are any active Google Analytics or Plausible analytics scripts on styermortgage.com (view page source or use WebFetch to look for `gtag`, `_paq`, or Plausible script tags). Without analytics tracking, conversion improvements cannot be measured."
