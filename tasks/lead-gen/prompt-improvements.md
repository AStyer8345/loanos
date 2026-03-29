# Prompt Improvements — Lead Generation
Reporter Subagent appends suggested improvements here each session.

---
## 2026-03-25 AM Improvement Suggestions

### From this session:
- **01-research.md** should add a Step 5 item: "Verify where styermortgage.com form submissions are routed today — check if Netlify Forms is configured (look at form HTML for `netlify` or `data-netlify` attribute), whether a confirmation redirect URL is set, and whether Adam currently receives email notifications for new submissions." This is a prerequisite gap for all web funnel work and the research subagent missed it because the prompt doesn't call it out explicitly.
- **00-notebooklm.md PULL mode** should add a note at the start: "If this is the first session (notebook was just created), the pull queries will return context seeded from foundational docs only. Note this in the pull report so downstream subagents understand the context is foundational, not historical."
- **master-agent.md** Step 1 instructs to read `notebooklm-pull-[TODAY].md` but this file doesn't exist at Step 1 — it's created in Step 3. The EXECUTION ORDER should reflect that the pull report is available after Step 3, not before. Reorder: Step 1 reads session-log + domain-queue + CONTEXT + BLOCKERS. Step 3 runs NotebookLM and produces the pull report. Step 4 incorporates the pull report findings.
- **01-research.md** should explicitly instruct: "Check if there are any active Google Analytics or Plausible analytics scripts on styermortgage.com (view page source or use WebFetch to look for `gtag`, `_paq`, or Plausible script tags). Without analytics tracking, conversion improvements cannot be measured."

---
## 2026-03-26 AM Improvement Suggestions

### From this session:
- **master-agent.md** "Week 1 Rule: Run Sequence A (Research Only)" is too broad. The rule should be "Do NOT deploy funnels or trigger email sends until Week 1 audit is complete." Writing code snippets or fix specs for Adam to review is appropriate in research sessions. The current wording could be read as blocking prep work that has no risk.
- **00-notebooklm.md** PULL report should include "Session number: X of program" so downstream subagents know whether they're working from a brand-new notebook (limited historical context) or an established one. Second session pull was significantly richer than first.
- **subagent-status.md** signal format is written twice per session (scheduled task writes SESSION_START in the intro block, then master-agent Step 2 writes it again in the status block). These are redundant. Consider combining — scheduled task writes the header, master-agent Step 2 only writes the status block signal.
- **01-research.md** "Performance Data — Adam's Current State" section should include: "Check the Netlify functions directory (/netlify/functions/) if local website code is accessible — this reveals what automations are actually wired vs. what was planned." The subscribe-lead.js discovery this session was critical and came from reading local files, not from the public site.

---
## 2026-03-27 Improvement Suggestions

### From this session:
- **Architect subagent prompt** (02-spec.md or equivalent) should formalize the required spec structure based on what produced a high-quality, immediately-executable output this session: (1) Scope — In/Out, (2) Funnel Architecture with subsections for each component, (3) Execution Instructions with numbered steps in dependency order, exact file paths, and code snippets, (4) Test plan in numbered order, (5) Risk Register, (6) Compliance Checklist, (7) Definition of Done with checkboxes. This structure made the spec directly usable by Builder with no interpretation.
- **Reporter subagent prompt** should add a step: "For each open question documented in the research file that blocks Builder execution, add a separate TODO item for Adam in ADAM-TODO.md." This session left 6 open questions in the research file that should have been surfaced as discrete action items (SMS provider decision, Mailchimp audience confirmation, Calendly event type, business hours for thank-you page, landing page URL choice, email branch timing preference). These are decision gates that should be visible on Adam's dashboard.
- **Architect / Researcher** should flag when data quality issues create a systemic gap. The 77% null/Other lead source finding in the contacts table is strategically significant — it means all future attribution reporting will be unreliable until fixed. This warrants a dedicated "Data Hygiene" ticket in ADAM-TODO.md, not just a note in the research file.
