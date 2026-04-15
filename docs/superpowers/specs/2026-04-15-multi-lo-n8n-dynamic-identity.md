# Multi-LO n8n Dynamic Identity (post-launch v2)

**Status:** Deferred until after May 1 beta launch.
**Created:** 2026-04-15
**Context:** Beta launch uses drafts-only flow (no per-LO Outlook OAuth). This spec covers the follow-up work to remove Adam-specific hardcoded values from n8n email workflows so drafts are correctly signed for each LO.

---

## Problem

n8n email workflows (Contract Received `UfNcdpoVKQZqy0fj`, Final CD Email `SkzrWeR0bHZs8kWX`, Pre-Approval Email `utMvZpkdRwIRZ51u`, Referral Intro Email `YbgDnTpPdefcazKy`, etc.) currently hardcode Adam's identity in multiple places:

- `to: 'adam@thestyerteam.com'` on the email draft insert
- Email HTML signature: `"Adam Styer | Mortgage Banker | The Styer Team | (512) 956-6010 | NMLS# 513013"`
- Outlook node bound to Adam's OAuth credential (only affects the send step — drafts-only flow bypasses this)

Result: if Adam's uncle uploads a CD, the draft that lands in `email_drafts` still reads like it's from Adam.

## Beta workaround (shipped 2026-04-15)

- Drafts land in `email_drafts` with `organization_id` and `user_id` scoping (data layer already works).
- New `/dashboard/drafts` page lets each LO review and send drafts via Outlook web deeplink / mailto / Copy HTML.
- Adam sees his own drafts correctly signed because the hardcoded values happen to be his. Other LOs will see drafts signed "Adam Styer" until this spec is implemented.

## Fix (post-launch)

For each affected workflow, add a Supabase lookup node immediately after the webhook trigger that fetches the LO identity from the `loan.user_id`:

```sql
-- pseudocode of the lookup
SELECT
  p.full_name          AS lo_name,
  p.email              AS lo_email,
  p.phone              AS lo_phone,
  p.nmls_individual    AS nmls,
  p.title              AS lo_title,
  o.name               AS company_name,
  os.email_signature   AS signature_html
FROM loans l
JOIN profiles p ON p.id = l.user_id
JOIN organizations o ON o.id = p.organization_id
LEFT JOIN org_settings os ON os.organization_id = o.id
WHERE l.id = {{ $json.loan_id }}
```

Then replace every hardcoded value in the email body + `email_drafts` insert with the looked-up values. Adam's existing workflows keep producing the exact same output because his profile row resolves to the same values currently hardcoded — zero behavioral change for his pipeline.

## Files / nodes to change

Per workflow, audit and replace in these nodes:
- "Build {X} Email" code node — swap hardcoded strings for `$node["Get LO Identity"].json` refs
- "Insert Draft" Supabase node — swap `recipient_email` / `recipient_name` for dynamic values
- Any explicit `from` override in the Outlook node (most of these use the shared OAuth credential today)

## Precondition already satisfied

`src/lib/getLoIdentity.ts` already exists and reads the same rows. The n8n nodes should use the Supabase REST API directly against these tables — no new schema needed.

## Out of scope

- Per-LO Microsoft OAuth / Graph API send. Punted indefinitely; drafts-only flow is acceptable long-term for most LOs.
- Sending from the LO's own Outlook automatically. Still manual (click "Open in Outlook" on the Drafts page).

## Acceptance

- Adam's uncle uploads a CD → draft in `email_drafts` has uncle's name, email, phone, NMLS, signature.
- Adam uploads a CD → draft is byte-identical to today's output.
- No changes to the `email_drafts` table schema.
- No changes to the API routes.
