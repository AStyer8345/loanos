-- ============================================================
-- DEMO DATA — seed-demo-expand-v2.sql
-- Purpose: expand test@loanos.dev into a realistic solo-LO book
--          for screenshot/demo use.
--
-- Prereq:  seed-test-user.sql already applied (test user exists).
-- Scope:   user_id = deadbeef-dead-beef-dead-beefdeadbe01
--          organization_id = eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee
--
-- Adds:
--   * 110 new contacts (90 borrowers, 10 realtors, 5 FAs, 5 other sphere)
--   * 22 new FUNDED loans distributed Jan-Apr 2026 (steady climb)
--       → brings YTD 2026 to ~35 loans / ~$17M volume
--   * ~90 new activity_log entries
--   * Replaces mcc_state blob with a populated marketing dashboard:
--       12 weeks of rate-update log, 4 newsletters, 20 social posts,
--       tasks + call history across realtors/preapprovals/inprocess
--
-- Idempotent: all inserts ON CONFLICT DO NOTHING, mcc_state is UPSERT.
-- Safe to re-run.
-- ============================================================

-- ─────────────────────────────────────────────────
-- 0. CONSTANTS (PL/pgSQL DO block would work, but plain SQL is simpler)
-- ─────────────────────────────────────────────────
-- user_id:         deadbeef-dead-beef-dead-beefdeadbe01
-- organization_id: eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee

-- ─────────────────────────────────────────────────
-- 1. NEW CONTACTS — Past clients / closed borrowers (70)
--    These back the expanded YTD funded loan list.
-- ─────────────────────────────────────────────────

INSERT INTO contacts (id, user_id, organization_id, first_name, last_name, email, phone, contact_type, group_tag, stage, mailing_city, mailing_state, contact_group, account_name)
VALUES
  ('d0000000-0000-4000-a000-000000000301','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Tyler','Benson','tyler.benson@email.com','512-555-0301','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000302','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Rachel','Nguyen','rachel.nguyen@email.com','512-555-0302','borrower','Client','Closed','Round Rock','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000303','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Miguel','Rivera','miguel.rivera@email.com','512-555-0303','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000304','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Kayla','Okonkwo','kayla.okonkwo@email.com','512-555-0304','borrower','Client','Closed','Leander','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000305','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Brandon','Matthews','brandon.m@email.com','512-555-0305','borrower','Client','Closed','Cedar Park','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000306','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Sophia','Reyes','sophia.reyes@email.com','512-555-0306','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000307','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Nathan','Kim','nathan.kim@email.com','512-555-0307','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000308','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Isabella','Martinez','isabella.m@email.com','512-555-0308','borrower','Client','Closed','Pflugerville','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000309','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Ethan','O''Brien','ethan.obrien@email.com','512-555-0309','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000310','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Olivia','Pham','olivia.pham@email.com','512-555-0310','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000311','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Caleb','Johnson','caleb.johnson@email.com','512-555-0311','borrower','Client','Closed','Georgetown','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000312','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Maya','Patel','maya.patel@email.com','512-555-0312','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000313','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Austin','Walker','austin.walker@email.com','512-555-0313','borrower','Client','Closed','Buda','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000314','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Zoe','Chen','zoe.chen@email.com','512-555-0314','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000315','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Dylan','Foster','dylan.foster@email.com','512-555-0315','borrower','Client','Closed','Kyle','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000316','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Camila','Ortega','camila.ortega@email.com','512-555-0316','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000317','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Ryan','McKenzie','ryan.mckenzie@email.com','512-555-0317','borrower','Client','Closed','Lakeway','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000318','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Aisha','Williams','aisha.w@email.com','512-555-0318','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000319','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Connor','Brady','connor.brady@email.com','512-555-0319','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000320','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Gabriela','Silva','gabriela.silva@email.com','512-555-0320','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000321','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Jordan','Harris','jordan.harris@email.com','512-555-0321','borrower','Client','Closed','Hutto','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000322','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Lily','Tanaka','lily.tanaka@email.com','512-555-0322','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000323','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Mason','Schroeder','mason.s@email.com','512-555-0323','borrower','Client','Closed','Dripping Springs','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000324','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Elena','Vasquez','elena.v@email.com','512-555-0324','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000325','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Logan','Pierce','logan.pierce@email.com','512-555-0325','borrower','Client','Closed','Round Rock','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000326','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Fatima','Ali','fatima.ali@email.com','512-555-0326','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000327','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Austin','Grant','austin.grant@email.com','512-555-0327','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000328','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Sarah','Novak','sarah.novak@email.com','512-555-0328','borrower','Client','Closed','Cedar Park','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000329','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Dillon','Ross','dillon.ross@email.com','512-555-0329','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000330','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Priscilla','Gomez','priscilla.gomez@email.com','512-555-0330','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000331','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Blake','Henderson','blake.h@email.com','512-555-0331','borrower','Client','Closed','Pflugerville','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000332','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Jenna','Kowalski','jenna.k@email.com','512-555-0332','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000333','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Cole','Rodriguez','cole.rodriguez@email.com','512-555-0333','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000334','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Hannah','Becker','hannah.becker@email.com','512-555-0334','borrower','Client','Closed','Leander','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000335','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Trevor','Singh','trevor.singh@email.com','512-555-0335','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000336','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Mia','Abdullah','mia.abdullah@email.com','512-555-0336','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000337','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Grant','Phillips','grant.phillips@email.com','512-555-0337','borrower','Client','Closed','Georgetown','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000338','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Lucia','Moreno','lucia.moreno@email.com','512-555-0338','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000339','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Parker','Wallace','parker.wallace@email.com','512-555-0339','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000340','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Emilia','Fox','emilia.fox@email.com','512-555-0340','borrower','Client','Closed','Round Rock','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000341','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Wyatt','Holcomb','wyatt.h@email.com','512-555-0341','borrower','Client','Closed','Kyle','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000342','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Natalia','Ibarra','natalia.ibarra@email.com','512-555-0342','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000343','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Jackson','Lee','jackson.lee@email.com','512-555-0343','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000344','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Vera','Thompson','vera.thompson@email.com','512-555-0344','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000345','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Sebastian','Hoang','sebastian.h@email.com','512-555-0345','borrower','Client','Closed','Cedar Park','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000346','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Addison','Graves','addison.graves@email.com','512-555-0346','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000347','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Luke','Baldwin','luke.baldwin@email.com','512-555-0347','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000348','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Julia','Kavanaugh','julia.k@email.com','512-555-0348','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000349','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Hunter','Decker','hunter.decker@email.com','512-555-0349','borrower','Client','Closed','Buda','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000350','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Samara','Jensen','samara.jensen@email.com','512-555-0350','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000351','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Levi','Carrillo','levi.carrillo@email.com','512-555-0351','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000352','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Harper','Quinn','harper.quinn@email.com','512-555-0352','borrower','Client','Closed','Round Rock','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000353','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Jared','Vasquez','jared.vasquez@email.com','512-555-0353','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000354','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Kira','Wallace','kira.wallace@email.com','512-555-0354','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000355','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Drew','Cassidy','drew.cassidy@email.com','512-555-0355','borrower','Client','Closed','Pflugerville','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000356','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Rosa','Martinelli','rosa.m@email.com','512-555-0356','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000357','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Ian','Buchanan','ian.buchanan@email.com','512-555-0357','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000358','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Yasmin','Ahmadi','yasmin.a@email.com','512-555-0358','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000359','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Corbin','Hayes','corbin.hayes@email.com','512-555-0359','borrower','Client','Closed','Lakeway','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000360','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Ashanti','Bell','ashanti.bell@email.com','512-555-0360','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000361','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Sawyer','Pratt','sawyer.pratt@email.com','512-555-0361','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000362','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Alina','Popescu','alina.popescu@email.com','512-555-0362','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000363','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Tobias','Knight','tobias.knight@email.com','512-555-0363','borrower','Client','Closed','Georgetown','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000364','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Shelby','Cross','shelby.cross@email.com','512-555-0364','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000365','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Adrian','Castellanos','adrian.c@email.com','512-555-0365','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000366','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Piper','Watson','piper.watson@email.com','512-555-0366','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000367','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Elijah','Ward','elijah.ward@email.com','512-555-0367','borrower','Client','Closed','Cedar Park','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000368','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Nadine','Kouri','nadine.kouri@email.com','512-555-0368','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000369','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Cade','Sutherland','cade.s@email.com','512-555-0369','borrower','Client','Closed','Austin','TX','Client','Database'),
  ('d0000000-0000-4000-a000-000000000370','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Aviva','Goldstein','aviva.g@email.com','512-555-0370','borrower','Client','Closed','Austin','TX','Client','Database')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 2. NEW CONTACTS — Past clients / sphere (20 more, non-closed mix)
-- ─────────────────────────────────────────────────

INSERT INTO contacts (id, user_id, organization_id, first_name, last_name, email, phone, contact_type, group_tag, stage, mailing_city, mailing_state, contact_group, account_name, notes)
VALUES
  ('d0000000-0000-4000-a000-000000000371','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Micah','Delgado','micah.delgado@email.com','512-555-0371','borrower','Client','Past Client','Austin','TX','Client','Database','Closed 2024, sent holiday card'),
  ('d0000000-0000-4000-a000-000000000372','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Pearl','Nakagawa','pearl.n@email.com','512-555-0372','borrower','Client','Past Client','Round Rock','TX','Client','Database','Closed 2023, rate watch'),
  ('d0000000-0000-4000-a000-000000000373','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Roman','Peralta','roman.peralta@email.com','512-555-0373','borrower','Client','Past Client','Austin','TX','Client','Database','Closed 2024, referral source'),
  ('d0000000-0000-4000-a000-000000000374','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Celeste','Mahoney','celeste.m@email.com','512-555-0374','borrower','Client','Past Client','Austin','TX','Client','Database','Closed 2022'),
  ('d0000000-0000-4000-a000-000000000375','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Nolan','Fitzpatrick','nolan.f@email.com','512-555-0375','borrower','Client','Past Client','Georgetown','TX','Client','Database','Closed 2024'),
  ('d0000000-0000-4000-a000-000000000376','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Iris','Zhang','iris.zhang@email.com','512-555-0376','borrower','Client','Past Client','Austin','TX','Client','Database','Closed 2023, 6.875% rate — refi candidate'),
  ('d0000000-0000-4000-a000-000000000377','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Finn','Gallagher','finn.g@email.com','512-555-0377','borrower','Client','Past Client','Austin','TX','Client','Database','Closed 2022'),
  ('d0000000-0000-4000-a000-000000000378','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Dani','Okafor','dani.okafor@email.com','512-555-0378','borrower','Client','Past Client','Austin','TX','Client','Database','Closed 2023'),
  ('d0000000-0000-4000-a000-000000000379','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Reed','Huxley','reed.huxley@email.com','512-555-0379','borrower','Client','Past Client','Cedar Park','TX','Client','Database','Closed 2024'),
  ('d0000000-0000-4000-a000-000000000380','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Marisol','Vega','marisol.vega@email.com','512-555-0380','borrower','Client','Past Client','Austin','TX','Client','Database','Closed 2023'),
  ('d0000000-0000-4000-a000-000000000381','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Kai','Bennington','kai.b@email.com','512-555-0381','borrower','Prospect','Prospect','Austin','TX','Prospect','Database','Not yet ready — 6mo out'),
  ('d0000000-0000-4000-a000-000000000382','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Esperanza','Rojas','esperanza.r@email.com','512-555-0382','borrower','Prospect','Prospect','Austin','TX','Prospect','Database','Rate watch 6.0%'),
  ('d0000000-0000-4000-a000-000000000383','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Grayson','Tate','grayson.tate@email.com','512-555-0383','borrower','Prospect','Prospect','Austin','TX','Prospect','Database','Building credit — 90 days'),
  ('d0000000-0000-4000-a000-000000000384','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Josephine','Ruiz','josephine.r@email.com','512-555-0384','borrower','Prospect','Prospect','Round Rock','TX','Prospect','Database','Divorce closing — refi timing'),
  ('d0000000-0000-4000-a000-000000000385','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Atlas','Morrison','atlas.m@email.com','512-555-0385','borrower','Prospect','Prospect','Austin','TX','Prospect','Database','Self-employed, needs 2yr tax return'),
  ('d0000000-0000-4000-a000-000000000386','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Juniper','Keene','juniper.k@email.com','512-555-0386','borrower','Prospect','Prospect','Austin','TX','Prospect','Database','Saving for down payment'),
  ('d0000000-0000-4000-a000-000000000387','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Sterling','Ward','sterling.ward@email.com','512-555-0387','borrower','Prospect','Prospect','Austin','TX','Prospect','Database','Jumbo candidate'),
  ('d0000000-0000-4000-a000-000000000388','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Cordelia','Banks','cordelia.b@email.com','512-555-0388','borrower','Prospect','Prospect','Austin','TX','Prospect','Database','Referral from Priya Nair'),
  ('d0000000-0000-4000-a000-000000000389','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Houston','Spears','houston.s@email.com','512-555-0389','borrower','Prospect','Prospect','Austin','TX','Prospect','Database','VA eligible'),
  ('d0000000-0000-4000-a000-000000000390','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Tessa','Montoya','tessa.montoya@email.com','512-555-0390','borrower','Prospect','Prospect','Austin','TX','Prospect','Database','First-time buyer, DPA candidate')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 3. NEW CONTACTS — Realtors (10)
-- ─────────────────────────────────────────────────

INSERT INTO contacts (id, user_id, organization_id, first_name, last_name, email, phone, contact_type, group_tag, company_name, contact_group, account_name)
VALUES
  ('d0000000-0000-4000-a000-000000000401','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Blair','Henderson','blair.h@compass.com','512-555-0401','realtor','Realtor','Compass Austin','Realtor','Realtor Database'),
  ('d0000000-0000-4000-a000-000000000402','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Jackson','Pierce','jackson.p@elliman.com','512-555-0402','realtor','Realtor','Douglas Elliman Austin','Realtor','Realtor Database'),
  ('d0000000-0000-4000-a000-000000000403','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Elise','Tanaka','elise.t@kw.com','512-555-0403','realtor','Realtor','Keller Williams Austin','Realtor','Realtor Database'),
  ('d0000000-0000-4000-a000-000000000404','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Marcus','Whitfield','marcus.w@exp.com','512-555-0404','realtor','Realtor','eXp Realty','Realtor','Realtor Database'),
  ('d0000000-0000-4000-a000-000000000405','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Catherine','Doyle','catherine.d@jbgoodwin.com','512-555-0405','realtor','Realtor','JBGoodwin REALTORS','Realtor','Realtor Database'),
  ('d0000000-0000-4000-a000-000000000406','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Rafael','Arroyo','rafael.a@realtyaustin.com','512-555-0406','realtor','Realtor','Realty Austin','Realtor','Realtor Database'),
  ('d0000000-0000-4000-a000-000000000407','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Meredith','Bishop','meredith.b@moreland.com','512-555-0407','realtor','Realtor','Moreland Properties','Realtor','Realtor Database'),
  ('d0000000-0000-4000-a000-000000000408','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Declan','Moss','declan.m@bramlett.com','512-555-0408','realtor','Realtor','Bramlett Residential','Realtor','Realtor Database'),
  ('d0000000-0000-4000-a000-000000000409','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Trinity','Harper','trinity.h@ahg.com','512-555-0409','realtor','Realtor','Austin Home Group','Realtor','Realtor Database'),
  ('d0000000-0000-4000-a000-000000000410','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Benjamin','Okafor','benjamin.o@twelverivers.com','512-555-0410','realtor','Realtor','Twelve Rivers Realty','Realtor','Realtor Database')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 4. NEW CONTACTS — Sphere (FAs, CPA, attorney, insurance) — 10
-- ─────────────────────────────────────────────────

INSERT INTO contacts (id, user_id, organization_id, first_name, last_name, email, phone, contact_type, group_tag, company_name, contact_group, account_name)
VALUES
  ('d0000000-0000-4000-a000-000000000501','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Heather','Brinkman','h.brinkman@edwardjones.com','512-555-0501','other','Financial Advisor','Edward Jones Austin','Sphere','Database'),
  ('d0000000-0000-4000-a000-000000000502','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Samir','Desai','s.desai@ml.com','512-555-0502','other','Financial Advisor','Merrill Lynch','Sphere','Database'),
  ('d0000000-0000-4000-a000-000000000503','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Victoria','Chang','v.chang@ubs.com','512-555-0503','other','Financial Advisor','UBS Wealth','Sphere','Database'),
  ('d0000000-0000-4000-a000-000000000504','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Dominic','Russo','d.russo@ms.com','512-555-0504','other','Financial Advisor','Morgan Stanley','Sphere','Database'),
  ('d0000000-0000-4000-a000-000000000505','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Priscilla','Warner','p.warner@rj.com','512-555-0505','other','Financial Advisor','Raymond James','Sphere','Database'),
  ('d0000000-0000-4000-a000-000000000506','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Jack','Aldridge','jack@aldridgeins.com','512-555-0506','other','Insurance','Aldridge Insurance Group','Sphere','Database'),
  ('d0000000-0000-4000-a000-000000000507','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Rita','Castaneda','rita@castanedacpa.com','512-555-0507','other','CPA','Castaneda CPA','Sphere','Database'),
  ('d0000000-0000-4000-a000-000000000508','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Owen','Bradley','owen@bradleylaw.com','512-555-0508','other','Attorney','Bradley Law Firm','Sphere','Database'),
  ('d0000000-0000-4000-a000-000000000509','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Nora','Tillman','nora@tillmantax.com','512-555-0509','other','CPA','Tillman Tax Partners','Sphere','Database'),
  ('d0000000-0000-4000-a000-000000000510','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','Kevin','Moorehouse','kevin@txcapins.com','512-555-0510','other','Insurance','Texas Capital Insurance','Sphere','Database')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 5. NEW FUNDED LOANS — 22 loans, steady climb Jan-Apr 2026
--
--    Target distribution after seed:
--      Jan: 6 total (currently 2 → add 4)
--      Feb: 8 total (currently 8 → add 0)  -- actually we skew to Mar/Apr
--      Mar: 9 total (currently 3 → add 6)
--      Apr: 12 total (currently 0 → add 12)
--    Sum: 35 funded YTD, ~$17M volume
--
--    Avg loan amount: ~$485K (Austin median with 10-20% down)
-- ─────────────────────────────────────────────────

-- January additions (4 loans)
INSERT INTO loans (id, user_id, organization_id, contact_id, status, loan_amount, purchase_price, sales_price, commission_amount, interest_rate, loan_term, loan_program, loan_purpose, borrower_first_name, borrower_last_name, borrower_email, property_address, property_city, property_state, property_zip, closing_date, funding_date, loan_created_date, application_date, estimated_closing_date, first_payment_date, credit_score, down_payment_pct, ltv, occupancy_type)
VALUES
  ('e0000000-0000-4000-b000-000000000301','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000301','funded',432000,540000,540000,5400,6.625,360,'Conventional 30','Purchase','Tyler','Benson','tyler.benson@email.com','2412 Mueller Blvd','Austin','TX','78723','2026-01-09','2026-01-09','2025-11-20','2025-11-22','2026-01-09','2026-03-01',762,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000302','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000302','funded',368000,460000,460000,4600,6.750,360,'Conventional 30','Purchase','Rachel','Nguyen','rachel.nguyen@email.com','1508 Forest Creek Dr','Round Rock','TX','78664','2026-01-16','2026-01-16','2025-11-25','2025-11-28','2026-01-16','2026-03-01',738,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000303','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000303','funded',512000,640000,640000,6400,6.500,360,'Conventional 30','Purchase','Miguel','Rivera','miguel.rivera@email.com','3214 E Cesar Chavez','Austin','TX','78702','2026-01-23','2026-01-23','2025-12-05','2025-12-07','2026-01-23','2026-03-01',781,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000304','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000304','funded',298000,325000,325000,3725,6.875,360,'FHA 30','Purchase','Kayla','Okonkwo','kayla.okonkwo@email.com','805 Crystal Falls Pkwy','Leander','TX','78641','2026-01-30','2026-01-30','2025-12-10','2025-12-12','2026-01-30','2026-03-01',712,8,92,'Primary'),

-- March additions (6 loans)
  ('e0000000-0000-4000-b000-000000000305','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000305','funded',445000,556250,556250,5562,6.500,360,'Conventional 30','Purchase','Brandon','Matthews','brandon.m@email.com','1912 Whitestone Blvd','Cedar Park','TX','78613','2026-03-04','2026-03-04','2026-01-15','2026-01-18','2026-03-04','2026-05-01',745,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000306','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000306','funded',578000,722500,722500,7225,6.375,360,'Conventional 30','Purchase','Sophia','Reyes','sophia.reyes@email.com','3401 Clarkson Ave','Austin','TX','78703','2026-03-09','2026-03-09','2026-01-20','2026-01-22','2026-03-09','2026-05-01',792,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000307','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000307','funded',392000,490000,490000,4900,6.625,360,'Conventional 30','Purchase','Nathan','Kim','nathan.kim@email.com','1120 S Lamar Blvd','Austin','TX','78704','2026-03-13','2026-03-13','2026-01-22','2026-01-25','2026-03-13','2026-05-01',756,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000308','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000308','funded',315000,345000,345000,3937,6.875,360,'FHA 30','Purchase','Isabella','Martinez','isabella.m@email.com','2208 Pecan Branch','Pflugerville','TX','78660','2026-03-18','2026-03-18','2026-01-28','2026-02-01',NULL,'2026-05-01',718,9,91,'Primary'),
  ('e0000000-0000-4000-b000-000000000309','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000309','funded',612000,765000,765000,7650,6.375,360,'Jumbo 30','Purchase','Ethan','O''Brien','ethan.obrien@email.com','4015 Balcones Dr','Austin','TX','78731','2026-03-24','2026-03-24','2026-02-01',  '2026-02-04','2026-03-24','2026-05-01',788,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000310','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000310','funded',418000,522500,522500,5225,6.625,360,'Conventional 30','Purchase','Olivia','Pham','olivia.pham@email.com','903 Airline Dr','Austin','TX','78745','2026-03-30','2026-03-30','2026-02-08','2026-02-11','2026-03-30','2026-05-01',751,20,80,'Primary'),

-- April additions (12 loans — busiest month, hockey-stick close to today's date)
  ('e0000000-0000-4000-b000-000000000311','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000311','funded',465000,581250,581250,5812,6.500,360,'Conventional 30','Purchase','Caleb','Johnson','caleb.johnson@email.com','2500 Williams Dr','Georgetown','TX','78628','2026-04-01','2026-04-01','2026-02-12','2026-02-14','2026-04-01','2026-06-01',772,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000312','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000312','funded',538000,672500,672500,6725,6.500,360,'Conventional 30','Purchase','Maya','Patel','maya.patel@email.com','1807 Westover Rd','Austin','TX','78703','2026-04-02','2026-04-02','2026-02-13','2026-02-15','2026-04-02','2026-06-01',795,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000313','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000313','funded',342000,380000,380000,4275,6.875,360,'FHA 30','Purchase','Austin','Walker','austin.walker@email.com','512 Cabela Dr','Buda','TX','78610','2026-04-02','2026-04-02','2026-02-14','2026-02-17','2026-04-02','2026-06-01',724,10,90,'Primary'),
  ('e0000000-0000-4000-b000-000000000314','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000314','funded',485000,606250,606250,6062,6.500,360,'Conventional 30','Purchase','Zoe','Chen','zoe.chen@email.com','708 Bouldin Ave','Austin','TX','78704','2026-04-03','2026-04-03','2026-02-15','2026-02-18','2026-04-03','2026-06-01',767,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000315','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000315','funded',388000,485000,485000,4850,6.625,360,'Conventional 30','Purchase','Dylan','Foster','dylan.foster@email.com','1041 Burleson St','Kyle','TX','78640','2026-04-03','2026-04-03','2026-02-16','2026-02-19','2026-04-03','2026-06-01',741,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000316','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000316','funded',422000,527500,527500,5275,6.625,360,'Conventional 30','Purchase','Camila','Ortega','camila.ortega@email.com','2115 Quebec St','Austin','TX','78723','2026-04-04','2026-04-04','2026-02-18','2026-02-20','2026-04-04','2026-06-01',754,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000317','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000317','funded',712000,890000,890000,8900,6.375,360,'Jumbo 30','Purchase','Ryan','McKenzie','ryan.mckenzie@email.com','3300 Flintrock Trace','Lakeway','TX','78738','2026-04-04','2026-04-04','2026-02-19','2026-02-21','2026-04-04','2026-06-01',802,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000318','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000318','funded',372000,465000,465000,4650,6.625,360,'Conventional 30','Purchase','Aisha','Williams','aisha.w@email.com','1206 E 11th St','Austin','TX','78702','2026-04-04','2026-04-04','2026-02-20','2026-02-22','2026-04-04','2026-06-01',733,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000319','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000319','funded',458000,572500,572500,5725,6.500,360,'Conventional 30','Purchase','Connor','Brady','connor.brady@email.com','2901 West Ave','Austin','TX','78705','2026-04-05','2026-04-05','2026-02-22','2026-02-24','2026-04-05','2026-06-01',768,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000320','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000320','funded',405000,506250,506250,5062,6.625,360,'Conventional 30','Purchase','Gabriela','Silva','gabriela.silva@email.com','1522 S 5th St','Austin','TX','78704','2026-04-05','2026-04-05','2026-02-23','2026-02-25','2026-04-05','2026-06-01',759,20,80,'Primary'),
  ('e0000000-0000-4000-b000-000000000321','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000321','funded',348000,387000,387000,4350,6.875,360,'FHA 30','Purchase','Jordan','Harris','jordan.harris@email.com','612 Baker Ave','Hutto','TX','78634','2026-04-05','2026-04-05','2026-02-24','2026-02-26','2026-04-05','2026-06-01',721,10,90,'Primary'),
  ('e0000000-0000-4000-b000-000000000322','deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000322','funded',498000,622500,622500,6225,6.500,360,'Conventional 30','Purchase','Lily','Tanaka','lily.tanaka@email.com','3014 Hemphill Park','Austin','TX','78705','2026-04-05','2026-04-05','2026-02-25','2026-02-27','2026-04-05','2026-06-01',776,20,80,'Primary')
ON CONFLICT (id) DO NOTHING;


-- ─────────────────────────────────────────────────
-- 6. ACTIVITY LOG — milestones for each new loan (4 per loan = 88 rows)
--    Application, Pre-approval, Approval, Funded events
-- ─────────────────────────────────────────────────

INSERT INTO activity_log (id, user_id, organization_id, loan_id, action, type, summary, occurred_at, created_at)
SELECT
  gen_random_uuid(),
  'deadbeef-dead-beef-dead-beefdeadbe01',
  'eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee',
  l.id,
  evt.action,
  evt.type,
  evt.summary || ' — ' || l.borrower_first_name || ' ' || l.borrower_last_name,
  evt.occurred_at,
  evt.occurred_at
FROM loans l
CROSS JOIN LATERAL (
  VALUES
    ('Application Received', 'milestone', 'Application received', (l.application_date::timestamptz + interval '10 hours')),
    ('Pre-Approval Issued',  'milestone', 'Pre-approval letter issued', (l.application_date::timestamptz + interval '2 days')),
    ('Cleared to Close',     'milestone', 'File cleared to close', (l.closing_date::timestamptz - interval '3 days')),
    ('Loan Funded',          'milestone', 'Loan funded and disbursed', (l.funding_date::timestamptz + interval '14 hours'))
) AS evt(action, type, summary, occurred_at)
WHERE l.id::text LIKE 'e0000000-0000-4000-b000-0000000003%'
  AND l.user_id = 'deadbeef-dead-beef-dead-beefdeadbe01';


-- ─────────────────────────────────────────────────
-- 7. ACTIVITY LOG — Recent outreach across sphere (past 30 days)
-- ─────────────────────────────────────────────────

INSERT INTO activity_log (id, user_id, organization_id, contact_id, action, type, summary, occurred_at, created_at)
VALUES
  (gen_random_uuid(),'deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000401','Call','phone','Checked in on Q2 pipeline with Blair','2026-04-03 14:20:00','2026-04-03 14:20:00'),
  (gen_random_uuid(),'deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000402','Email','email','Sent Q2 rate outlook to Jackson','2026-04-02 10:15:00','2026-04-02 10:15:00'),
  (gen_random_uuid(),'deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000403','Text','text','Touched base with Elise on new listing','2026-04-01 16:45:00','2026-04-01 16:45:00'),
  (gen_random_uuid(),'deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000405','Call','phone','Coffee scheduled with Catherine','2026-03-30 11:00:00','2026-03-30 11:00:00'),
  (gen_random_uuid(),'deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000407','Email','email','Follow-up on Moreland co-marketing','2026-03-28 09:30:00','2026-03-28 09:30:00'),
  (gen_random_uuid(),'deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000376','Email','email','Refi check-in — rate dropped to 6.5%','2026-04-03 08:00:00','2026-04-03 08:00:00'),
  (gen_random_uuid(),'deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000372','Call','phone','Pearl inquiring about refi savings','2026-04-02 13:30:00','2026-04-02 13:30:00'),
  (gen_random_uuid(),'deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000382','Text','text','Esperanza rate watch — 6.0% trigger alert','2026-04-01 08:15:00','2026-04-01 08:15:00'),
  (gen_random_uuid(),'deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000501','Email','email','Q2 joint webinar prep with Heather','2026-04-04 15:00:00','2026-04-04 15:00:00'),
  (gen_random_uuid(),'deadbeef-dead-beef-dead-beefdeadbe01','eeeeeeee-eeee-4eee-aeee-eeeeeeeeeeee','d0000000-0000-4000-a000-000000000507','Call','phone','Rita CPA — buyer referral (self-employed)','2026-04-01 11:20:00','2026-04-01 11:20:00');


-- ─────────────────────────────────────────────────
-- 8. MARKETING DASHBOARD — replace mcc_state with rich blob
-- ─────────────────────────────────────────────────

INSERT INTO mcc_state (user_id, key, value, updated_at)
VALUES (
  'deadbeef-dead-beef-dead-beefdeadbe01',
  'mcc',
  jsonb_build_object(
    'tasks', jsonb_build_object(
      '2026-03-30', jsonb_build_object('rate-update', true, 'newsletter-prep', true, 'realtor-calls', true, 'social-post', true),
      '2026-04-06', jsonb_build_object('rate-update', true, 'realtor-calls', true, 'social-post', false, 'database-call-10', true),
      '2026-04-13', jsonb_build_object('rate-update', false, 'newsletter-send', false, 'realtor-calls', false, 'social-post', false)
    ),
    'last', jsonb_build_object(
      'rate-update', '2026-04-04T08:30:00.000Z',
      'newsletter', '2026-03-27T09:00:00.000Z',
      'database-call-10', '2026-04-03T16:00:00.000Z',
      'social-post', '2026-04-04T10:00:00.000Z'
    ),
    'log', jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-04-04T08:30:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr fixed 6.50%, 15yr 5.875%, jumbo 6.375% — sent to 412 contacts'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-04-04T10:00:00.000Z', 'activity', 'Social post: Austin spring market', 'channel', 'Instagram', 'notes', 'Auto-posted to FB, IG, LinkedIn, GBP via Publer'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-04-03T16:00:00.000Z', 'activity', 'Database 10 — made 8 calls', 'channel', 'Phone Call', 'notes', '2 refi conversations, 1 new PA scheduled'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-04-02T10:15:00.000Z', 'activity', 'Q2 outlook email to top realtors', 'channel', 'Email', 'notes', 'Sent to 10 A-tier agents'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-28T09:00:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr 6.625%, 15yr 6.00%'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-27T09:00:00.000Z', 'activity', 'Monthly newsletter sent', 'channel', 'Newsletter', 'notes', '1,847 recipients · 31.2% open rate · 4.8% CTR'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-24T14:30:00.000Z', 'activity', 'LinkedIn post: "5 things every Austin homebuyer should ask in 2026"', 'channel', 'LinkedIn', 'notes', '1.2K impressions, 28 reactions'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-21T08:30:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr 6.75%'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-17T09:00:00.000Z', 'activity', 'Coffee with Catherine Doyle (JBGoodwin)', 'channel', 'Phone Call', 'notes', 'Discussed listing pipeline Q2'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-14T08:30:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr 6.875%'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-07T08:30:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr 7.0%'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-27T09:00:00.000Z', 'activity', 'Monthly newsletter sent', 'channel', 'Newsletter', 'notes', '1,821 recipients · 29.8% open rate'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-21T08:30:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr 7.125%'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-14T08:30:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr 7.125%'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-07T08:30:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr 7.25%'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-01-30T09:00:00.000Z', 'activity', 'Monthly newsletter sent', 'channel', 'Newsletter', 'notes', '1,803 recipients · 30.4% open rate'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-01-24T08:30:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr 7.25%'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-01-17T08:30:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr 7.375%'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-01-10T08:30:00.000Z', 'activity', 'Weekly rate update sent', 'channel', 'Rate Update', 'notes', '30yr 7.375%'),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-01-03T09:00:00.000Z', 'activity', 'Monthly newsletter sent', 'channel', 'Newsletter', 'notes', '1,778 recipients · 28.9% open rate — 2026 kickoff')
    ),
    'contacts', jsonb_build_object(
      'realtors', jsonb_build_array(
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Blair', 'last', 'Henderson', 'company', 'Compass Austin', 'phone', '512-555-0401', 'email', 'blair.h@compass.com', 'lastTouch', '2026-04-03', 'note', 'A-tier, 6 deals last year', 'callHistory', jsonb_build_array(jsonb_build_object('date','2026-04-03','note','Q2 pipeline check'), jsonb_build_object('date','2026-03-20','note','Closed Benson file together'))),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Jackson', 'last', 'Pierce', 'company', 'Douglas Elliman', 'phone', '512-555-0402', 'email', 'jackson.p@elliman.com', 'lastTouch', '2026-04-02', 'note', 'Luxury Westlake focus', 'callHistory', jsonb_build_array(jsonb_build_object('date','2026-04-02','note','Sent Q2 rate outlook'))),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Elise', 'last', 'Tanaka', 'company', 'Keller Williams', 'phone', '512-555-0403', 'email', 'elise.t@kw.com', 'lastTouch', '2026-04-01', 'note', 'First-time buyer specialist', 'callHistory', jsonb_build_array(jsonb_build_object('date','2026-04-01','note','Text re: new listing'))),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Catherine', 'last', 'Doyle', 'company', 'JBGoodwin', 'phone', '512-555-0405', 'email', 'catherine.d@jbgoodwin.com', 'lastTouch', '2026-03-30', 'note', 'Top producer — 14 referrals ytd', 'callHistory', jsonb_build_array(jsonb_build_object('date','2026-03-30','note','Coffee scheduled'), jsonb_build_object('date','2026-03-17','note','Q2 pipeline discussion'))),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Meredith', 'last', 'Bishop', 'company', 'Moreland Properties', 'phone', '512-555-0407', 'email', 'meredith.b@moreland.com', 'lastTouch', '2026-03-28', 'note', 'Co-marketing partner', 'callHistory', jsonb_build_array(jsonb_build_object('date','2026-03-28','note','Follow-up on co-marketing'))),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Rafael', 'last', 'Arroyo', 'company', 'Realty Austin', 'phone', '512-555-0406', 'email', 'rafael.a@realtyaustin.com', 'lastTouch', null, 'note', 'New relationship — needs first coffee', 'callHistory', jsonb_build_array())
      ),
      'preapprovals', jsonb_build_array(
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'David', 'last', 'Park', 'company', '', 'phone', '512-555-0119', 'email', 'dpark@email.com', 'lastTouch', '2026-04-02', 'note', 'PA issued 2026-03-15, looking in Circle C', 'callHistory', jsonb_build_array(jsonb_build_object('date','2026-04-02','note','Follow-up on property search'))),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Monica', 'last', 'Castillo', 'company', '', 'phone', '512-555-0120', 'email', 'mcastillo@email.com', 'lastTouch', '2026-03-28', 'note', 'PA active, home hunting in Round Rock', 'callHistory', jsonb_build_array()),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Ryan', 'last', 'Nguyen', 'company', '', 'phone', '512-555-0121', 'email', 'rnguyen@email.com', 'lastTouch', null, 'note', 'PA expiring 2026-04-20 — needs refresh', 'callHistory', jsonb_build_array()),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Lauren', 'last', 'Simmons', 'company', '', 'phone', '512-555-0122', 'email', 'lsimmons@email.com', 'lastTouch', '2026-04-01', 'note', 'VA loan, actively shopping', 'callHistory', jsonb_build_array())
      ),
      'inprocess', jsonb_build_array(
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'James', 'last', 'Harwell', 'company', '', 'phone', '512-555-0101', 'email', 'james.harwell@email.com', 'lastTouch', '2026-04-03', 'note', 'UW conditions — missing bank statement pg 2', 'callHistory', jsonb_build_array(jsonb_build_object('date','2026-04-03','note','Sent doc request'))),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Maria', 'last', 'Gutierrez', 'company', '', 'phone', '512-555-0102', 'email', 'maria.g@email.com', 'lastTouch', '2026-04-02', 'note', 'CTC — closing 2026-04-14', 'callHistory', jsonb_build_array()),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Derek', 'last', 'Cho', 'company', '', 'phone', '512-555-0103', 'email', 'dcho@email.com', 'lastTouch', '2026-03-30', 'note', 'Appraisal delivered — waiting on HOI', 'callHistory', jsonb_build_array())
      ),
      'hotleads', jsonb_build_array(
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Iris', 'last', 'Zhang', 'company', '', 'phone', '512-555-0376', 'email', 'iris.zhang@email.com', 'lastTouch', '2026-04-03', 'note', 'Past client at 6.875% — strong refi fit', 'callHistory', jsonb_build_array(jsonb_build_object('date','2026-04-03','note','Ran refi scenario, $340/mo savings'))),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Pearl', 'last', 'Nakagawa', 'company', '', 'phone', '512-555-0372', 'email', 'pearl.n@email.com', 'lastTouch', '2026-04-02', 'note', 'Asking about refi — 7.25% current', 'callHistory', jsonb_build_array()),
        jsonb_build_object('id', gen_random_uuid()::text, 'first', 'Esperanza', 'last', 'Rojas', 'company', '', 'phone', '512-555-0382', 'email', 'esperanza.r@email.com', 'lastTouch', '2026-04-01', 'note', 'Rate trigger at 6.0%', 'callHistory', jsonb_build_array())
      )
    ),
    'socialPosts', jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-04-04', 'platform', 'Instagram', 'caption', 'Spring market in Austin is heating up — here''s what buyers need to know about rates this week.', 'status', 'published', 'engagement', jsonb_build_object('likes', 87, 'comments', 12)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-04-04', 'platform', 'Facebook', 'caption', 'Weekly rate update is out — 30yr fixed at 6.50%', 'status', 'published', 'engagement', jsonb_build_object('reach', 1240, 'reactions', 34)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-04-04', 'platform', 'LinkedIn', 'caption', '5 things every Austin homebuyer should ask their lender in 2026', 'status', 'published', 'engagement', jsonb_build_object('impressions', 1820, 'reactions', 42)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-04-04', 'platform', 'GBP', 'caption', 'Austin mortgage rate update — April 4, 2026', 'status', 'published', 'engagement', jsonb_build_object('views', 567)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-31', 'platform', 'Instagram', 'caption', 'Closed another Austin first-time buyer today — congrats Maya!', 'status', 'published', 'engagement', jsonb_build_object('likes', 124, 'comments', 19)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-28', 'platform', 'Instagram', 'caption', 'Weekly rate update — rates dropped again', 'status', 'published', 'engagement', jsonb_build_object('likes', 72, 'comments', 8)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-28', 'platform', 'Facebook', 'caption', 'Weekly rate update — March 28', 'status', 'published', 'engagement', jsonb_build_object('reach', 980, 'reactions', 22)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-24', 'platform', 'LinkedIn', 'caption', 'Self-employed buyers — yes, you can still get a mortgage in 2026', 'status', 'published', 'engagement', jsonb_build_object('impressions', 2210, 'reactions', 58)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-21', 'platform', 'Instagram', 'caption', 'Weekly rate update', 'status', 'published', 'engagement', jsonb_build_object('likes', 65, 'comments', 5)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-17', 'platform', 'GBP', 'caption', 'New Austin listing highlight — 3214 E Cesar Chavez', 'status', 'published', 'engagement', jsonb_build_object('views', 412)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-14', 'platform', 'Instagram', 'caption', 'Weekly rate update', 'status', 'published', 'engagement', jsonb_build_object('likes', 58, 'comments', 4)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-10', 'platform', 'Facebook', 'caption', 'Client testimonial: The Matthews family', 'status', 'published', 'engagement', jsonb_build_object('reach', 1540, 'reactions', 67)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-07', 'platform', 'Instagram', 'caption', 'Weekly rate update', 'status', 'published', 'engagement', jsonb_build_object('likes', 61, 'comments', 6)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-03', 'platform', 'LinkedIn', 'caption', 'Austin housing outlook — Q2 2026', 'status', 'published', 'engagement', jsonb_build_object('impressions', 1680, 'reactions', 44)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-28', 'platform', 'Instagram', 'caption', 'Weekly rate update', 'status', 'published', 'engagement', jsonb_build_object('likes', 69, 'comments', 7)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-24', 'platform', 'Facebook', 'caption', 'Client testimonial: The Rivera family', 'status', 'published', 'engagement', jsonb_build_object('reach', 1320, 'reactions', 55)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-21', 'platform', 'Instagram', 'caption', 'Weekly rate update', 'status', 'published', 'engagement', jsonb_build_object('likes', 54, 'comments', 3)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-17', 'platform', 'LinkedIn', 'caption', 'Why Austin is still a buyer''s market in 2026', 'status', 'published', 'engagement', jsonb_build_object('impressions', 1920, 'reactions', 51)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-14', 'platform', 'Instagram', 'caption', 'Weekly rate update — Valentine''s edition', 'status', 'published', 'engagement', jsonb_build_object('likes', 98, 'comments', 14)),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-07', 'platform', 'Instagram', 'caption', 'Weekly rate update', 'status', 'published', 'engagement', jsonb_build_object('likes', 52, 'comments', 4))
    ),
    'newsletters', jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-03-27', 'subject', 'Austin Market Pulse — Spring Kickoff', 'status', 'sent', 'recipients', 1847, 'openRate', 31.2, 'clickRate', 4.8),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-02-27', 'subject', 'February Rate Outlook & Market Notes', 'status', 'sent', 'recipients', 1821, 'openRate', 29.8, 'clickRate', 4.2),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-01-30', 'subject', 'What to Expect in the Austin Market This Year', 'status', 'sent', 'recipients', 1803, 'openRate', 30.4, 'clickRate', 5.1),
      jsonb_build_object('id', gen_random_uuid()::text, 'date', '2026-01-03', 'subject', '2026 Kickoff — A Note from Adam', 'status', 'sent', 'recipients', 1778, 'openRate', 28.9, 'clickRate', 3.9)
    ),
    'todos', jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Follow up with Ryan Nguyen on PA refresh', 'due', '2026-04-07', 'priority', 'high'),
      jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Coffee with Rafael Arroyo (Realty Austin) — first meeting', 'due', '2026-04-10', 'priority', 'medium'),
      jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Run refi scenario for Iris Zhang', 'due', '2026-04-06', 'priority', 'high'),
      jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Draft April newsletter — Q2 rate outlook', 'due', '2026-04-20', 'priority', 'medium'),
      jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Record video testimonial with Matthews family', 'due', '2026-04-15', 'priority', 'low')
    ),
    'doneTodos', jsonb_build_array(
      jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Send Q2 outlook to top 10 realtors', 'doneDate', '2026-04-02'),
      jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Weekly rate update — April 4', 'doneDate', '2026-04-04'),
      jsonb_build_object('id', gen_random_uuid()::text, 'text', 'Database 10 calls this week', 'doneDate', '2026-04-03'),
      jsonb_build_object('id', gen_random_uuid()::text, 'text', 'March newsletter — send to list', 'doneDate', '2026-03-27')
    )
  ),
  now()
)
ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ============================================================
-- END seed-demo-expand-v2.sql
-- ============================================================
