-- 074_drip_scheduler_rpc.sql
-- RPC function for the n8n drip email scheduler
-- Returns all due enrollments with joined contact, step, campaign, and loan data

DROP FUNCTION IF EXISTS get_due_drip_emails();

CREATE OR REPLACE FUNCTION get_due_drip_enrollments()
RETURNS TABLE (
  enrollment_id UUID,
  enrollment_status TEXT,
  current_step INT,
  enrolled_at TIMESTAMPTZ,
  campaign_id UUID,
  campaign_name TEXT,
  campaign_audience TEXT,
  exit_rules JSONB,
  step_id UUID,
  step_order INT,
  step_name TEXT,
  skeleton TEXT,
  tone TEXT,
  channel TEXT,
  requires_approval BOOLEAN,
  trigger_type TEXT,
  trigger_config JSONB,
  contact_id UUID,
  contact_email TEXT,
  contact_first_name TEXT,
  contact_last_name TEXT,
  contact_status TEXT,
  property_address TEXT,
  loan_id UUID,
  loan_amount NUMERIC,
  loan_rate NUMERIC,
  loan_type TEXT,
  loan_status TEXT,
  closing_date DATE,
  org_id UUID,
  last_drip_send_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id AS enrollment_id,
    e.status::TEXT AS enrollment_status,
    e.current_step,
    e.enrolled_at,
    c_camp.id AS campaign_id,
    c_camp.name AS campaign_name,
    c_camp.audience::TEXT AS campaign_audience,
    c_camp.exit_rules,
    s.id AS step_id,
    s.step_order,
    s.name AS step_name,
    s.skeleton,
    s.tone::TEXT AS tone,
    s.channel::TEXT AS channel,
    s.requires_approval,
    s.trigger_type::TEXT AS trigger_type,
    s.trigger_config,
    ct.id AS contact_id,
    ct.email AS contact_email,
    ct.first_name AS contact_first_name,
    ct.last_name AS contact_last_name,
    ct.status AS contact_status,
    l.property_address,
    l.id AS loan_id,
    l.loan_amount,
    l.rate AS loan_rate,
    l.loan_type,
    l.status AS loan_status,
    l.closing_date,
    e.org_id,
    (SELECT MAX(ds.sent_at) FROM drip_sends ds WHERE ds.contact_id = ct.id AND ds.sent_at IS NOT NULL) AS last_drip_send_at
  FROM drip_enrollments e
  JOIN drip_campaigns c_camp ON c_camp.id = e.campaign_id
  JOIN contacts ct ON ct.id = e.contact_id
  JOIN drip_steps s ON s.campaign_id = e.campaign_id AND s.step_order = e.current_step + 1
  LEFT JOIN loans l ON l.id = e.loan_id
  WHERE e.status = 'active'
    AND e.next_send_at <= NOW()
    AND c_camp.status = 'active'
  ORDER BY e.next_send_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
