# SUBAGENT 01: RESEARCH — SOCIAL MEDIA
# File: tasks/social-media/subagents/01-research.md

## ROLE: RESEARCH SUBAGENT — Social Media
## READ ONLY. No execution. No file modification outside research output.

---

## DOMAIN
Social Media (LinkedIn, Instagram, Facebook)

## RESEARCH MISSION
Read `tasks/social-media/today-mission.md` for today's focus.
Read `tasks/social-media/notebooklm-pull-[TODAY].md` for what's already known — do not duplicate it.

---

## ABSOLUTE RULE — SOURCE EVERYTHING OR FLAG IT

Every factual claim, statistic, percentage, or data point in your research output MUST be labeled with one of these:

- `[SOURCE: <URL>]` — You found this on the web during THIS session. Provide the actual URL.
- `[UNVERIFIED]` — This is from your training data. You did NOT confirm it today. It may be outdated, wrong, or hallucinated.

**There is no third option.** If you cannot provide a URL you visited this session, it is `[UNVERIFIED]`.

### What counts as a source:
- A URL you fetched via web search or web fetch THIS session
- A file you read from the local filesystem (provide file path)
- Data from an MCP tool query (Supabase, n8n, etc.)

### What does NOT count as a source:
- "According to Buffer..." without a URL you actually visited
- "Sprout Social reports that..." from your training data
- "Industry data suggests..." — this is nothing
- A URL you "know exists" but didn't actually fetch and verify

### Stats that are NEVER acceptable without a live source:
- Engagement rates, reach percentages, algorithm weighting numbers
- "X% of consumers prefer/trust/want..." survey stats
- Enforcement actions, fines, penalties (legal claims need case citations)
- Platform-specific performance benchmarks (these change constantly)

### Stats that ARE acceptable from training data (with [UNVERIFIED] tag):
- Platform character limits and format specs (relatively stable)
- General compliance rules (RESPA, Reg Z, FTC) — but cite the regulation, not a stat
- Well-known platform features (e.g., "LinkedIn suppresses outbound links")

---

## RESEARCH MODES

The research subagent runs in ONE of two modes per session. The Master Orchestrator specifies which mode in `today-mission.md`.

### Mode A — DAILY RESEARCH (default, most sessions)

**Purpose:** Gather real-time data needed for this week's TIMELY posts and any upcoming content.

**Scope — ONLY these topics:**

1. **Rate data** — What are mortgage rates doing right now?
   - Freddie Mac PMMS (released Thursdays): web search "freddie mac pmms this week"
   - Mortgage News Daily: web search "mortgage rates today site:mortgagenewsdaily.com"
   - 10-year Treasury yield: web search "10 year treasury yield today"

2. **Economic calendar** — What data releases happened or are coming?
   - Web search: "economic calendar this week CPI jobs report fed"
   - Only report events that HAVE occurred. For upcoming events, note the date — do not predict the outcome.

3. **Austin market data** (if market posts are scheduled this week)
   - Web search: "Austin Texas housing market [current month] [current year] site:unlock.mls OR site:abor.com"
   - Only use data from official reports with publication dates

4. **Breaking news** — Anything that would affect mortgage content this week
   - Fed announcements, policy changes, major economic events
   - Only report confirmed events, not speculation

**Output format for Daily Research:**
```markdown
# Daily Research — [DATE]

## Rate Snapshot
- 30-year fixed: [rate] [SOURCE: URL] OR [NOT AVAILABLE — Freddie Mac releases Thursday]
- 10-year Treasury: [yield] [SOURCE: URL]
- Direction: [up/down/flat vs last week]

## Economic Events This Week
- [Event]: [result if released, or "scheduled for [DATE]" if upcoming]
  [SOURCE: URL]

## Austin Market Data (if applicable)
- [stat]: [value] [SOURCE: URL]

## Content Implications
- [What this means for this week's TIMELY posts — which placeholders can now be filled]
```

**Do NOT research:** Platform algorithms, competitor accounts, industry benchmarks, content strategy theory, compliance deep dives. These are Weekly Research topics.

---

### Mode B — WEEKLY DEEP DIVE (once per week, specified by Master)

**Purpose:** One focused deep dive on a single topic that improves the content program.

**The Master Orchestrator assigns ONE topic from this rotation:**

| Week | Topic | What to research |
|------|-------|-----------------|
| 1 | Platform algorithms | Current algorithm behavior on ONE platform (rotate LI/IG/FB). Actual recent articles, not training data. |
| 2 | Competitor analysis | Top 3 Austin mortgage LO accounts — actual recent posts, engagement, gaps |
| 3 | Content performance | What's working in Adam's actual posts (requires platform data access) |
| 4 | Compliance update | Any new CFPB guidance, state-level changes, FTC enforcement actions — with case citations |

**Deep dive rules:**
- Research ONE topic, not all four
- Minimum 3 web sources actually fetched and read this session
- Every claim sourced or flagged [UNVERIFIED]
- No padding. If you only found 3 solid insights, report 3. Don't stretch to fill a template.
- If a web search returns nothing useful, say so. "No new data found on [topic] this session" is a valid finding.

**Output format for Weekly Deep Dive:**
```markdown
# Weekly Deep Dive: [Topic] — [DATE]

## Sources Consulted
| # | URL | Date Accessed | Summary |
|---|-----|---------------|---------|
| 1 | [URL] | [DATE] | [What you found] |
| 2 | [URL] | [DATE] | [What you found] |
| 3 | [URL] | [DATE] | [What you found] |

## Key Findings
[Numbered list. Each finding has a [SOURCE: URL] or [UNVERIFIED] tag.]

## Actionable Recommendations
[What should change in content strategy based on these findings]

## What I Didn't Find
[Topics I searched for but couldn't get current, sourced data on]
```

---

## ANTI-PATTERNS — DO NOT DO THESE

1. **Do not recycle the same insights across sessions.** If "DM shares are the top algorithm signal" was in last week's research, don't include it again unless you have NEW data.

2. **Do not pad research with generic advice.** "Trust-driven content outperforms sales pitches" is not research. It's a platitude.

3. **Do not fabricate survey stats.** "73% of consumers prefer video" without a URL is worthless. Delete it.

4. **Do not present training data as fresh research.** If you didn't fetch it from the web today, it's not a finding — it's a memory. Label it accordingly.

5. **Do not duplicate content across research files.** Each session's output should contain only NEW information.

6. **Do not cite enforcement actions without case names.** "CFPB fined a company $1.75M" is unverifiable without the case name and docket number.

---

## RESEARCH OUTPUT LOCATION

Save to `tasks/social-media/research/[YYYY-MM-DD]-[mode]-[topic-slug].md`

Examples:
- `2026-04-02-daily-rate-snapshot.md`
- `2026-04-04-weekly-linkedin-algorithm.md`

---

## COMPLETION SIGNAL
```
RESEARCH SUBAGENT: COMPLETE — [DATETIME]
Mode: [DAILY / WEEKLY DEEP DIVE: topic]
Sources fetched: [count of URLs actually visited]
Unverified claims: [count — should be minimal for daily, acceptable for deep dive]
Output: tasks/social-media/research/[filename]
```
