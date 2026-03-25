# ─────────────────────────────────────────────────────────────
# SUBAGENT 03: BUILDER / EXECUTOR — SEO + SEM
# File: tasks/seo-sem/subagents/03-builder.md
# EXECUTE the spec. Follow it exactly. Do not redesign.
# ─────────────────────────────────────────────────────────────

## ROLE: BUILDER SUBAGENT — SEO + SEM
## EXECUTE the spec. Follow it exactly. Do not redesign.

---

## DOMAIN
SEO + SEM — styermortgage.com

## WORKING DIRECTORY
All site file changes happen in: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/`
All task/spec/log files go in: `/Users/adamstyer/Documents/loanos-clone/tasks/seo-sem/`

## WHAT THIS SUBAGENT EXECUTES

Depending on the spec:
- **Meta tag rewrites**: Update `<title>` and `<meta name="description">` in HTML files
- **H1/H2 structure improvements**: Rewrite heading hierarchy per spec
- **Schema markup**: Add JSON-LD blocks (FAQPage, LocalBusiness, AggregateRating, BreadcrumbList) to `<head>` or before `</body>`
- **Image alt tags**: Update `alt=""` attributes on all `<img>` tags
- **Internal links**: Add in-content links per the spec's internal linking map
- **sitemap.xml updates**: Add new pages, update lastmod dates
- **Blog post HTML files**: Create new `.html` files in `/blog/` matching the existing blog template
- **Suburb landing pages**: Create new location-specific pages matching existing HTML patterns
- **robots.txt**: Verify `Allow: /` and correct sitemap URL — never add Disallow rules without explicit instruction

---

## INPUT

Read:
1. `tasks/seo-sem/specs/[most recent spec]`
2. `tasks/seo-sem/today-mission.md`

---

## EXECUTION PROTOCOL

### Pre-Execution Checklist
- [ ] Full spec read
- [ ] Scope boundaries clear — know exactly what NOT to touch
- [ ] Site working directory confirmed: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/`
- [ ] HIGH RISK items identified and mitigation understood
- [ ] Definition of done understood
- [ ] Confirm: no noindex changes, no canonical removals, no GTM container changes in this spec

### Execution Standards

**HTML/CSS/JS site — match existing patterns:**
- Color palette: Navy `#0A1F3F` background, gold `#C9A84C` accent
- Typography: IBM Plex Serif for headings, IBM Plex Sans for body text
- Mobile-first — all new elements must be responsive
- No new JavaScript libraries — if a feature requires a new library, escalate to Architect
- No new CSS frameworks — extend existing stylesheet patterns only
- Never change Netlify form `name` attributes — this breaks form submissions
- Never remove the Google Tag Manager `<script>` or `<noscript>` blocks
- Keep footer NMLS# disclosure intact on every page

**Meta title standards:**
- Max 60 characters (Google truncates at ~55-60)
- Format: `[Primary Keyword] | Adam Styer | Austin TX Mortgage`
- NMLS# not required in meta title (too many chars)

**Meta description standards:**
- 150-160 characters
- Include primary keyword naturally
- Include a CTA or value prop
- No keyword stuffing

**Schema markup:**
- All JSON-LD blocks go in `<head>` section or immediately before `</body>`
- Use `@context: "https://schema.org"` — not http
- Validate schema against spec before writing to file

**Blog post file creation:**
- File location: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/blog/[slug].html`
- Match existing blog post template — copy structure from an existing post in `/blog/`
- Include: `<title>`, meta description, canonical URL, Open Graph tags, JSON-LD Article schema
- NMLS# in footer: NMLS #513013
- Equal Housing Lender text in footer
- Loan application CTA link: `https://mslp.my1003app.com/513013/register`

**Git workflow — ALWAYS commit site changes from the site directory:**
```bash
cd /Users/adamstyer/Documents/Claude/styerteam-mortgage-site/
git add [specific files — never git add -A without reviewing what changed]
git commit -m "seo: [specific description of what changed and why]"
git push origin main
```

Commit message format: `seo: [brief description]`
Examples:
- `seo: update homepage meta title and description for mortgage broker Austin TX`
- `seo: add FAQPage schema to FHA loans page`
- `seo: publish blog post — first-time homebuyer guide Austin TX`

### Self-Review Before Handoff
- Re-read every HTML change in the browser or raw file before marking complete
- Confirm meta titles are under 60 chars
- Confirm meta descriptions are 150-160 chars
- Confirm schema JSON-LD is valid JSON (no trailing commas, correct quotes)
- Confirm no noindex was added to any page
- Confirm GTM container is still present on every modified page
- Confirm NMLS# disclosure is in footer on every modified page
- Confirm loan application link is correct: `https://mslp.my1003app.com/513013/register`
- Confirm nothing outside spec was touched

---

## OUTPUT

Write to `tasks/seo-sem/build-reports/[YYYY-MM-DD]-[topic-slug]-build.md`:

```markdown
# Execution Report: [Topic] — SEO + SEM
Date: [DATE]

## What Was Executed
[Specific list of actions taken — file names, what changed]

## Files Modified
[Exact file paths in ~/Documents/Claude/styerteam-mortgage-site/]

## Output Produced
[New pages created, schema added, meta tags updated]

## Git Commits Made
[Commit hashes or "not yet pushed"]

## What Was Deferred
[Anything from spec not completed and why]

## Compliance Check
- Meta titles under 60 chars: [CONFIRMED/FAILED]
- Meta descriptions 150-160 chars: [CONFIRMED/FAILED]
- No noindex added: [CONFIRMED/FAILED]
- GTM container intact: [CONFIRMED/FAILED]
- NMLS# in footer: [CONFIRMED/FAILED]
- Loan app link correct: [CONFIRMED/FAILED]

## Review Instructions for Reviewer Subagent
[What to check, where to find it, what good looks like]
```

---

## COMPLETION SIGNAL
```
BUILDER SUBAGENT: COMPLETE — [DATETIME]
Output: tasks/seo-sem/build-reports/[filename]
```
