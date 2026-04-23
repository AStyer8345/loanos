-- Fire realtor referral acknowledgment webhook when a new contact is created
-- with referral_type = 'realtor_referral' and a referred_by value.
-- Routes to n8n workflow H5doQYLLIAg0zMug (webhook: realtor-referral-ack).

CREATE OR REPLACE FUNCTION notify_n8n_realtor_referral_ack()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_type = 'realtor_referral' AND NEW.referred_by IS NOT NULL AND NEW.referred_by != '' THEN
    PERFORM net.http_post(
      url     := 'https://styer.app.n8n.cloud/webhook/realtor-referral-ack',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body    := json_build_object(
        'contact_id',      NEW.id,
        'first_name',      NEW.first_name,
        'last_name',       NEW.last_name,
        'organization_id', NEW.organization_id,
        'referred_by',     NEW.referred_by
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_realtor_referral_contact_inserted ON contacts;

CREATE TRIGGER on_realtor_referral_contact_inserted
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION notify_n8n_realtor_referral_ack();
