# CRON_SECRET — Vercel Setup + End-to-End Drip Verification

**Status:** PROGRESS — drafted by fixer, awaiting Adam to paste value into Vercel **Item:** `loanos-drip-cron-secret`**Drafted:** 2026-04-27 13:03

> **DO NOT COMMIT THIS FILE** — contains a live secret. Paste into Vercel, then delete this file (or move it out of the repo).

---

## TL;DR

1. Paste the value below into Vercel → Production + Preview as `CRON_SECRET`.
2. Trigger a redeploy (or wait for next push) so the env binds.
3. Hit the manual curl test to confirm 200, not 401.
4. Manually enroll one Adam-controlled contact in PA Welcome.
5. Wait one cron tick (13:00 UTC daily) → confirm `drip_sends` row, `next_send_at` advances, RecentSendsTimeline populates.

---

## Generated value (use this)

```
CRON_SECRET=5q1uIHE0UEc09cbHNh4nnnxXLQ2Tn139uZzOyXTxTXyw8wZg5DiY6R8VAOibAcb
```

63 chars, base64-charset (no `/+=`), generated `openssl rand -base64 48` then stripped. Strong enough for HMAC-style bearer auth on a public route. Save it in 1Password ("LoanOS — CRON_SECRET") in case you ever need to rotate.

If you'd rather generate your own, run:

```bash
openssl rand -base64 48 | tr -d '/+=' | head -c 64
```

---

## Step 1 — Set the env var in Vercel

> The link in the fixer briefing (`vercel.com/adam-styer/loanos/...`) 404s — the actual team slug is `astyer8345s-projects`. Use the link below.

**URL:** <https://vercel.com/astyer8345s-projects/loanos/settings/environment-variables>

1. Click **Add New** (or the "Create" button at top right).
2. **Key:** `CRON_SECRET`
3. **Value:** paste the value above
4. **Environments:** check **Production** AND **Preview** (leave Development unchecked unless you also want local cron testing)
5. Click **Save**.

Verify the row appears with both environment chips. The value is masked after save — that's fine, it's stored.

## Step 2 — Trigger a redeploy

Env vars only bind on deploy. Pick one:

**Option A (no code change):** Vercel dashboard → Deployments → latest production → **... menu → Redeploy** → uncheck "Use existing Build Cache" → Redeploy.

**Option B (next push):** Just wait for the next commit to `main`. Anything that hits the deploy pipeline will pick up the new env.

Watch for the build to go READY (\~80s typical for loanos).

## Step 3 — Manually verify the cron route auth

Once the redeploy is READY, run this from your terminal — should return JSON, not `{"error":"Unauthorized"}`:

```bash
curl -sS -H "Authorization: Bearer 5q1uIHE0UEc09cbHNh4nnnxXLQ2Tn139uZzOyXTxTXyw8wZg5DiY6R8VAOibAcb" \
  https://loanos-self.vercel.app/api/drip/run | jq
```

Expected response shape:

```json
{ "processed": 0, "sent": 0, "skipped": 0, "errors": 0 }
```

Zero across the board because nothing is enrolled yet — that's correct. The point is **no 401**. If you still get 401, the env var didn't bind to that deployment — re-check Step 1's environment checkboxes and redeploy again.

Bad-secret sanity check (should 401):

```bash
curl -sS -H "Authorization: Bearer wrong" https://loanos-self.vercel.app/api/drip/run
# → {"error":"Unauthorized"}
```

## Step 4 — Manually enroll one contact (prove the loop end-to-end)

Pick an Adam-controlled email (your personal Gmail works; avoid [styer.adam@gmail.com](mailto:styer.adam@gmail.com) if it's the LO email-from to prevent loop bounces — use a fresh test inbox).

1. Go to `/dashboard/contacts` → create or open an existing test contact.
2. On the contact detail page, scroll to **DRIP CAMPAIGNS** card.
3. Click **+ ENROLL** → pick **PA Welcome** from the dropdown.
4. The card should now show "Enrolled — next send: in ".

The DB-side check, run in Supabase SQL editor:

```sql
select id, contact_id, campaign_id, status, current_step, next_send_at, created_at
from drip_enrollments
where contact_id = '<your-test-contact-uuid>'
order by created_at desc
limit 1;
```

You want: `status='active'`, `current_step=0`, `next_send_at <= now() + interval '5 minutes'` (PA Welcome step 0 is immediate-on-enroll).

## Step 5 — Verify the cron actually sends

The Vercel cron runs daily at `0 13 * * *` UTC (= 8:00 AM Central). Today's 13:00 UTC firing has already passed — next firing is **tomorrow 2026-04-28 \~08:00 CT**.

If you don't want to wait, manually fire it the same way Vercel will:

```bash
curl -sS -H "Authorization: Bearer 5q1uIHE0UEc09cbHNh4nnnxXLQ2Tn139uZzOyXTxTXyw8wZg5DiY6R8VAOibAcb" \
  https://loanos-self.vercel.app/api/drip/run | jq
```

Expected after Step 4:

```json
{ "processed": 1, "sent": 1, "skipped": 0, "errors": 0 }
```

Then verify in Supabase:

```sql
-- Confirm a send row landed
select id, enrollment_id, contact_id, campaign_id, step_number, status, sent_at
from drip_sends
order by created_at desc
limit 5;

-- Confirm enrollment advanced
select id, current_step, next_send_at, status, updated_at
from drip_enrollments
where id = '<enrollment-id-from-step-4>';
```

You want:

- A new `drip_sends` row with `status='sent'` and a `resend_message_id` populated
- `drip_enrollments.current_step` incremented to 1
- `drip_enrollments.next_send_at` advanced to step 1's delay (PA Welcome step 1 = +1 day)

UI verification: visit `/dashboard/drip-campaigns` → **Recent Activity** timeline at the bottom should show a tinted "sent" row for your test contact. That widget shipped 2026-04-26 PM (commit `f54c16b`).

Email verification: check the test inbox — should be the PA Welcome step 0 body, with footer including NMLS #513013 and the unsubscribe link.

---

## Why this couldn't be auto-closed

Vercel project env vars are written through the dashboard or `vercel env add` CLI — neither is exposed by the Vercel MCP (read-only project + deployment endpoints only). The `mcp__ffdaa602...` toolkit available has `get_project`, `list_deployments`, `get_runtime_logs`, etc., but no `set_env_var`. So this stays Adam-only.

## Audit context

Apr 27 AM audit (`tasks/lead-gen/audits/2026-04-27-drip-data-integrity-audit.md`) found `get_due_drip_enrollments()` was 500ing on every call due to two non-existent column references (`ct.status` → `ct.stage`, `l.rate` → `l.interest_rate`). That RPC is now fixed (two migrations applied). Setting CRON_SECRET two weeks ago wouldn't have helped — the RPC was the silent root cause. With the RPC clean, CRON_SECRET is now actually load-bearing: it's the last platform-side gate before a send can happen.

`drip_sends` total = 0. `drip_enrollments` total = 0. The drip system has never sent. This sequence is the proof.

## After completion

1. Delete this file (or move it to `~/Documents/scratch/` outside the repo) so the secret doesn't end up in git history.
2. Update `tasks/ADAM-TODO.md` — strike the `CRON_SECRET` line.
3. Update `CONTEXT.md` Lead Gen Agent Status active blockers (1) — replace "still NEEDS ADAM" with "DONE 2026-04-27, verified loop end-to-end via test contact ".
4. Append [fixer-log.md](http://fixer-log.md) a RESOLVED line for `loanos-drip-cron-secret`.
