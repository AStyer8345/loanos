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

- A task is done when: file is changed + git pushed + `CONTEXT.md` updated (replace, don't append) + `CHANGELOG.md` entry appended if needed + backlog item checked off.
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

## BATCH PROCESSING RULES

- **Batch meta description edits by page type.** Reading all files in parallel then editing in parallel is 5x faster than read-edit-read-edit per file. Always group file reads into a single pass before starting edits.
- **When the context file says something is done, verify against the actual file before skipping it.** The context file claimed H1 was updated but the actual index.html had the old title. Always trust the source file, not the context doc.
- **38 files in one commit is fine.** Don't batch into multiple commits just for aesthetics — one commit per logical session is cleaner for git history.

## BLOG INDEX SYNC RULE (added 2026-04-01)

When any new blog post is created or added to manifest.json:
1. Add a `<li><a href="...">Title</a></li>` entry to the `<noscript>` block in blog.html (static crawler links)
2. Add a `ListItem` entry to the CollectionPage JSON-LD schema in blog.html (increment position number)
3. Both must stay in sync with manifest.json — if manifest has it, blog.html noscript + schema must too

This was the root cause of blog posts not appearing in Google `site:` searches — the blog index only showed 3 static links to crawlers.

## SELF-IMPROVEMENT LOG

| Date | Session | Rule Added/Changed | Reason |
|---|---|---|---|
| 2026-03-26 | Manual rewrite | Replaced week-based sequencing with risk-tier model | Week 1/2/3 structure caused artificial delays — sitemap fix was ZERO_RISK but deferred a week |
| 2026-03-26 | Manual rewrite | Eliminated fake subagent dispatch | Subagent files didn't exist — master agent was trying to pipe to claude processes that never ran |
| 2026-03-26 | Manual rewrite | Made NotebookLM pull conditional | Pull overhead wasn't worth it when context is already in local files |
| 2026-03-27 | AM | Added batch processing rules | 38 files done in one session — parallel reads + parallel edits is much faster than sequential |
| 2026-03-27 | AM | Added context file verification rule | Context file falsely claimed H1 was updated — caught by reading actual source file |
| 2026-03-28 | AM | FLAG_FOR_ADAM items are not permanent deferrals | thank-you.html noindex was flagged for Adam but the correct action was obvious — restore noindex. FLAG_FOR_ADAM means "don't change without thinking", not "never touch". Apply judgment. |
| 2026-03-28 | AM | Blog post template verified | blog/2026-03-27-down-payment-assistance-texas-2026.html is the cleanest current template. Use it for all new blog posts. |
| 2026-03-29 | AM | Suburb thin-content risk is low | All suburb pages built from the same template — 522 lines, 40+ content elements. Thin content is not a risk. Don't re-audit unless a new suburb page is added manually. |
| 2026-03-29 | AM | ADAM-TODO deploy items: include in SEO commit if code-complete | When ADAM-TODO has a [LEAD-GEN] DEPLOY item tagged for today with "code-complete and QA-passed", include those files in the current git push. Don't leave deploy-ready code sitting uncommitted when you're already pushing. |
| 2026-03-29 | AM | notebooklm note create syntax | Title goes with -t flag, content as positional arg in quotes. Example: `notebooklm note create "content here" -t "title here"` |
| 2026-03-30 | AM | QA new lead-gen pages on first AM after deploy | Rate Alert Funnel had title (79 chars) + canonical (missing .html) issues caught on post-deploy QA. Always check title length + canonical format on any newly deployed landing page. |
| 2026-03-30 | AM | Canonical convention: all site pages use .html extension | austin-mortgage-rates.html and rate-alert.html both had canonicals without .html extension. Site convention is .html on all pages except homepage. Catch this on any new page creation. |
| 2026-03-31 | AM | Check for new untracked blog files each session | March 30 session created 2 new blog files that weren't in prior session's QA — check `ls blog/` at start of every AM session for untracked files not yet in sitemap/manifest |
| 2026-03-31 | AM | temp-placeholder filename = real post pattern repeating | Third instance of a real post at a temp-placeholder URL (2026-03-06, 2026-03-10, and now 2026-03-30). Always noindex the temp URL + update its canonical. The proper-slug version becomes the canonical source. |
| 2026-04-01 | AM | Suburb pages have 3+ different form HTML variants | Not all suburb pages use the hero-quick-form-actions pattern — some use an older "form-group/btn-full" structure. When batch-editing forms, check indentation and structure on skipped files rather than assuming one pattern covers all 24. |
| 2026-04-01 | AM | BOFU blog posts get broker-vs-bank table | High-intent "how to choose a lender" type posts benefit from a side-by-side comparison table as a mid-post anchor — good for dwell time and featured snippet eligibility. |
| 2026-04-05 | AM | Check blog/ for new untracked posts every AM session | 5 new posts appeared since last AM session (Apr 1–4) with no prior QA. Always `ls blog/` at session start and run the title/meta/canonical/noindex check on any file newer than the last session log entry. |
| 2026-04-05 | AM | Blog CTA audit: global nav link is not a content CTA | `mslp.my1003app.com` appears in nav "Apply Now" button across all pages — this is by design, not a CTA issue. Only flag raw loan app links inside post body content. |
| 2026-04-05 | AM | Non-QM expansion: check DSCR page before creating a new page | The bank statement + asset depletion section was already in dscr-loan-austin-tx.html at #non-qm. Check existing pages before adding duplicate content as a new page. |
| 2026-04-05 | AM | Title tag convention: "| NMLS #513013" suffix saves 12 chars vs "| Adam Styer | NMLS #513013" | Drop "Adam Styer" from title suffix when title is already at 55+ chars. Retains regulatory compliance and trust signal. |
| 2026-04-06 | AM | Suburb form variants: 4 distinct indentation patterns exist | V1=22-space (hero-quick-form-actions, 14 pages), V2=btn-full (buda+westlake, 2 pages), V3=16-space (elgin/florence/jarrell/marble-falls/smithville/spicewood, 6 pages), V4=18-space (kyle+san-marcos, 2 pages). Always use Python replace(), not sed, for multi-line suburb form edits. |
| 2026-04-06 | AM | City enrichment: add commute times + school district specifics as a standalone paragraph | Best format: `<strong>City at a glance:</strong>` paragraph with school campus names, commute times to 2-3 major employers/destinations, and price range by neighborhood. Insert after the main "why X" intro paragraph. One paragraph is enough — don't add a whole new section. |
| 2026-04-07 | AM | Mortgage glossary page: use closing-costs-texas.html as template, not blog template | Resource/guide pages use the `hero-short` hero + `container-narrow article-body` content format — not the blog date/author header. Glossary uses `h3` with `id` anchors for each term so they're linkable from other pages. |
| 2026-04-07 | AM | DSCR ROI examples: show honest math including negative cash flow scenarios | Adam's brand is radical transparency. Don't show only the winning scenarios. Core Austin LTR is negative cash flow — say so, and explain why investors still buy there. This builds credibility with sophisticated investors who already know the numbers. |
