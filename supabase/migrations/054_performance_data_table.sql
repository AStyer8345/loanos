-- Performance data table — stores org P&L tracker state as a versioned JSONB blob
-- Replaces localStorage on the Performance page; org-isolated, PII-safe
CREATE TABLE IF NOT EXISTS performance_data (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  year            integer NOT NULL DEFAULT EXTRACT(year FROM NOW()),
  data            jsonb NOT NULL DEFAULT '{"loans":[],"oie":{},"nextId":12}'::jsonb,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, year)
);

ALTER TABLE performance_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read performance_data"
  ON performance_data FOR SELECT
  USING (organization_id = get_my_organization_id());

CREATE POLICY "org members can insert performance_data"
  ON performance_data FOR INSERT
  WITH CHECK (organization_id = get_my_organization_id());

CREATE POLICY "org members can update performance_data"
  ON performance_data FOR UPDATE
  USING (organization_id = get_my_organization_id())
  WITH CHECK (organization_id = get_my_organization_id());
