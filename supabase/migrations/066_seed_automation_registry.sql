-- ============================================================
-- Migration 066: Seed automation_registry with all 40 automations
-- Data source: Audit performed 2026-03-30 (see spec Appendix A)
-- ============================================================

DO $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM organizations LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'No organization found — skipping seed';
    RETURN;
  END IF;

  -- Claude Code Agents (17 UI rows = 20 source dirs)
  INSERT INTO automation_registry (org_id, name, description, group_name, source, source_id, trigger_type, schedule, status, config) VALUES
  (v_org_id, 'SEO/SEM Agent', 'On-page SEO, blog content, backlinks, SEM campaigns', 'SEO / SEM', 'claude_code', 'seo-sem-am,seo-sem-pm', 'schedule', '4:40 AM + 11:40 PM', 'active', '{"focus_areas": ["on-page-seo", "blog-content", "backlinks", "sem-campaigns"], "avoid": "", "priority": ""}'::jsonb),
  (v_org_id, 'Competitive Intel (Daily)', 'Daily competitor monitoring and market intelligence', 'SEO / SEM', 'claude_code', 'competitive-intel-daily', 'schedule', 'weekly (Mon)', 'active', '{}'::jsonb),
  (v_org_id, 'Competitive Intel (Weekly)', 'Weekly deep-dive competitive analysis', 'SEO / SEM', 'claude_code', 'competitive-intel-weekly', 'schedule', 'weekly (Mon)', 'active', '{}'::jsonb),
  (v_org_id, 'Styer Site Daily', 'Daily styermortgage.com maintenance and updates', 'SEO / SEM', 'claude_code', 'styer-site-daily', 'schedule', '7:00 AM + 11:00 PM', 'active', '{}'::jsonb),
  (v_org_id, 'Styer Content Weekly', 'Weekly content creation for styermortgage.com', 'SEO / SEM', 'claude_code', 'styer-content-weekly', 'schedule', 'weekly (Fri)', 'active', '{}'::jsonb),
  (v_org_id, 'Social Media Agent', 'Social media content creation and scheduling', 'Social Media', 'claude_code', 'social-media-am,social-media-pm', 'schedule', '2:20 AM + 9:20 PM', 'active', '{"focus_areas": ["content-creation", "engagement", "scheduling"], "avoid": "", "priority": ""}'::jsonb),
  (v_org_id, 'Lead Gen Agent', 'Lead generation strategy and execution', 'Lead Generation', 'claude_code', 'lead-gen-am,lead-gen-pm', 'schedule', '3:40 AM + 10:00 PM', 'active', '{"focus_areas": ["lead-magnets", "landing-pages", "drip-campaigns"], "avoid": "", "priority": ""}'::jsonb),
  (v_org_id, 'LoanOS Daily', 'Daily LoanOS maintenance, bug fixes, and improvements', 'LoanOS Core', 'claude_code', 'loanos-daily', 'schedule', '8:45 AM + 12:45 AM', 'active', '{}'::jsonb),
  (v_org_id, 'LoanOS Aesthetics', 'UI/UX polish and design consistency', 'LoanOS Core', 'claude_code', 'loanos-aesthetics', 'manual', NULL, 'active', '{}'::jsonb),
  (v_org_id, 'LoanOS Knowledge Base', 'Documentation and knowledge base updates', 'LoanOS Core', 'claude_code', 'loanos-knowledge-base', 'schedule', 'weekly (Sun)', 'active', '{}'::jsonb),
  (v_org_id, 'Multi-Tenancy Prep', 'Daily multi-tenancy migration work', 'LoanOS Core', 'claude_code', 'multi-tenancy-daily-prep', 'schedule', 'daily', 'active', '{}'::jsonb),
  (v_org_id, 'Build Watchdog', 'Monitors build health (currently disabled)', 'LoanOS Core', 'claude_code', 'loanos-build-watchdog', 'disabled', NULL, 'disabled', '{}'::jsonb),
  (v_org_id, 'CRM Migration Agent', 'Salesforce/Jungo to LoanOS CRM migration', 'CRM & Enterprise', 'claude_code', 'loanos-crm-am,loanos-crm-pm', 'schedule', '8:40 AM + 10:40 PM', 'active', '{}'::jsonb),
  (v_org_id, 'Enterprise Agent', 'Enterprise feature development', 'CRM & Enterprise', 'claude_code', 'loanos-enterprise-am,loanos-enterprise-pm', 'schedule', '7:00 AM + 6:20 PM', 'active', '{}'::jsonb),
  (v_org_id, 'Scenarios Agent', 'Loan scenario calculator improvements', 'LoanOS Core', 'claude_code', 'scenarios-am,scenarios-pm', 'schedule', '7:20 AM + 5:00 PM', 'active', '{}'::jsonb),
  (v_org_id, 'GBP Optimization', 'Google Business Profile optimization', 'Social Media', 'claude_code', 'gbp-optimization', 'schedule', 'weekly', 'active', '{}'::jsonb),
  (v_org_id, 'GBP Weekly Optimization', 'Weekly GBP deep optimization', 'Social Media', 'claude_code', 'gbp-weekly-optimization', 'schedule', 'weekly', 'active', '{}'::jsonb)
  ON CONFLICT (org_id, source_id) DO NOTHING;

  -- n8n Workflows (18)
  INSERT INTO automation_registry (org_id, name, description, group_name, source, source_id, trigger_type, schedule, status, email_mode, config) VALUES
  (v_org_id, 'Arive New Loan → Supabase', 'Syncs new loans from Arive to Supabase', 'Loan Pipeline', 'n8n', '1tagvoU0UXtdDiMY', 'webhook', NULL, 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Arive Status Update → Supabase', 'Syncs loan status changes from Arive', 'Loan Pipeline', 'n8n', '9JyzzwKac8v3uQ7d', 'webhook', NULL, 'active', NULL, '{}'::jsonb),
  (v_org_id, 'New Application Received', 'Extracts 1003 data, creates contacts, drafts welcome email', 'Loan Pipeline', 'n8n', 'cWESnXXy9UOLB13q', 'webhook', NULL, 'active', 'hybrid', '{"tone": "conversational", "length": "medium"}'::jsonb),
  (v_org_id, 'Contract Received', 'Extracts contract fields, drafts reply-all to parties', 'Loan Pipeline', 'n8n', 'UfNcdpoVKQZqy0fj', 'webhook', NULL, 'active', 'hybrid', '{"tone": "conversational", "length": "medium"}'::jsonb),
  (v_org_id, 'Generic Outlook Draft', 'Creates generic Outlook email draft via webhook', 'Loan Pipeline', 'n8n', 'eb9UsV5Z6odh7Yex', 'webhook', NULL, 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Pre-Approval Email', 'Extracts PA letter fields, drafts congratulations email', 'Email Automations', 'n8n', 'utMvZpkdRwIRZ51u', 'webhook', NULL, 'active', 'hybrid', '{"tone": "conversational", "length": "medium", "always_include": ["pre-approval-amount", "nmls-signature"], "never_include": ["interest-rates"]}'::jsonb),
  (v_org_id, 'Final CD Email', 'Extracts CD fields, drafts closing disclosure walkthrough email', 'Email Automations', 'n8n', 'SkzrWeR0bHZs8kWX', 'webhook', NULL, 'active', 'hybrid', '{"tone": "conversational", "length": "medium", "always_include": ["closing-date", "nmls-signature"]}'::jsonb),
  (v_org_id, 'Referral Intro Email', 'Drafts personalized intro email to referred borrower', 'Email Automations', 'n8n', 'YbgDnTpPdefcazKy', 'webhook', NULL, 'active', 'ai_generated', '{"tone": "conversational", "length": "short"}'::jsonb),
  (v_org_id, 'Refi Intake Email', 'Extracts IFW data, drafts refi kickoff email', 'Email Automations', 'n8n', 'yCTydQ7RfZK4DyUg', 'webhook', NULL, 'active', 'hybrid', '{"tone": "conversational", "length": "medium"}'::jsonb),
  (v_org_id, 'Review Request Email', 'Sends review request to recently closed borrowers', 'Email Automations', 'n8n', 'AK1fBcaX1cPcdlGx', 'schedule', 'daily', 'active', 'ai_generated', '{"tone": "casual", "length": "short"}'::jsonb),
  (v_org_id, 'Drip Email Scheduler', 'Schedules and sends drip campaign emails', 'Email Automations', 'n8n', 'LqBb3YDLjS2eUrDE', 'schedule', 'hourly', 'active', NULL, '{}'::jsonb),
  (v_org_id, 'FTB Guide Welcome Email', 'Sends welcome email with FTB guide download', 'Email Automations', 'n8n', 'yTkiV6pf2eZaJw82', 'webhook', NULL, 'active', 'fixed_template', '{}'::jsonb),
  (v_org_id, 'Web Lead Automation', 'Processes website leads — creates contact, drafts follow-up', 'Lead Generation', 'n8n', 'PiuIsQpBuydtFM4m', 'webhook', NULL, 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Pre-Approval Lead Notify', 'Notifies when pre-approval lead comes in', 'Lead Generation', 'n8n', 'J9Pe24vUi6fpZtdZ', 'webhook', NULL, 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Weekly GBP + Social Post', 'Generates and posts weekly GBP and social content', 'Social Media', 'n8n', 'V6RhmJpOb7pOzMte', 'schedule', 'weekly', 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Weekly Testimonial Social Post', 'Generates and posts weekly testimonial content', 'Social Media', 'n8n', 'eJG4wckrj6SmSpm1', 'schedule', 'weekly', 'active', NULL, '{}'::jsonb),
  (v_org_id, 'Inbound Email → Supabase Log', 'Syncs inbound Outlook emails to Supabase', 'Communication Logging', 'n8n', 'qgb99Eh2ziy0INMk', 'schedule', 'every 5 min', 'active', NULL, '{}'::jsonb),
  (v_org_id, 'iMessage → Supabase Log', 'Syncs iMessages to Supabase via webhook', 'Communication Logging', 'n8n', 'nccX5ml82mMGyE9T', 'webhook', NULL, 'active', NULL, '{}'::jsonb)
  ON CONFLICT (org_id, source_id) DO NOTHING;

  -- Supabase Settings (2)
  INSERT INTO automation_registry (org_id, name, description, group_name, source, source_id, trigger_type, status, config) VALUES
  (v_org_id, 'AI System Prompt', 'Base system prompt for the AI chat assistant', 'AI Assistants', 'supabase_setting', 'ai_system_prompt', 'manual', 'active', '{"tone": "professional", "topics_focus": [], "topics_avoid": [], "key_instructions": ""}'::jsonb),
  (v_org_id, 'Outreach Bot Prompt', 'System prompt for the outreach/marketing bot', 'AI Assistants', 'supabase_setting', 'outreach_bot_prompt', 'manual', 'active', '{"tone": "friendly", "topics_focus": [], "topics_avoid": [], "key_instructions": ""}'::jsonb)
  ON CONFLICT (org_id, source_id) DO NOTHING;

END $$;
