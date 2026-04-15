// src/lib/workflows/types.ts

export interface WebLeadPayload {
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  loan_goal: string | null        // e.g. 'purchase', 'refinance', 'dpa'
  purchase_price?: number | null
  credit_score?: string | null
  situation?: string | null       // free-text from form
  source_page: string | null      // page URL path, e.g. '/get-preapproved'
  form_name: string | null        // netlify form-name value
  utm_params: Record<string, string> | null
  referrer: string | null
  org_id: string                  // must be set by /api/contacts/web-lead from env
  contact_id?: string             // set after upsert, passed to child workflows
}

export type LeadClassification = 'pa' | 'dpa' | 'generic'

export interface DripEnrollmentResult {
  enrollment_id: string
  campaign_id: string
  campaign_name: string
  contact_id: string
  enrolled_at: string
}

export interface ResendWebhookEvent {
  type: string   // e.g. 'email.delivered', 'email.bounced'
  data: {
    email_id: string
    to: string[]
    from: string
    subject: string
    tags?: Record<string, string>
    // Resend includes metadata sent at send time here:
    metadata?: {
      enrollment_id?: string
      step_order?: number
      contact_id?: string
    }
  }
}
