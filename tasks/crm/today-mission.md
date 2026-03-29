## Mission Brief — 2026-03-29 AM (Builder Execution)

### Domain
LoanOS CRM

### Focus Area
Realtor Relationship System — Builder Execution

### Session Type
[x] Execute / Build (Sequence C)

### Objectives
1. Apply migration 061 DDL — 9 new columns on contacts, 1 on loans, last_touch_at trigger
2. Backfill 6 DML operations — referred_by_contact_id, referral counts, Crystal Kilpatrick tier, realtor_stage, deals counts
3. Remove top_realtor/target_realtor code references, run npm build, apply DROP COLUMN, regenerate types, run npm build again
4. Add 4 smart lists to contacts/page.tsx + update Contact type
5. Modify WF-R1 (J9Pe24vUi6fpZtdZ) — extend with referral thank-you branch

### Definition of Done
- Migration 061 applied and verified via SQL
- All 6 DML backfills complete and spot-checked
- npm build passes with 0 errors
- boolean columns dropped and types regenerated
- 4 new smart lists visible in contacts page
- WF-R1 workflow extended (validate_workflow passes)
- Session log updated + git commit pushed

### Resources / Files in Scope
- supabase/migrations/ — new 061 file
- src/app/api/import/contacts/route.ts — boolean deprecation cleanup
- src/lib/database.types.ts — regenerated after DROP
- src/app/dashboard/contacts/page.tsx — 4 new smart lists + Contact type update
- n8n workflow J9Pe24vUi6fpZtdZ — WF-R1 extension

### HIGH RISK Items
1. Boolean DROP COLUMN — must remove code references + pass npm build BEFORE dropping
2. referred_by backfill dry-run — abort if count <100 or >2000
3. trigger on activity_log — must verify contact_id column exists first
