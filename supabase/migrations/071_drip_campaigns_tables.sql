-- 071_drip_campaigns_tables.sql
-- Drip campaign system: campaigns, steps, enrollments, sends

CREATE TYPE drip_audience AS ENUM ('past_client', 'lead', 'realtor');
CREATE TYPE drip_campaign_status AS ENUM ('active', 'paused', 'archived');
CREATE TYPE drip_trigger_type AS ENUM ('relative_days', 'annual_date', 'condition');
CREATE TYPE drip_channel AS ENUM ('email', 'handwritten_card', 'both');
CREATE TYPE drip_tone AS ENUM ('straight_shooter', 'knowledgeable_friend', 'quiet_confidence');
CREATE TYPE drip_enrollment_status AS ENUM ('active', 'paused', 'completed', 'removed');
CREATE TYPE drip_enrolled_by AS ENUM ('auto', 'manual');
CREATE TYPE drip_send_status AS ENUM ('queued', 'approved', 'sent', 'skipped', 'cancelled');

CREATE TABLE drip_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  audience drip_audience NOT NULL,
  status drip_campaign_status NOT NULL DEFAULT 'active',
  description TEXT,
  exit_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, name)
);

CREATE TABLE drip_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  name TEXT NOT NULL,
  trigger_type drip_trigger_type NOT NULL,
  trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  skeleton TEXT NOT NULL,
  channel drip_channel NOT NULL DEFAULT 'email',
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  tone drip_tone NOT NULL DEFAULT 'knowledgeable_friend',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, step_order)
);

CREATE TABLE drip_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES drip_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  loan_id UUID REFERENCES loans(id) ON DELETE SET NULL,
  status drip_enrollment_status NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enrolled_by drip_enrolled_by NOT NULL DEFAULT 'manual',
  removed_at TIMESTAMPTZ,
  removed_reason TEXT,
  current_step INTEGER NOT NULL DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, contact_id)
);

CREATE TABLE drip_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES drip_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES drip_steps(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel drip_channel NOT NULL DEFAULT 'email',
  status drip_send_status NOT NULL DEFAULT 'queued',
  email_draft_id UUID REFERENCES email_drafts(id) ON DELETE SET NULL,
  generated_subject TEXT,
  generated_body TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_drip_campaigns_org ON drip_campaigns(org_id);
CREATE INDEX idx_drip_steps_campaign ON drip_steps(campaign_id);
CREATE INDEX idx_drip_enrollments_campaign ON drip_enrollments(campaign_id);
CREATE INDEX idx_drip_enrollments_contact ON drip_enrollments(contact_id);
CREATE INDEX idx_drip_enrollments_next_send ON drip_enrollments(next_send_at) WHERE status = 'active';
CREATE INDEX idx_drip_sends_enrollment ON drip_sends(enrollment_id);
CREATE INDEX idx_drip_sends_status ON drip_sends(status) WHERE status = 'queued';

CREATE TRIGGER set_drip_campaigns_updated_at
  BEFORE UPDATE ON drip_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_drip_steps_updated_at
  BEFORE UPDATE ON drip_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_drip_enrollments_updated_at
  BEFORE UPDATE ON drip_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
