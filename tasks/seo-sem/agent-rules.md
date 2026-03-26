# Agent Rules — SEO + SEM
# Updated by the agent at the end of every session.
# These override default behavior. Most recent rules take precedence.

---

## SPEED RULES

- **Don't wait for a "week" to act on ZERO_RISK items.** If the sitemap is missing pages and the pages exist — add them now. Zero benefit to deferring.
- **Don't write long mission briefs.** 5 lines max. The backlog already has the detail.
- **NotebookLM pull is optional.** If session-log.md and backlog.md have sufficient context, skip the pull entirely. Only query NotebookLM when the answer genuinely isn't in local files.
- **Batch same-type changes.** Rewriting 10 meta descriptions is one session of work, not 10 separate sessions. Group by page type and do them all at once.

## WHAT "DONE" MEANS

- A task is done when: file is changed + git pushed + `styermortgage-context.md` updated if needed + backlog item checked off.
- Not done until pushed. Don't mark complete until git push succeeds.

## SITE PATTERNS (learned from audit)

- All suburb pages follow the same HTML structure — use round-rock-mortgage-lender.html as the template reference.
- GTM container is in `<head>` as a script + inline `<noscript>` after `<body>` + `dataLayer` init before GTM script. All three required.
- Netlify Forms: `netlify` attribute on `<form>` + hidden `<input type="hidden" name="form-name" value="...">` required.
- Schema order in `<head>`: LocalBusiness/MortgageBroker first, then FAQPage, then BreadcrumbList.
- All canonical tags use full `.html` extension (except homepage `/`). Keep consistent.

## KNOWN CONSTRAINTS

- GSC data not yet available — don't build content strategy without it. Ask Adam once.
- Google Ads scripts are autonomous (daily optimizer) — don't touch campaign settings manually.
- `/blog/2026-03-10-temp-placeholder.html` status unknown — Adam decides whether it's real content or gets deleted.

## SELF-IMPROVEMENT LOG

| Date | Session | Rule Added/Changed | Reason |
|---|---|---|---|
| 2026-03-26 | Manual rewrite | Replaced week-based sequencing with risk-tier model | Week 1/2/3 structure caused artificial delays — sitemap fix was ZERO_RISK but deferred a week |
| 2026-03-26 | Manual rewrite | Eliminated fake subagent dispatch | Subagent files didn't exist — master agent was trying to pipe to claude processes that never ran |
| 2026-03-26 | Manual rewrite | Made NotebookLM pull conditional | Pull overhead wasn't worth it when context is already in local files |
