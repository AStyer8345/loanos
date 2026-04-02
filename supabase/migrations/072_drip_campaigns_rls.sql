-- 072_drip_campaigns_rls.sql
ALTER TABLE drip_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE drip_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drip_campaigns_select" ON drip_campaigns FOR SELECT USING (org_id = get_my_organization_id());
CREATE POLICY "drip_campaigns_insert" ON drip_campaigns FOR INSERT WITH CHECK (org_id = get_my_organization_id());
CREATE POLICY "drip_campaigns_update" ON drip_campaigns FOR UPDATE USING (org_id = get_my_organization_id());
CREATE POLICY "drip_campaigns_delete" ON drip_campaigns FOR DELETE USING (org_id = get_my_organization_id() AND get_my_role() = 'admin');

CREATE POLICY "drip_steps_select" ON drip_steps FOR SELECT USING (org_id = get_my_organization_id());
CREATE POLICY "drip_steps_insert" ON drip_steps FOR INSERT WITH CHECK (org_id = get_my_organization_id());
CREATE POLICY "drip_steps_update" ON drip_steps FOR UPDATE USING (org_id = get_my_organization_id());
CREATE POLICY "drip_steps_delete" ON drip_steps FOR DELETE USING (org_id = get_my_organization_id() AND get_my_role() = 'admin');

CREATE POLICY "drip_enrollments_select" ON drip_enrollments FOR SELECT USING (org_id = get_my_organization_id());
CREATE POLICY "drip_enrollments_insert" ON drip_enrollments FOR INSERT WITH CHECK (org_id = get_my_organization_id());
CREATE POLICY "drip_enrollments_update" ON drip_enrollments FOR UPDATE USING (org_id = get_my_organization_id());
CREATE POLICY "drip_enrollments_delete" ON drip_enrollments FOR DELETE USING (org_id = get_my_organization_id() AND get_my_role() = 'admin');

CREATE POLICY "drip_sends_select" ON drip_sends FOR SELECT USING (org_id = get_my_organization_id());
CREATE POLICY "drip_sends_insert" ON drip_sends FOR INSERT WITH CHECK (org_id = get_my_organization_id());
CREATE POLICY "drip_sends_update" ON drip_sends FOR UPDATE USING (org_id = get_my_organization_id());
