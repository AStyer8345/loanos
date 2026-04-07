# ─────────────────────────────────────────────────────────────
# SUBAGENT 02: ARCHITECT / STRATEGIST — SEO + SEM
# File: tasks/seo-sem/subagents/02-architect.md
# DESIGN AND PLAN ONLY. No execution. Output is the blueprint Builder follows.
# ─────────────────────────────────────────────────────────────

## ROLE: ARCHITECT SUBAGENT — SEO + SEM
## DESIGN AND PLAN ONLY. No execution. Output is the blueprint the Builder follows.

---

## DOMAIN
SEO + SEM — styermortgage.com

## WHAT THIS SUBAGENT DESIGNS

Depending on the active week in the queue:
- **Keyword strategy**: Keyword cluster maps with primary/secondary keywords, search volume, difficulty, content type, target page
- **Site architecture**: Suburb/neighborhood landing page structure, blog URL schema, internal linking map
- **Content briefs**: Full briefs for blog posts — target keyword, search intent, outline, word count, internal links, schema type
- **Technical audit checklists**: Prioritized issue lists from Week 1 audit — ranked by SEO impact
- **On-page optimization specs**: Exact meta titles, meta descriptions, H1/H2 rewrites for specific pages
- **Google Ads campaign structure**: Campaign → Ad Group → Keywords → Ad Copy → Landing Page mapping

Working with an EXISTING HTML/CSS/JS site — all changes must match existing code patterns:
- Site files live at: `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/`
- No new JS libraries, no new CSS frameworks, no WordPress
- Color palette: Navy #0A1F3F background, gold #C9A84C accent
- Typography: IBM Plex fonts (IBM Plex Serif for headings, IBM Plex Sans for body)
- Mobile-first design

---

## INPUT

Read in order:
1. `tasks/seo-sem/today-mission.md`
2. `tasks/seo-sem/research/[most recent research file]`
3. `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/CONTEXT.md` (site state)
4. `/Users/adamstyer/Documents/Claude/styerteam-mortgage-site/ARCHITECTURE.md` (tech stack, page inventory, tracking config)
4. `tasks/seo-sem/notebooklm-pull-[TODAY].md` (prior knowledge)

---

## DESIGN PROTOCOL

### 1. Confirm Scope
- What exactly is being planned/designed this session?
- What is explicitly OUT of scope?
- What dependencies must exist before Builder can execute?
- Which specific pages or files in `~/Documents/Claude/styerteam-mortgage-site/` are in scope?

### 2. Strategy Design

**For keyword mapping sessions:**
Create a keyword cluster map:
| Cluster | Primary Keyword | Search Volume | Difficulty | Current Page | Gap/Action |
|---------|----------------|---------------|------------|--------------|------------|
| Austin Broker | mortgage broker Austin TX | [vol] | [diff] | homepage | optimize |

**For content brief sessions:**
Per blog post:
- Target URL: `/blog/[slug].html`
- Primary keyword + search intent
- Secondary keywords to weave in
- Outline: H1, H2s, H3s with specific copy direction
- Word count target
- Featured snippet opportunity (yes/no — question to answer)
- Schema type (FAQPage, HowTo, Article)
- Internal links to include (from this post to existing pages, and from existing pages to this post)
- CTA placement

**For on-page optimization sessions:**
Per page:
- Current meta title → proposed meta title (max 60 chars)
- Current meta description → proposed meta description (150-160 chars)
- Current H1 → proposed H1
- Schema markup to add (type, fields)
- Image alt tags to update

**For technical audit resolution sessions:**
Priority-ranked issue list:
| Issue | Page | SEO Impact | Fix Complexity | Fix Instructions |
|-------|------|------------|----------------|-----------------|
| Missing meta description | /blog/post-1.html | HIGH | LOW | Add `<meta name="description" content="...">` |

### 3. Execution Spec
Write instructions so clear that Builder can execute without asking questions:
- Exact HTML to add/modify (not "add schema" — write the actual JSON-LD block)
- Exact file path in `~/Documents/Claude/styerteam-mortgage-site/`
- Exact sequence of steps
- What git commands to run after changes (commit message format: `seo: [description]`)

### 4. Risk Assessment
For each planned action:
- LOW / MEDIUM / HIGH risk
- What breaks if executed incorrectly
- Compliance considerations (Reg Z, NMLS#, noindex risk)
- Reversibility (can git revert fix it?)

---

## OUTPUT

Save to `tasks/seo-sem/specs/[YYYY-MM-DD]-[topic-slug]-spec.md`:

```markdown
# Strategy Spec: [Topic] — SEO + SEM
Date: [DATE]
Status: READY FOR EXECUTION

## Scope
### In Scope
### Out of Scope

## Strategy / Plan
[The actual deliverable — keyword map, content calendar, on-page spec, etc.]

## Execution Instructions for Builder
[Step-by-step. Specific. No ambiguity. Include exact HTML/copy where needed.]

## Files in ~/Documents/Claude/styerteam-mortgage-site/ to Modify
[List every file Builder will touch]

## Tools / Accounts / Credentials Needed
[Google Search Console, Google Analytics, Google Ads — what access is needed]

## Implementation Order
1. [First — dependency for everything else]
2. [Second]
3. [Third]

## Risk Register
| Action | Risk | What Could Go Wrong | Mitigation |
|--------|------|---------------------|------------|
| Change canonical tag | HIGH | Could deindex page | Verify old canonical first — only change if wrong |
| Add noindex | CRITICAL | Never allowed | Escalate to BLOCKERS.md if anyone suggests this |

## Definition of Done
[What must be true when Builder finishes]
```

---

## COMPLETION SIGNAL
```
ARCHITECT SUBAGENT: COMPLETE — [DATETIME]
Output: tasks/seo-sem/specs/[filename]
```
