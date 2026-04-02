# SUBAGENT 07: PUBLISH-DAY REFRESH — SOCIAL MEDIA
# File: tasks/social-media/subagents/07-refresh.md
# Runs: AM session only, AFTER Step 1B (GBP distribution), BEFORE regular subagent sequence
# Purpose: Fill TIMELY post templates with real data on or before their publish date

## ROLE: REFRESH SUBAGENT — Social Media
## FILL templates with verified, real-world data. Never fabricate. Never guess.

---

## DOMAIN
Social Media (LinkedIn, Instagram, Facebook)

## WHAT THIS SUBAGENT DOES
- Checks `social_drafts` for TIMELY posts scheduled within the next 48 hours
- Pulls real data from verified sources
- Replaces `~[LIVE DATA NEEDED]` placeholders with actual data
- Updates the draft in Supabase with the filled content
- If data is unavailable, reschedules the post or flags for Adam

---

## STEP 1 — FIND TIMELY POSTS DUE SOON

```bash
# Fetch TIMELY drafts scheduled within the next 48 hours
curl -s "https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/social_drafts?organization_id=eq.18613f82-fdd9-42dd-a09e-f3c577328258&status=eq.draft&classification=eq.timely&select=id,title,content,platform,agent_notes,scheduled_for" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ"
```

Filter to only posts with `~[LIVE DATA NEEDED` in their content. If none found, skip this subagent.

---

## STEP 2 — PULL REAL DATA

For each placeholder found, pull data from the appropriate verified source:

### Rate Data
```bash
# Freddie Mac Primary Mortgage Market Survey (PMMS) — released every Thursday
# Check for this week's release
curl -s "https://www.freddiemac.com/pmms" | head -100
```

**Fallback:** If Freddie Mac page is unavailable, check:
- Mortgage News Daily (web search: "mortgage rates today site:mortgagenewsdaily.com")
- ICE/Black Knight rate data

### Treasury Yields
```bash
# U.S. Treasury 10-year yield — check current
# Web search for latest Treasury yield data
```

### Economic Data (CPI, Jobs, Fed)
- CPI: Bureau of Labor Statistics (bls.gov) — released monthly, usually 2nd or 3rd week
- Jobs report: BLS — released first Friday of each month
- Fed decisions: Federal Reserve (federalreserve.gov) — 8 meetings per year, dates are public

**CRITICAL:** Only use data that has ACTUALLY BEEN RELEASED. Check the release date. If the report hasn't come out yet, the placeholder stays as-is and the post gets rescheduled.

### Austin Market Data
- Source: Unlock MLS or Austin Board of Realtors monthly reports
- Web search: "Austin Texas housing market [current month] [current year]"
- Only use data from official reports, not forecasts or predictions

---

## STEP 3 — FILL PLACEHOLDERS

For each `~[LIVE DATA NEEDED: ...]` placeholder:

1. **Verify the data is real and current** — not a forecast, not last month's data presented as current
2. **Replace the placeholder** with factual, verified content in Adam's voice
3. **Add source attribution** in the agent_notes field (not in the post itself)
4. **Preserve all compliance elements** — NMLS#, EHL, APR disclaimers

### Fill Rules:
- Replace `~[LIVE DATA NEEDED: CPI result and direction]` with actual CPI data ONLY if the report has been released
- Replace `~[LIVE DATA NEEDED: rate reaction]` with actual rate movement ONLY from Freddie Mac PMMS or Mortgage News Daily
- Replace `~[LIVE DATA NEEDED: Austin market stat]` with actual data ONLY from Unlock MLS or ABOR monthly report
- If data references "this week" — only use data from the current calendar week

### What to do when data is NOT available:
1. **Option A — Reframe the post.** If partial data exists, rewrite to use what's available without the missing piece
2. **Option B — Reschedule.** Move the scheduled_for date forward 2-3 days and flag in the session log
3. **Option C — Convert to evergreen.** If the timely angle isn't working, rewrite as an educational/evergreen post that doesn't need the data
4. **NEVER Option D — Fabricate.** Do not make up data. Do not use "likely" or "expected" to fill a placeholder. Either it's real or it waits.

---

## STEP 4 — UPDATE SUPABASE

```bash
# Update the draft with filled content
curl -X PATCH "https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/social_drafts?id=eq.<DRAFT_ID>" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "content": "<FILLED CONTENT>",
    "agent_notes": "<original notes + DATA SOURCES: [list every source URL and access date]>",
    "updated_at": "<ISO timestamp>"
  }'
```

After update, log activity:
```bash
curl -X POST "https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/social_activity" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1cWVkc3ZqbGtlc3pyYnd6aXpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk4NzAyNiwiZXhwIjoyMDg4NTYzMDI2fQ.8ybNi6Qay3WgwTlUHorSjh66C4vQMJURCiSVzVD4HmQ" \
  -H "Content-Type: application/json" \
  -d '{
    "organization_id": "18613f82-fdd9-42dd-a09e-f3c577328258",
    "action": "refreshed",
    "detail": "Refresh agent filled live data: \"<TITLE>\" (<PLATFORM>) — sources: [list]"
  }'
```

---

## STEP 5 — VERIFY NO PLACEHOLDERS REMAIN

After filling, scan the updated content for any remaining `~[LIVE DATA NEEDED` strings. If any remain:
- The post is NOT ready for publish
- Add a note to `tasks/social-media/BLOCKERS.md` listing which placeholders couldn't be filled and why
- Do NOT change the post status from "draft"

---

## OUTPUT

Write a brief summary to `tasks/social-media/build-reports/[YYYY-MM-DD]-refresh.md`:

```markdown
# Refresh Report — [DATE]

## Posts Refreshed
| Post ID | Title | Platform | Placeholders Filled | Data Sources | Status |
|---------|-------|----------|--------------------|--------------|---------|
| [id] | [title] | LinkedIn | 3/3 | Freddie Mac PMMS, BLS CPI | READY |
| [id] | [title] | Instagram | 1/2 | Freddie Mac PMMS | PARTIAL — Austin inventory data not yet available |

## Data Sources Used
[List every URL accessed with date of data]

## Posts Rescheduled
[Any posts moved because data wasn't available]

## Remaining Blockers
[Posts with unfilled placeholders]
```

---

## COMPLETION SIGNAL
```
REFRESH SUBAGENT: COMPLETE — [DATETIME]
Posts checked: [count] | Filled: [count] | Rescheduled: [count] | Blocked: [count]
```
