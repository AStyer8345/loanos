// src/lib/drip/types.ts
// TypeScript types for the drip campaign system

export type DripAudience = 'past_client' | 'lead' | 'realtor'
export type DripCampaignStatus = 'active' | 'paused' | 'archived'
export type DripTriggerType = 'relative_days' | 'annual_date' | 'condition'
export type DripChannel = 'email' | 'handwritten_card' | 'both'
export type DripTone = 'straight_shooter' | 'knowledgeable_friend' | 'quiet_confidence'
export type DripEnrollmentStatus = 'active' | 'paused' | 'completed' | 'removed'
export type DripEnrolledBy = 'auto' | 'manual'
export type DripSendStatus = 'queued' | 'approved' | 'sent' | 'skipped' | 'cancelled'

export interface ExitRule {
  type: 'status_change' | 'bounce_limit' | 'unsubscribe' | 'inactive'
  config: {
    statuses?: string[]
    max_bounces?: number
  }
}

export interface TriggerConfig {
  days?: number
  date_field?: string
  rate_drop_threshold?: number
}

export interface DripCampaignRow {
  id: string
  org_id: string
  name: string
  audience: DripAudience
  status: DripCampaignStatus
  description: string | null
  exit_rules: ExitRule[]
  created_at: string
  updated_at: string
}

export interface DripStepRow {
  id: string
  org_id: string
  campaign_id: string
  step_order: number
  name: string
  trigger_type: DripTriggerType
  trigger_config: TriggerConfig
  skeleton: string
  channel: DripChannel
  requires_approval: boolean
  tone: DripTone
  created_at: string
  updated_at: string
}

export interface DripEnrollmentRow {
  id: string
  org_id: string
  campaign_id: string
  contact_id: string
  loan_id: string | null
  status: DripEnrollmentStatus
  enrolled_at: string
  enrolled_by: DripEnrolledBy
  removed_at: string | null
  removed_reason: string | null
  current_step: number
  next_send_at: string | null
  created_at: string
  updated_at: string
}

export interface DripSendRow {
  id: string
  org_id: string
  enrollment_id: string
  step_id: string
  contact_id: string
  channel: DripChannel
  status: DripSendStatus
  email_draft_id: string | null
  generated_subject: string | null
  generated_body: string | null
  sent_at: string | null
  created_at: string
}

export interface DripCampaignWithStats extends DripCampaignRow {
  step_count: number
  enrollment_count: number
  completed_count: number
  removed_count: number
  last_send_at: string | null
}

export interface DripEnrollmentWithContact extends DripEnrollmentRow {
  contact_name: string
  contact_email: string
  property_address: string | null
  next_step_name: string | null
}

export interface DripSendWithDetails extends DripSendRow {
  contact_name: string
  contact_email: string
  step_name: string
  campaign_name: string
}
