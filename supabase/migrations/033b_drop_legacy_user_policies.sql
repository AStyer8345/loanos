-- Drop legacy user-scoped policies superseded by org-scoped RLS (migration 033)

DROP POLICY IF EXISTS "Users create own email drafts" ON email_drafts;
DROP POLICY IF EXISTS "Users delete own email drafts" ON email_drafts;
DROP POLICY IF EXISTS "Users see own email drafts" ON email_drafts;
DROP POLICY IF EXISTS "Users update own email drafts" ON email_drafts;

DROP POLICY IF EXISTS "Users create own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users delete own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users see own scenarios" ON scenarios;
DROP POLICY IF EXISTS "Users update own scenarios" ON scenarios;
