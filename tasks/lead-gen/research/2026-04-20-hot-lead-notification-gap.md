# Research: Hot Lead Notification Gap
Date: 2026-04-20

## Executive Summary

The LoanOS lead scoring system launched 2026-04-19 correctly identifies hot leads (score ≥20) and flags them in Supabase by setting `hot_lead_dismissed = false`. However, the workflow stops there — Adam receives no push, no SMS, and no email when a contact crosses the hot threshold. The 5-minute response window (21x conversion rate uplift) is completely broken: Adam only sees hot leads if he opens LoanOS. This research compares three implementation options for closing the gap using existing LoanOS infrastructure, with a recommendation for the lowest-friction path.

## Gap Analysis

### What the current n8n workflow (`nOCDV73m4M0jyL1B`) does
1. Receives webhook from LoanOS when an activity action fires
2. Calculates a new lead score from the `activity_log` table
3. Updates `contacts.lead_score` and `contacts.lead_tier` in Supabase
4. If new score ≥20: sets `contacts.hot_lead_dismissed = false` (the "Surface Hot Lead" node)
5. **Stops there — no outbound notification**

### What it needs to do (added after step 4)
5. Fetch the contact's full record (name, phone, email, lead_score, lead_tier, source_page, form_name)
6. Fetch the triggering activity action (the event that pushed score over 20)
7. Send Adam an email notification with enough detail to call within 5 minutes

### The conversion math
Industry data: leads contacted within 5 minutes convert at 21x the rate of leads contacted after 30 minutes. The current gap means every hot lead detection is functionally equivalent to a 30+ minute delay unless Adam happens to be looking at LoanOS at that moment.

## Email Content Recommendation

The notification email must answer one question: "Who is this person and why should I call them right now?"

**Recommended fields to include:**

| Field | Source | Why it matters |
|-------|--------|----------------|
| Full name | `contacts.first_name + last_name` | Who to ask for when calling |
| Phone | `contacts.phone` (fallback `phone_mobile`) | Primary call-to-action |
| Email | `contacts.email` | Fallback if call goes to voicemail |
| Lead score | `contacts.lead_score` | Quantifies urgency — "Score: 35" > "they seem interested" |
| Lead tier | `contacts.lead_tier` | Human-readable: "hot" |
| Triggering action | Activity `action` field from the event | "Clicked application link" vs "Booked Calendly" = different openers |
| Source page | `contacts.source_page` | Context: they came from refi-watch or the FTB guide |
| Form name | `contacts.form_name` | Which funnel entry point |
| Direct LoanOS link | `https://loanos-astyer8345s-projects.vercel.app/contacts/{id}` | One click to full record |
| Calendly link | `https://calendly.com/adamstyer/15minutes` | CTA if Adam can't call immediately |

**Subject line format:** `Hot lead: {first_name} {last_name} — Score {lead_score} ({triggering_action})`

**Example:** `Hot lead: Sarah Martinez — Score 35 (application_link_clicked)`

**Email body structure:**
- Lead's name + phone as the hero (large, tap-to-call friendly on mobile)
- What triggered the hot threshold (the specific action)
- Score history is optional — keep it simple
- Two CTAs: Call Now (tel: link) and View in LoanOS (deep link)
- No fluff. This is a production alert, not a marketing email.

## Implementation Options

### Option A: LoanOS API Endpoint (Recommended)

**What to build:**
Create `POST /api/notify/hot-lead` in the Next.js app. The endpoint authenticates via `LOANOS_AGENT_SECRET` (same pattern as `/api/agents/daily-briefing`), accepts `{contact_id, triggering_action, new_score}` in the request body, fetches the full contact from Supabase using the service client, then calls `sendViaResend()` (already in `src/lib/resend/send.ts`) to send the notification to Adam.

n8n calls this endpoint from the "Surface Hot Lead" branch using an HTTP Request node.

**Pros:**
- `RESEND_API_KEY` never leaves Vercel — stays in the secure env var store
- Uses the existing `sendViaResend()` utility — no new email-sending code, no new dependencies
- Authentication pattern is already established (`LOANOS_AGENT_SECRET` bearer token in `daily-briefing`)
- Full TypeScript type safety on the contact lookup — catches field name errors at build time
- Easy to iterate on email template without touching n8n
- Testable in isolation: `curl -X POST /api/notify/hot-lead -H "Authorization: Bearer ..."` 
- Consistent with the LoanOS architecture principle: business logic lives in the app, not in n8n

**Cons:**
- Requires a small code change + Vercel deploy before the end-to-end works
- One extra network hop: n8n → LoanOS API → Resend (vs n8n → Resend direct)
- The endpoint is a new attack surface (mitigated by `LOANOS_AGENT_SECRET`)

**Effort estimate:** ~45 minutes. New file `src/app/api/notify/hot-lead/route.ts` (~60 lines), no DB migration, no new env vars needed.

---

### Option B: Direct Resend in n8n

**What to configure:**
Add two HTTP Request nodes to the Lead Score Updater workflow after the "Surface Hot Lead" node:
1. **Get Contact Details** — Supabase REST API call to `GET /rest/v1/contacts?id=eq.{contact_id}&select=first_name,last_name,phone,phone_mobile,email,lead_score,lead_tier,source_page,form_name`
2. **Send Notification** — HTTP Request to `https://api.resend.com/emails` with `Authorization: Bearer {RESEND_API_KEY}`, body assembled from the contact data via n8n expressions

The `RESEND_API_KEY` would need to be added to n8n either as a credential (preferred) or hardcoded in the node (avoid).

**Pros:**
- No code change, no deployment — purely n8n configuration
- Fewer moving parts: n8n does the whole job
- Faster to implement if comfortable with n8n expression syntax
- Easier to debug in n8n execution log (all steps visible in one workflow)

**Cons:**
- `RESEND_API_KEY` must be added to n8n — now it lives in two systems (Vercel + n8n). If the key rotates, must update both places.
- Email template is inside n8n JSON — harder to version-control, no TypeScript safety, no unit tests
- n8n expression language is limited for complex HTML formatting
- Drifts from the LoanOS architectural pattern: business logic and email sends should route through the app, not bypass it
- If n8n execution cap is hit (known issue per memory/tools/n8n.md), notification silently fails with no fallback

**Effort estimate:** ~30 minutes. Purely in n8n UI — add Supabase credential lookup node + HTTP Request node to Resend API.

---

### Option C: Supabase Edge Function

**What to build:**
Create a Postgres trigger on the `contacts` table that fires `AFTER UPDATE` when `hot_lead_dismissed` changes from `true` to `false`. The trigger calls a Supabase Edge Function (Deno runtime) that fetches the contact record and POSTs to the Resend API.

**Pros:**
- Fully decoupled from n8n — notification fires even if n8n is down or at execution cap
- No change to the n8n workflow at all
- The trigger fires regardless of what sets `hot_lead_dismissed = false` (n8n, a future UI action, a manual SQL update)

**Cons:**
- Most complex option: requires writing a Deno function, deploying via Supabase CLI, and setting up a Postgres trigger
- Edge Functions are a new runtime context in this stack — no existing precedent in loanos-clone to follow
- `RESEND_API_KEY` must be stored as a Supabase Edge Function secret (third location)
- Trigger fires on ANY update to `hot_lead_dismissed = false`, including re-runs and backfills — needs deduplication logic (e.g., only notify if score crossed threshold in the last 5 minutes)
- Harder to test end-to-end without actually updating a contact in prod
- Adds operational surface: now there's a Supabase Edge Function to maintain

**Effort estimate:** ~2-3 hours. New Deno function, Postgres trigger migration, secret configuration, deduplication logic, end-to-end testing.

---

## Recommendation

**Option A: LoanOS API Endpoint**

Option B is faster today but creates a long-term maintenance problem (API key in two systems, business logic in n8n). Option C is architecturally elegant but massively overengineered for a notification that n8n already triggers correctly.

Option A is the right fit because:
1. `RESEND_API_KEY` stays in one place (Vercel)
2. `sendViaResend()` already exists and handles logging — no new email-sending code
3. The auth pattern is copy-pasteable from `daily-briefing/route.ts`
4. Email template is TypeScript, version-controlled, easy to iterate
5. The endpoint is testable independently with curl before wiring into n8n

The only reason to choose B instead is if a Vercel deploy is blocked (e.g., failing build). Given the build is currently green (commit b10ed40, Vercel READY), Option A is unblocked.

---

## n8n Workflow Changes Required (Options A and B)

Both options require the same two new nodes added after the existing "Surface Hot Lead" node in workflow `nOCDV73m4M0jyL1B`. These nodes only execute on the branch where `new_score >= 20`.

### Node 1: Get Contact Details
- **Type:** HTTP Request
- **Method:** GET
- **URL:** `https://uuqedsvjlkeszrbwzizl.supabase.co/rest/v1/contacts?id=eq.{{$json.contact_id}}&select=id,first_name,last_name,phone,phone_mobile,email,lead_score,lead_tier,source_page,form_name`
- **Headers:**
  - `apikey`: Supabase service role key (already in n8n as a credential)
  - `Authorization`: `Bearer {service_role_key}`
- **Output:** Contact object (first element of array)

### Node 2: Send Notification (Option A path)
- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://loanos-astyer8345s-projects.vercel.app/api/notify/hot-lead`
- **Headers:**
  - `Authorization`: `Bearer {{$env.LOANOS_AGENT_SECRET}}`
  - `Content-Type`: `application/json`
- **Body (JSON):**
  ```json
  {
    "contact_id": "{{$node['Surface Hot Lead'].json.contact_id}}",
    "triggering_action": "{{$node['Surface Hot Lead'].json.action}}",
    "new_score": {{$node['Surface Hot Lead'].json.new_score}}
  }
  ```

### Node 2 (Option B path — Direct Resend instead)
- **Type:** HTTP Request
- **Method:** POST  
- **URL:** `https://api.resend.com/emails`
- **Headers:**
  - `Authorization`: `Bearer {{$credentials.ResendApiKey}}`
  - `Content-Type`: `application/json`
- **Body:** Full JSON with `from`, `to`, `subject`, `html` assembled from Node 1 output

### Error handling note
Add a **Continue on Fail** setting to the notification node so a Resend failure doesn't roll back the Supabase score update. The score update is the source of truth; the notification is best-effort.

---

## Open Questions

1. **Single vs. multiple notifications per contact** — if a contact racks up 3 hot-trigger actions in one day (e.g., books Calendly, cancels, rebooks), should Adam get 3 emails? Recommend: only notify when score first crosses 20, then suppress until `hot_lead_dismissed` is reset to `true` (i.e., Adam dismisses the alert in the UI). The existing `hot_lead_dismissed` field is the right gate — check it before sending.

2. **Notification destination** — the research assumes `styer.adam@gmail.com` (confirmed in MEMORY.md). Should a secondary destination (SMS via Twilio, push notification) be added? This is a follow-on, not a blocker for Option A.

3. **`LOANOS_AGENT_SECRET` in n8n** — the secret needs to be accessible in the n8n HTTP Request node. Confirm it's already stored as an n8n environment variable or credential, or add it before wiring the workflow. Check n8n MCP before implementation.

4. **Throttle / quiet hours** — should notifications suppress between 10pm and 7am CT? A late-night application click is still a hot lead, but calling at 11pm is not appropriate. Recommend: send the email regardless of time (it's just an email), but note the contact's local time zone in the email body if available.

5. **`RESEND_FROM_ADDRESS` env var** — `sendViaResend()` falls back to `adam@thestyerteam.com` if this isn't set. Verify the Vercel env has this set to `adam@styermortgage.com` (the DKIM-verified domain) before shipping Option A.
