## Mission Brief — 2026-03-29 AM

### Domain
LoanOS CRM

### Focus Area
Realtor Relationship System — Architecture Spec (migration 061 + smart lists + WF-R1)

### Session Type
[x] Strategy / Architecture (Sequence B)

### Context
Adam answered all 7 Realtor Relationship System questions on 2026-03-28 at 18:45Z.
Adam also answered all 4 Automation Coverage questions (drip=manual, WF2=Arive, review=Arive fund, rate=rate update email comparison).
Both domains fully unblocked. Today: write the full architecture spec for Realtor Relationship System.
Builder can execute in next session without follow-up questions.

### Objectives
1. Write migration 061 spec — DDL (new columns + last_touch_at trigger) + DML (backfill + boolean deprecation)
2. Define 4 new smart lists using the new realtor fields
3. Write WF-R1 (Referral Thank-You) n8n workflow spec — trigger + logic + node map

### Definition of Done
- `tasks/crm/specs/2026-03-29-realtor-relationship-spec.md` exists and covers all 3 objectives
- Spec is executable by Builder without follow-up questions (includes exact SQL, node names, credential IDs)
- Session log entry written
- NotebookLM PUSH complete

### Resources / Files in Scope
- `supabase/migrations/` — adding migration 061
- `src/app/dashboard/contacts/page.tsx` — smart list additions
- `src/app/api/import/contacts/route.ts` — remove top_realtor/target_realtor references
- `src/lib/database.types.ts` — type updates (auto-generated — note for Builder)
- `tasks/crm/research/2026-03-28-realtor-relationship-system.md` — source research

### HIGH RISK Items
- Dropping `top_realtor`/`target_realtor` columns: code references exist in import API and database.types.ts
  → Builder MUST grep and remove all code references BEFORE dropping DB columns
- `referred_by_contact_id` backfill: text-to-UUID match is fuzzy; spec must include count-check step
- `last_touch_at` trigger: must fire on INSERT only (not UPDATE), to avoid recursive loops
