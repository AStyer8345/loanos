# Prompt Improvements — Social Media Agent
# Append-only. Specific improvements per subagent, per session.

---
## Session: 2026-04-09 PM

### 03a-builder.md — Contraction Preservation in SQL/JSON Payloads
**Problem:** Builder strips contractions when constructing JSON or SQL string payloads. This session required PATCH updates on Posts 97, 99, and 100 to restore: "You're", "I've", "I'd", "Here's", "It's", "let's". The voice becomes robotic without contractions — Quality subagent flags it every time.

**Fix:** Add to 03a-builder.md under the voice/formatting section:
> CONTRACTION PRESERVATION RULE: Never expand contractions to avoid JSON/SQL escaping. Instead, escape apostrophes using the SQL standard (double the single quote: `''`). Example: the phrase `I've seen` should appear as `I''ve seen` in a SQL string literal. Test your content before INSERT: if "I've" appears as "I have" or "Here's" appears as "Here is" — fix before submitting.

### 04-reviewer.md — TIMELY Template Contraction Check
**Problem:** Post 101 was inserted with contractions stripped ("Here is what", "If you are buying", "I will send") — Quality subagent only reviewed 4 evergreen posts in detail. The TIMELY template escaped its contraction review because it had no rewrite.

**Fix:** Add to 04-reviewer.md under Voice Review:
> TIMELY templates must pass the same contraction/voice check as evergreen posts. Do not skip TIMELY posts on the grounds that "data will be filled later." The voice frame is permanent — only the data fields change.

---
## Session: 2026-04-06 AM

### 03a-builder.md — Hashtag Storage Consistency
**Problem:** Builder stored hashtags inconsistently across posts this session:
- Posts 62-63: hashtags in `hashtags` column only, `#Tag1 #Tag2` format (correct)
- Posts 64-66: hashtags embedded in `content` field at end of post AND in `hashtags` column without # prefix, comma-separated (incorrect — creates duplicate display risk in Publer)

**Fix:** Add explicit rule to 03a-builder.md:
> HASHTAG STORAGE RULE: Store ALL hashtags in the `hashtags` column ONLY (never embed in `content` field). Format: `#Tag1 #Tag2 #Tag3` — space-separated, each tag includes the # prefix. The content field must contain only the post body text with no hashtags.

### Schema Gap — pool_entry_id column
**Problem:** LoanOS stream review rule checks for a `pool_entry_id` field in `social_drafts`, but this column doesn't exist. Builder worked around it by embedding pool_entry_id in agent_notes. Reviewer had to note this as a documented workaround instead of a clean pass.

**Fix:** Add a migration task to add `pool_entry_id TEXT` column to `social_drafts`. Add to 03a-builder.md: "If inserting a LoanOS stream post, verify the pool_entry_id column exists before INSERT — if missing, include pool_entry_id in agent_notes and flag for schema migration."

---
