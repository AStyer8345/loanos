-- 073_seed_drip_campaigns.sql
-- Seed drip campaign definitions and steps for Adam Styer | Mortgage Solutions LP

-- ============================================================
-- CAMPAIGNS
-- ============================================================

-- Past Client Retention
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1),
  'Past Client Retention',
  'past_client',
  'active',
  '4-6 emails/year + handwritten cards for closed borrowers. Stay top-of-mind for refis, referrals, and repeat business.',
  '[
    {"type": "unsubscribe", "config": {}},
    {"type": "bounce_limit", "config": {"max_bounces": 2}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Ghost Referral
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1),
  'Lead — Ghost Referral',
  'lead',
  'active',
  'Realtor sent a referral, borrower went quiet. 4-step sequence over 45 days, then moves to long-term nurture.',
  '[
    {"type": "status_change", "config": {"statuses": ["application_received", "in_process", "submitted", "under_contract", "active_loan", "closed"]}},
    {"type": "unsubscribe", "config": {}},
    {"type": "bounce_limit", "config": {"max_bounces": 2}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Incomplete Application
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1),
  'Lead — Incomplete App',
  'lead',
  'active',
  'Started application but never finished. 3-step sequence over 14 days.',
  '[
    {"type": "status_change", "config": {"statuses": ["application_received", "in_process", "submitted", "under_contract", "active_loan", "closed"]}},
    {"type": "unsubscribe", "config": {}},
    {"type": "bounce_limit", "config": {"max_bounces": 2}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Went Quiet
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1),
  'Lead — Went Quiet',
  'lead',
  'active',
  'Had real contact but timing was not right. Quarterly touches for up to 1 year, then long-term nurture.',
  '[
    {"type": "status_change", "config": {"statuses": ["application_received", "in_process", "submitted", "under_contract", "active_loan", "closed"]}},
    {"type": "unsubscribe", "config": {}},
    {"type": "bounce_limit", "config": {"max_bounces": 2}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Realtor Relationships
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1),
  'Realtor Relationships',
  'realtor',
  'active',
  '3-4 touchpoints/year for referral partners. Co-marketing offers, deal milestones, holidays.',
  '[
    {"type": "unsubscribe", "config": {}},
    {"type": "bounce_limit", "config": {"max_bounces": 2}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- Long-Term Nurture
INSERT INTO drip_campaigns (org_id, name, audience, status, description, exit_rules)
VALUES (
  (SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1),
  'Long-Term Nurture',
  'lead',
  'active',
  'Cold leads that completed their sequence. Newsletter + 1-2 seasonal emails/year. Minimal touch.',
  '[
    {"type": "status_change", "config": {"statuses": ["application_received", "in_process", "submitted", "under_contract", "active_loan", "closed"]}},
    {"type": "unsubscribe", "config": {}},
    {"type": "inactive", "config": {}}
  ]'::jsonb
)
ON CONFLICT (org_id, name) DO NOTHING;

-- ============================================================
-- STEPS — Past Client Retention
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   1, 'Closing Anniversary', 'annual_date', '{"date_field": "closing_date"}'::jsonb,
   'Congrats on [X] year(s) in [address]. Mention equity change since purchase. Mention current rate environment if relevant to their rate. Light tone — no hard sell. Sign off warm.',
   'both', false, 'knowledgeable_friend'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   2, 'Birthday', 'annual_date', '{"date_field": "birthday"}'::jsonb,
   'Happy birthday. Keep it warm and genuinely personal. No business talk whatsoever. Short — 2-3 sentences max.',
   'both', false, 'knowledgeable_friend'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   3, 'Rate Drop Alert', 'condition', '{"rate_drop_threshold": 0.75}'::jsonb,
   'Their locked rate: [X]. Current market rate: [Y]. Show monthly payment savings and 5-year total savings. Direct CTA — call or text to discuss. Keep it factual and specific to their numbers.',
   'email', true, 'knowledgeable_friend'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   4, 'Equity Check-In', 'relative_days', '{"days": 180}'::jsonb,
   'Estimated current home value vs their purchase price. Dollar amount of equity gained. If equity is substantial (>20%), mention HELOC or cash-out refi as options. Educational tone — explain what equity means practically. Not salesy.',
   'email', false, 'knowledgeable_friend'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   5, 'Seasonal Value Touch', 'annual_date', '{"date_field": "seasonal_march"}'::jsonb,
   'Spring: homestead exemption filing deadline reminder for Texas. Fall: year-end tax tip related to mortgage interest deduction or property tax timing. Always timely, useful, and locally relevant to Austin/Central TX.',
   'email', false, 'knowledgeable_friend'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Past Client Retention' LIMIT 1),
   6, 'Holiday', 'annual_date', '{"date_field": "holiday_thanksgiving"}'::jsonb,
   'Warm and personal. Reference their home specifically. Express genuine gratitude — not marketing gratitude. No CTA, no business talk. Just a good human moment.',
   'email', false, 'knowledgeable_friend');

-- ============================================================
-- STEPS — Ghost Referral
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Ghost Referral' LIMIT 1),
   1, 'Warm Intro Follow-up', 'relative_days', '{"days": 3}'::jsonb,
   'Follow up on the intro from [realtor name]. Keep it brief and low-pressure. Mention you are available when they are ready. Include one useful thing — a quick market snapshot or what to expect in the process.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Ghost Referral' LIMIT 1),
   2, 'Value Add', 'relative_days', '{"days": 7}'::jsonb,
   'Share something genuinely useful — Austin market snapshot, current affordability numbers for their price range, or a quick explainer on a common buyer question. No ask. Just value.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Ghost Referral' LIMIT 1),
   3, 'Soft Check-In', 'relative_days', '{"days": 21}'::jsonb,
   'Quick check-in. Acknowledge they may not be ready yet and that is fine. Mention one relevant market update. Keep it to 3-4 sentences.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Ghost Referral' LIMIT 1),
   4, 'Final Touch', 'relative_days', '{"days": 45}'::jsonb,
   'Last email in the sequence. Door is always open. No pressure. Mention you will still be sending market updates occasionally. Warm and genuine close.',
   'email', false, 'straight_shooter');

-- ============================================================
-- STEPS — Incomplete Application
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Incomplete App' LIMIT 1),
   1, 'Helpful Nudge', 'relative_days', '{"days": 2}'::jsonb,
   'Noticed they started the application. Walk them through what to expect — timeline, documents needed, next steps. Make it feel easy, not overwhelming. Offer to help if they got stuck.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Incomplete App' LIMIT 1),
   2, 'Common Questions', 'relative_days', '{"days": 5}'::jsonb,
   'Address the top 3 hesitations people have when applying: credit score worries, how much documentation is needed, and whether they will be locked into anything. Reassure with facts, not fluff.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Incomplete App' LIMIT 1),
   3, 'Personal Offer to Help', 'relative_days', '{"days": 14}'::jsonb,
   'Direct and personal — offer a quick 10-minute call to answer any questions and walk them through the rest. Include Calendly link. Last email in sequence — not pushy, just available.',
   'email', false, 'straight_shooter');

-- ============================================================
-- STEPS — Went Quiet
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Went Quiet' LIMIT 1),
   1, 'Market Update', 'relative_days', '{"days": 30}'::jsonb,
   'Relevant market update for their situation — if they were looking at a specific area or price range, reference that. Current rates, inventory levels, what buyers are seeing right now in Austin.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Went Quiet' LIMIT 1),
   2, 'Rate/Affordability Change', 'relative_days', '{"days": 60}'::jsonb,
   'If rates have moved since you last talked, show what that means for monthly payment at their target price. Concrete numbers. If rates have not moved much, share an affordability tip instead.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Went Quiet' LIMIT 1),
   3, 'Check-In', 'relative_days', '{"days": 90}'::jsonb,
   'Casual check-in. Reference your last conversation if possible. Ask if anything has changed in their timeline. 3-4 sentences max.',
   'email', false, 'straight_shooter'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Lead — Went Quiet' LIMIT 1),
   4, 'Quarterly Touch', 'relative_days', '{"days": 180}'::jsonb,
   'Ongoing quarterly touch — rotate between market updates, rate changes, and seasonal tips. Keep it fresh each time. After 1 year, they move to long-term nurture.',
   'email', false, 'straight_shooter');

-- ============================================================
-- STEPS — Realtor Relationships
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Realtor Relationships' LIMIT 1),
   1, 'Deal Anniversary', 'annual_date', '{"date_field": "first_deal_date"}'::jsonb,
   'One year since our first closed deal together. Reference the specific transaction. Express genuine appreciation for the partnership. Keep it professional and peer-level.',
   'email', false, 'quiet_confidence'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Realtor Relationships' LIMIT 1),
   2, 'Milestone Celebration', 'condition', '{"deals_milestone": 5}'::jsonb,
   'We just hit [X] closed loans together. Celebrate the milestone. Reference the partnership growth. This is a big deal — make it feel like one.',
   'email', true, 'quiet_confidence'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Realtor Relationships' LIMIT 1),
   3, 'Co-Marketing Offer', 'relative_days', '{"days": 180}'::jsonb,
   'Offer to create something useful for them — open house flyer with both our info, social media content for their listings, or a buyer guide they can share. Make it about making THEM look good.',
   'email', true, 'quiet_confidence'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Realtor Relationships' LIMIT 1),
   4, 'Holiday', 'annual_date', '{"date_field": "holiday_thanksgiving"}'::jsonb,
   'Warm holiday message. Reference the working relationship. Express gratitude for their trust and partnership. No business ask.',
   'email', false, 'quiet_confidence');

-- ============================================================
-- STEPS — Long-Term Nurture
-- ============================================================

INSERT INTO drip_steps (org_id, campaign_id, step_order, name, trigger_type, trigger_config, skeleton, channel, requires_approval, tone)
VALUES
  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Long-Term Nurture' LIMIT 1),
   1, 'Spring Seasonal', 'annual_date', '{"date_field": "seasonal_march"}'::jsonb,
   'Spring market update or homeownership tip. Light touch — they are on the back burner but still in the ecosystem. One useful thing, no pressure.',
   'email', false, 'knowledgeable_friend'),

  ((SELECT id FROM organizations WHERE name = 'Adam Styer | Mortgage Solutions LP' LIMIT 1), (SELECT id FROM drip_campaigns WHERE name = 'Long-Term Nurture' LIMIT 1),
   2, 'Fall Seasonal', 'annual_date', '{"date_field": "seasonal_october"}'::jsonb,
   'Fall/year-end market update or tax-related tip. Same light touch as spring. Keep them aware you exist without being annoying.',
   'email', false, 'knowledgeable_friend');
