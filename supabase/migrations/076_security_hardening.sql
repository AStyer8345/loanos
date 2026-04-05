-- 076_security_hardening.sql
-- Pre-launch security hardening: fixes audit findings T-1..T-5, T-7, ST-2..ST-4.
-- See audits/SECURITY-AUDIT-2026-04-05.md for full context.

-- ============================================================================
-- T-2: Enable RLS on 6 tables that were completely unprotected
-- ============================================================================

ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_handoffs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tools         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_admins       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups    ENABLE ROW LEVEL SECURITY;

-- agent_conversations: org-scoped read/write. Claude transcripts contain PII.
DROP POLICY IF EXISTS "Org members read agent_conversations" ON public.agent_conversations;
CREATE POLICY "Org members read agent_conversations" ON public.agent_conversations
  FOR SELECT USING (org_id = get_my_organization_id());
DROP POLICY IF EXISTS "Org members write agent_conversations" ON public.agent_conversations;
CREATE POLICY "Org members write agent_conversations" ON public.agent_conversations
  FOR INSERT WITH CHECK (org_id = get_my_organization_id() AND user_id = auth.uid());
DROP POLICY IF EXISTS "Org members update agent_conversations" ON public.agent_conversations;
CREATE POLICY "Org members update agent_conversations" ON public.agent_conversations
  FOR UPDATE USING (org_id = get_my_organization_id())
  WITH CHECK (org_id = get_my_organization_id());

-- agent_handoffs: org-scoped
DROP POLICY IF EXISTS "Org members read agent_handoffs" ON public.agent_handoffs;
CREATE POLICY "Org members read agent_handoffs" ON public.agent_handoffs
  FOR SELECT USING (org_id = get_my_organization_id());
DROP POLICY IF EXISTS "Org members write agent_handoffs" ON public.agent_handoffs;
CREATE POLICY "Org members write agent_handoffs" ON public.agent_handoffs
  FOR INSERT WITH CHECK (org_id = get_my_organization_id());

-- agent_tools: org-scoped, with a nullable-org arm for globally-shared tools
DROP POLICY IF EXISTS "Org members read agent_tools" ON public.agent_tools;
CREATE POLICY "Org members read agent_tools" ON public.agent_tools
  FOR SELECT USING (org_id IS NULL OR org_id = get_my_organization_id());
DROP POLICY IF EXISTS "Org admins write agent_tools" ON public.agent_tools;
CREATE POLICY "Org admins write agent_tools" ON public.agent_tools
  FOR INSERT WITH CHECK (org_id = get_my_organization_id() AND get_my_role() IN ('owner','admin'));

-- agents: org-scoped
DROP POLICY IF EXISTS "Org members read agents" ON public.agents;
CREATE POLICY "Org members read agents" ON public.agents
  FOR SELECT USING (org_id = get_my_organization_id());
DROP POLICY IF EXISTS "Org admins write agents" ON public.agents;
CREATE POLICY "Org admins write agents" ON public.agents
  FOR INSERT WITH CHECK (org_id = get_my_organization_id() AND get_my_role() IN ('owner','admin'));
DROP POLICY IF EXISTS "Org admins update agents" ON public.agents;
CREATE POLICY "Org admins update agents" ON public.agents
  FOR UPDATE USING (org_id = get_my_organization_id() AND get_my_role() IN ('owner','admin'))
  WITH CHECK (org_id = get_my_organization_id());

-- system_admins: service role only. Even authed users must see empty.
DROP POLICY IF EXISTS "system_admins_no_public_access" ON public.system_admins;
CREATE POLICY "system_admins_no_public_access" ON public.system_admins
  FOR SELECT USING (false);

-- waitlist_signups: public INSERT (anyone can sign up), no SELECT for anon/authed.
-- Service role bypasses RLS for admin reads.
DROP POLICY IF EXISTS "Anyone can sign up for waitlist" ON public.waitlist_signups;
CREATE POLICY "Anyone can sign up for waitlist" ON public.waitlist_signups
  FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "waitlist_signups_no_public_read" ON public.waitlist_signups;
CREATE POLICY "waitlist_signups_no_public_read" ON public.waitlist_signups
  FOR SELECT USING (false);

-- ============================================================================
-- T-3: Drop USING(true) policies on challenges/responses/kids (dev leftovers)
-- ============================================================================

DROP POLICY IF EXISTS "Allow all on challenges" ON public.challenges;
DROP POLICY IF EXISTS "Allow all on responses" ON public.responses;
DROP POLICY IF EXISTS "Allow all on kids"       ON public.kids;

-- Replace with deny-all (tables look unused; if they turn out to be needed,
-- re-add proper org-scoped policies in a follow-up migration).
CREATE POLICY "challenges_deny_all" ON public.challenges FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "responses_deny_all"  ON public.responses  FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "kids_deny_all"       ON public.kids       FOR ALL USING (false) WITH CHECK (false);

-- ============================================================================
-- T-1: activity_log INSERT — require BOTH user_id AND organization_id match
-- ============================================================================

DROP POLICY IF EXISTS "Users can insert own activity" ON public.activity_log;
CREATE POLICY "Users can insert own activity" ON public.activity_log
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = get_my_organization_id()
  );

-- ============================================================================
-- T-4: milestone/status tables — scope by loans.organization_id, not user_id
-- ============================================================================

-- loan_milestone_events.loan_id is TEXT (stores arive_loan_id)
DROP POLICY IF EXISTS "Users can read milestone events for their loans"
  ON public.loan_milestone_events;
CREATE POLICY "Org members read milestone events" ON public.loan_milestone_events
  FOR SELECT USING (
    loan_id IN (
      SELECT arive_loan_id FROM public.loans
      WHERE organization_id = get_my_organization_id()
        AND arive_loan_id IS NOT NULL
    )
  );

-- loan_status_history.loan_id is UUID FK to loans.id
DROP POLICY IF EXISTS "Authenticated users can read loan_status_history"
  ON public.loan_status_history;
CREATE POLICY "Org members read loan_status_history" ON public.loan_status_history
  FOR SELECT USING (
    loan_id IN (
      SELECT id FROM public.loans
      WHERE organization_id = get_my_organization_id()
    )
  );

-- milestone_communications joins through loan_milestone_events → loans (via arive_loan_id)
DROP POLICY IF EXISTS "Users can read their milestone communications"
  ON public.milestone_communications;
CREATE POLICY "Org members read milestone communications" ON public.milestone_communications
  FOR SELECT USING (
    milestone_event_id IN (
      SELECT lme.id
      FROM public.loan_milestone_events lme
      JOIN public.loans l ON l.arive_loan_id = lme.loan_id
      WHERE l.organization_id = get_my_organization_id()
    )
  );

-- ============================================================================
-- T-5: marketing_activity_log + mcc_state — allow teammates to read
-- (still keep inserts user-scoped)
-- ============================================================================

DROP POLICY IF EXISTS "Users see own marketing activity" ON public.marketing_activity_log;
CREATE POLICY "Org members read marketing activity" ON public.marketing_activity_log
  FOR SELECT USING (
    auth.uid() = user_id
    OR (organization_id IS NOT NULL AND organization_id = get_my_organization_id())
  );

DROP POLICY IF EXISTS "Users can read their own mcc_state" ON public.mcc_state;
CREATE POLICY "Org members read mcc_state" ON public.mcc_state
  FOR SELECT USING (
    auth.uid() = user_id
    OR (organization_id IS NOT NULL AND organization_id = get_my_organization_id())
  );

-- ============================================================================
-- T-7: automation_logs INSERT — require loan_id belongs to caller's org
-- ============================================================================

DROP POLICY IF EXISTS "automation_logs_insert" ON public.automation_logs;
CREATE POLICY "automation_logs_insert" ON public.automation_logs
  FOR INSERT WITH CHECK (
    loan_id IN (
      SELECT id FROM public.loans
      WHERE organization_id = get_my_organization_id()
    )
  );

-- ============================================================================
-- ST-2: Drop duplicate documents storage INSERT policy
-- ============================================================================

DROP POLICY IF EXISTS "Allow authenticated users to upload to own folder 1potspk_0"
  ON storage.objects;

-- ============================================================================
-- ST-3: Lock down drawings bucket — require auth + user folder scoping
-- ============================================================================

DROP POLICY IF EXISTS "Public read drawings"   ON storage.objects;
DROP POLICY IF EXISTS "Public upload drawings" ON storage.objects;
DROP POLICY IF EXISTS "Public update drawings" ON storage.objects;
DROP POLICY IF EXISTS "Public delete drawings" ON storage.objects;

CREATE POLICY "Authed read drawings" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'drawings'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
CREATE POLICY "Authed upload drawings" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'drawings'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
CREATE POLICY "Authed update drawings" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'drawings'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
CREATE POLICY "Authed delete drawings" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'drawings'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- drawings bucket should no longer be public-readable via the anon URL helper
UPDATE storage.buckets SET public = false WHERE id = 'drawings';

-- ============================================================================
-- ST-4: social-assets explicit policies
-- Public read kept (needed for social post image URLs), but writes are scoped
-- by caller's user folder. Service role (from /api/social/*) bypasses RLS.
-- ============================================================================

DROP POLICY IF EXISTS "Public read social-assets"       ON storage.objects;
DROP POLICY IF EXISTS "Authed write social-assets"      ON storage.objects;
DROP POLICY IF EXISTS "Authed update social-assets"     ON storage.objects;
DROP POLICY IF EXISTS "Authed delete social-assets"     ON storage.objects;

CREATE POLICY "Public read social-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'social-assets');

CREATE POLICY "Authed write social-assets" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'social-assets'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
CREATE POLICY "Authed update social-assets" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'social-assets'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );
CREATE POLICY "Authed delete social-assets" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'social-assets'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- ============================================================================
-- Done.
-- ============================================================================
