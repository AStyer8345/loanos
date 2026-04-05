# Secret Rotation Runbook

**Owner:** Adam Styer
**Last reviewed:** 2026-04-05
**Scope:** Procedures for rotating every LoanOS secret without downtime or data loss.

This runbook is executable. Every section starts with **When**, ends with **Verify**, and can be followed top-to-bottom by someone with Vercel + Supabase dashboard access. If a step fails, stop and investigate — do not continue past a verification failure.

> **Before you start any rotation:**
> 1. Confirm no production deploy is mid-flight (`vercel list-deployments` or the Vercel UI)
> 2. Announce in ops channel: "Rotating `<secret_name>` — expect 0 downtime, revert plan ready"
> 3. Keep both the old and new secret in a password manager until rotation is verified complete and 24 hours have passed
> 4. Never commit any secret — ever — into git, even a test value

---

## Secret inventory

| # | Secret | Location | Used by | Rotation frequency | Section |
|---|--------|----------|---------|---------------------|---------|
| 1 | `SUPABASE_SERVICE_ROLE_KEY` | Vercel env + Supabase dashboard | Every server route, middleware admin gate, webhook handlers, n8n workflows | Annually or on suspected leak | [§1](#1-supabase-service-role-key) |
| 2 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel env + Supabase dashboard | Browser client (SSR + SPA) | Annually or on suspected leak | [§2](#2-supabase-anon-key) |
| 3 | `LOANOS_AGENT_SECRET` | Vercel env + n8n credentials + Zapier headers | Agent-secret API routes | Quarterly, or on LO offboarding | [§3](#3-loanos-agent-secret) |
| 4 | `ANTHROPIC_API_KEY` | Vercel env + n8n credentials | Chat API, outreach generation, drip scheduler | Annually or on suspected leak | [§4](#4-anthropic-api-key) |
| 5 | Per-org Arive webhook secrets | `los_integrations.secret_hash` (hashed) + each LO's Zap header | `/api/webhooks/los/arive/[org_slug]` | On LO offboarding, or on request | [§5](#5-per-org-arive-webhook-secrets) |
| 6 | `PUBLER_API_KEY` | Vercel env + `social_settings.publer_config` | `/api/social/publish` | Annually or on suspected leak | [§6](#6-publer-api-key) |
| 7 | Supabase Storage signed URL key | Auto-rotated by Supabase | Document downloads | Automatic | N/A |

**Not covered here (platform-managed, rotate via provider):** GitHub deploy tokens, Vercel OIDC, Supabase OAuth providers, Stripe keys (Phase 4).

---

## General principles

1. **Overlap, don't cut over.** Every rotation should have a window where both the old and new secret are valid. A hard cutover across n8n + Zapier + Vercel cannot be atomic and will drop traffic.
2. **Rotate in a branch first.** Vercel preview deploys can validate the new secret against staging Supabase before production sees it.
3. **Update callers before revokers.** Deploy the new secret to everything that *sends* it before revoking the old one at the server that *checks* it.
4. **Verify after every step.** The runbook has explicit verify commands — run them. Rotations fail silently more often than loudly.
5. **Never rotate more than one secret at once.** If two secrets are compromised at the same time, do them sequentially, not in parallel. Parallel rotation makes root-cause analysis on the next incident impossible.

---

## 1. `SUPABASE_SERVICE_ROLE_KEY`

**When:** annual, or immediately on suspected leak (key committed to a public repo, laptop theft, ex-employee with access).

**Blast radius:** every server-side Supabase operation. Webhook handlers, admin routes, `createServiceClient()`, middleware admin gate, every n8n workflow that writes to Supabase.

**⚠ Supabase does not support multiple active service role keys.** You cannot overlap. The rotation is a hard cutover, so this procedure is the most involved in the runbook.

### Steps

1. **Freeze deploys.**
   - Pause the Vercel project (Project Settings → Deployments → Pause). New pushes won't auto-deploy until you unpause.
   - Pause any scheduled n8n workflows that write to Supabase (use the n8n MCP `archive_workflow` temporarily, or toggle `active: false` in the UI).

2. **Generate the new key.**
   - Supabase dashboard → Project Settings → API → Service Role → "Regenerate"
   - Copy the new key into your password manager immediately. Supabase shows it only once.

3. **Update Vercel production env var.**
   - Vercel dashboard → Project → Settings → Environment Variables
   - Edit `SUPABASE_SERVICE_ROLE_KEY` → paste new value → save
   - Trigger a fresh production deployment (`git commit --allow-empty -m "chore: redeploy for service key rotation" && git push`)

4. **Update every n8n credential that uses the service role key.**
   - n8n UI → Credentials → find all credentials of type "Header Auth" or "HTTP Header Auth" that embed the service role key as `apikey` / `Authorization: Bearer`
   - Update each one to the new value
   - Current consumers (as of 2026-04-05):
     - Supabase HTTP nodes in WF1 `LoanOS — Arive New Loan → Supabase`
     - Supabase HTTP nodes in WF2 `LoanOS — Arive Status Update → Supabase`
     - `LoanOS — Drip Email Scheduler` (`LqBb3YDLjS2eUrDE`)
     - `LoanOS — Web Lead Automation` (`PiuIsQpBuydtFM4m`)
     - `LoanOS — Inbound Email → Supabase Log` (`qgb99Eh2ziy0INMk`)
     - `LoanOS — iMessage → Supabase Log` (`nccX5ml82mMGyE9T`)
   - Re-run `mcp__n8n-mcp__search_workflows` for anything not on this list if it's been a while.

5. **Update any local `.env.local` files** on dev machines that still have the old key. (`grep -r "SUPABASE_SERVICE_ROLE_KEY" ~/.env*`)

6. **Unpause Vercel deploys and re-enable n8n workflows.**

### Verify
- Hit a service-role-only route: `curl -X POST https://loanos.vercel.app/api/admin/tenants -H "Authorization: Bearer <your-session-token>"` — should return 200 (assuming you're a system admin).
- Fire a test Arive webhook via Zapier → confirm it lands in `loans` and writes an `activity_log` row.
- Supabase dashboard → Logs → API → filter `role=service_role` → confirm fresh requests post-rotation.
- After 24 hours of no errors, delete the old key from your password manager.

### Rollback
Supabase does not let you revert a regenerated service role key. **If you rotate and something breaks, your only recovery is to fix the broken caller forward.** This is why rotating this key is a high-touch operation — plan a maintenance window if you're nervous.

---

## 2. Supabase Anon Key

**When:** annual, or on suspected leak.

**Blast radius:** browser client only. The anon key is safe to expose by design (protected by RLS), so this rotation is low-risk and mostly about hygiene.

### Steps

1. **Generate new anon key.** Supabase dashboard → Project Settings → API → anon / public → "Regenerate"
2. **Update Vercel env var** `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production, preview, development)
3. **Trigger a fresh deploy.** Because this is a `NEXT_PUBLIC_*` var, the new value is baked into the client bundle — a redeploy is required.
4. **Hard-refresh any open browser tabs** (`Cmd+Shift+R`) — cached JS bundles reference the old key until reload.

### Verify
- Load `/dashboard` while signed in → pipeline data renders → you're authed against the new anon key
- Browser DevTools → Network → pick any Supabase request → confirm `apikey` header matches the new value

### Rollback
Keep the old key in your password manager for 7 days. If something breaks, restore the old value in Vercel and redeploy.

---

## 3. `LOANOS_AGENT_SECRET`

**When:** quarterly, or on LO offboarding, or if a shared n8n/Zapier workspace was accessed by someone who no longer has permission.

**Blast radius:** every agent-secret API route. Consumers today:
- `/api/agents/daily-briefing` (n8n morning briefing)
- `/api/contacts/web-lead` (styermortgage.com lead form → n8n → LoanOS)
- `/api/marketing/log` (n8n social post logging)
- Any other route using `validateAgentSecret()` from `src/lib/auth/validateAgentSecret.ts`

### ⚠ Current limitation
`validateAgentSecret()` compares against a single env var. **True dual-secret overlap is not supported today.** That means the rotation procedure below has a ~30s window where either the old or new secret is valid but not both. Plan to rotate during low-traffic hours (evenings / weekends).

> **Future enhancement (not blocking):** accept `LOANOS_AGENT_SECRET` AND `LOANOS_AGENT_SECRET_PREVIOUS` in the validator for a 7-day overlap window. Ticket: open one when rotation frequency exceeds quarterly.

### Steps

1. **Pick a low-traffic window** — ideally late evening Sunday. Lead form traffic is lowest then; daily-briefing runs at 6am CT so it's unaffected by an evening rotation.

2. **Generate a new secret.**
   ```
   python3 -c "import secrets; print('loanos_agent_' + secrets.token_urlsafe(48))"
   ```
   Prefix `loanos_agent_` makes it identifiable in logs.

3. **Stage the new value in every caller simultaneously** (do NOT push to LoanOS yet):
   - **n8n** → Credentials → update every "LoanOS Agent Secret" credential to the new value, but **do not activate** yet. n8n lets you save a credential without re-running the workflow.
   - **Zapier** (styermortgage.com web-lead Zap) → edit the Webhook step → update `X-Agent-Secret` / `Authorization` header to new value, but **pause the Zap** temporarily.
   - **Any custom scripts / cron jobs / local dev** → update to new value.

4. **Push the new secret to Vercel.**
   - Edit `LOANOS_AGENT_SECRET` in Vercel env vars → paste new value → save.
   - Trigger redeploy: `git commit --allow-empty -m "chore: rotate agent secret" && git push`.
   - Wait for deploy to reach READY.

5. **Re-activate callers immediately** (within 60 seconds of Vercel deploy READY):
   - Unpause the Zapier Zap.
   - Re-activate any n8n workflows you paused.

6. **Delete the old value from your password manager after 48 hours** of clean traffic.

### Verify
- Tail Vercel runtime logs: `vercel logs loanos.vercel.app --since 10m`
- Fire a test web-lead via `curl`:
  ```bash
  curl -X POST https://loanos.vercel.app/api/contacts/web-lead \
    -H "Authorization: Bearer <new-secret>" \
    -H "Content-Type: application/json" \
    -d '{"email":"rotation-test@example.com","org_slug":"adam-styer-mortgage","first_name":"Rotation","last_name":"Test"}'
  ```
  Should return 200. Verify the contact lands in Supabase.
- Fire with the **old** secret → should return 401.
- Confirm n8n WF `LoanOS — Pre-Approval Lead Notify` runs cleanly on the next trigger.

### Rollback
Restore the old value in Vercel env vars and redeploy. All callers still have the old value staged in their credential store (if you followed step 3 correctly, the old values are in password manager history).

---

## 4. `ANTHROPIC_API_KEY`

**When:** annual, or on suspected leak.

**Blast radius:** chat API, outreach generation, drip scheduler Claude calls, any n8n workflow using the Anthropic credential.

### Steps

1. **Create a new API key.** Anthropic console → API Keys → Create Key. Name it `loanos-prod-YYYY-MM` so you can distinguish rotations in audit logs.

2. **Stage in all callers (old key still valid at this point):**
   - Vercel env var `ANTHROPIC_API_KEY` → update to new value → redeploy
   - n8n → update credential `SlNsEedAOCoo6NwH` (Header Auth account 2) → new value → save
   - Confirm n8n drip scheduler + any Claude HTTP nodes use the updated credential

3. **Verify traffic is flowing on the new key.** Anthropic console → Usage → filter by API key name → confirm the new key has recent activity and the old key has zero activity for at least 10 minutes.

4. **Delete the old key** in the Anthropic console.

### Verify
- Load `/dashboard/chat` → send a message → response streams back → new key is working.
- Run a drip campaign enrollment through the n8n scheduler → Claude-generated email drafts appear.
- Anthropic dashboard → old key has 0 RPM, new key has normal RPM.

### Rollback
Anthropic keeps old keys revocable-only, not editable. If you break the rotation, you'll need to create yet another new key and re-run the procedure. Keep the previous key alive until verification passes — do not delete it in step 4 until traffic has shifted.

---

## 5. Per-org Arive webhook secrets

**When:** on LO offboarding (required), on LO request, or if we detect unusual traffic patterns for a specific org.

**Blast radius:** one org's Arive webhook only. Each LO has their own secret, so rotation is isolated.

### Architecture recap
- Plaintext secret is shown to the LO **exactly once** during onboarding (`src/lib/los/hashSecret.ts → generateSecret()`)
- `los_integrations.secret_hash` stores SHA-256(salt + plaintext)
- `los_integrations.secret_salt` is a per-row random 16-byte hex
- `los_integrations.secret_last_rotated` tracks when the current secret was set
- Multiple rows can be `active = TRUE` for the same (org_id, provider) — webhook handler tries each one. **This enables overlap during rotation.**

### Steps

1. **Create the new integration row in parallel with the old one.** Do NOT deactivate the old row yet.
   ```sql
   -- Run via Supabase MCP apply_migration or SQL Editor
   -- (do NOT store plaintext secret in the SQL — generate it in code)
   INSERT INTO los_integrations (
     organization_id,
     provider,
     secret_hash,
     secret_salt,
     external_user_id,
     external_user_email,
     label,
     active
   ) VALUES (
     '<org_id>',
     'arive',
     '<new_hash>',      -- from hashSecret(new_plaintext)
     '<new_salt>',      -- from hashSecret(new_plaintext)
     '<same external_user_id>',
     '<same external_user_email>',
     'Adam (rotated 2026-MM-DD)',
     TRUE
   );
   ```
   The webhook handler will now accept **either** the old or new secret (it iterates over all active rows — see `src/app/api/webhooks/los/arive/[org_slug]/route.ts` layer 2).

2. **Send the LO their new plaintext secret** via a secure channel (Signal, 1Password share, whatever the onboarding UI uses). Remind them to update their Zap's `X-Webhook-Secret` header.

3. **Wait for traffic to shift.** Check Vercel logs (`[los/arive] Verified`) — you should see layer-2 matches with the new integration row id. This usually happens within the next Arive state change on any active loan (minutes to hours).

4. **Deactivate the old row** once you see clean traffic on the new one:
   ```sql
   UPDATE los_integrations
      SET active = FALSE
    WHERE id = '<old_row_id>';
   ```

5. **After 7 days of clean traffic, delete the old row** for hygiene:
   ```sql
   DELETE FROM los_integrations WHERE id = '<old_row_id>';
   ```

### Verify
- Webhook log line `[los/arive] Verified` shows `matched_integration: <new_row_id>`
- `webhook_deliveries` table has fresh rows tied to the org with `status = 'processed'`
- Old row has `active = FALSE`, no traffic hitting it

### Rollback
Reactivate the old row — `UPDATE los_integrations SET active = TRUE WHERE id = '<old_row_id>'`. The LO's Zap keeps working on the old secret until they update it.

### Offboarding variant
If the rotation is because an LO is being offboarded (not just rotating), skip step 1 (don't create a new row) and go straight to `UPDATE los_integrations SET active = FALSE WHERE organization_id = '<org_id>' AND provider = 'arive';`. Their webhook is now rejected with 404 (layer 1 still sees the org but layer 1b rejects "no active integrations"). Follow up by archiving `organizations.active = FALSE` if the full tenant is being shut down.

---

## 6. `PUBLER_API_KEY`

**When:** annual, or on suspected leak.

**Blast radius:** `/api/social/publish` and any n8n workflow that posts to Publer.

### Steps

1. Generate new API key in Publer (Settings → Integrations → API → Regenerate).
2. Update Vercel env var `PUBLER_API_KEY` → save → trigger redeploy.
3. Update n8n workflow credentials that embed the Publer key (WF `Weekly GBP + Social Post` — `V6RhmJpOb7pOzMte`, WF `Weekly Testimonial Social Post` — `eJG4wckrj6SmSpm1`).
4. Verify by running a test social post through `/api/social/publish`.
5. Revoke the old key in Publer dashboard.

### Verify
- Test post appears on all 4 Publer accounts (FB, IG, LI, GBP) within ~30s
- n8n weekly workflow next run succeeds

### Rollback
Publer allows multiple active API keys simultaneously — if rotation fails, you can keep the old one alive while debugging.

---

## Post-rotation checklist (every rotation)

- [ ] Old secret removed from password manager (after verification window)
- [ ] `secret_last_rotated` updated in `los_integrations` (if applicable)
- [ ] Vercel env var shows new value in production scope only (not preview/dev if those use separate secrets)
- [ ] No runtime errors in Vercel logs for 1 hour post-rotation
- [ ] n8n workflow executions post-rotation show 0 failures
- [ ] This runbook's "Last reviewed" date bumped if the procedure changed

---

## Escalation

If a rotation causes outage longer than 15 minutes and you cannot resolve:
1. Restore the old secret value in Vercel + redeploy (all rotations except `SUPABASE_SERVICE_ROLE_KEY` are reversible)
2. For Supabase service role key outage: file a priority ticket with Supabase support, they can assist with a recovery flow
3. Post incident notes to `audits/incidents/` (create the directory if needed) with timeline, root cause, and runbook corrections

## Related docs
- `LOANOS_SYSTEM_KNOWLEDGE_BASE.md` § Security Posture — secret inventory table
- `docs/security/WISP.md` — Written Information Security Program
- `docs/security/data-retention-policy.md` — retention schedule
- `tasks/security-hardening-critical-gaps.md` — hardening tracker
- `src/lib/los/hashSecret.ts` — webhook secret hashing
- `src/lib/auth/validateAgentSecret.ts` — agent secret validator
