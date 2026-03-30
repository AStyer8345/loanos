import type { StageKey } from '@/lib/constants/loan-stages'

export type TriggerType = 'pdf' | 'form' | 'generate'

export interface AutomationDef {
  id: string
  label: string
  description: string
  surface: 'contact' | 'loan'
  stageKey?: StageKey
  recipient: 'borrower' | 'agent'
  triggerType: TriggerType
  /** Button label for upload/form trigger (e.g. "Upload PA Letter") */
  triggerLabel?: string
  /** doc_type value for documents table when a PDF is uploaded */
  docType?: string
}

// ── Contact-level automations ────────────────────────────────────────────────

export const CONTACT_AUTOMATIONS: AutomationDef[] = [
  {
    id: 'referral-thank-you',
    label: 'Referral Thank You',
    description: 'Thank the referring agent',
    surface: 'contact',
    recipient: 'agent',
    triggerType: 'generate',
  },
  {
    id: 'referral-intro',
    label: 'Referral Intro',
    description: 'Welcome email to referred borrower',
    surface: 'contact',
    recipient: 'borrower',
    triggerType: 'generate',
  },
  {
    id: 'application-link',
    label: 'Application Link',
    description: 'Send the loan application link',
    surface: 'contact',
    recipient: 'borrower',
    triggerType: 'generate',
  },
  {
    id: 'nurture-followup',
    label: 'Nurture Follow-Up',
    description: 'Casual check-in on a cold lead',
    surface: 'contact',
    recipient: 'borrower',
    triggerType: 'generate',
  },
]

// ── Loan-level automations ───────────────────────────────────────────────────

export const LOAN_AUTOMATIONS: AutomationDef[] = [
  {
    id: 'app-received',
    label: 'Application Received',
    description: 'Upload 1003 — Claude extracts borrower info and drafts a welcome email',
    surface: 'loan',
    stageKey: 'new_application',
    recipient: 'borrower',
    triggerType: 'pdf',
    triggerLabel: 'Upload 1003 PDF',
    docType: 'loan_application',
  },
  {
    id: 'doc-request',
    label: 'Document Request',
    description: 'List of docs we need',
    surface: 'loan',
    stageKey: 'pre_approval',
    recipient: 'borrower',
    triggerType: 'generate',
  },
  {
    id: 'pre-approval-email',
    label: 'Pre-Approval Letter',
    description: 'Upload PA letter — Claude extracts details and drafts a congratulations email',
    surface: 'loan',
    stageKey: 'pre_approval',
    recipient: 'borrower',
    triggerType: 'pdf',
    triggerLabel: 'Upload PA Letter',
    docType: 'pre_approval_letter',
  },
  {
    id: 'pre-approval-agent',
    label: 'Pre-Approval to Agent',
    description: 'Notify agent of PA',
    surface: 'loan',
    stageKey: 'pre_approval',
    recipient: 'agent',
    triggerType: 'generate',
  },
  {
    id: 'processing-update',
    label: 'Processing Update',
    description: 'Your loan is moving through',
    surface: 'loan',
    stageKey: 'processing',
    recipient: 'borrower',
    triggerType: 'generate',
  },
  {
    id: 'conditional-approval',
    label: 'Conditional Approval',
    description: 'Approved with conditions',
    surface: 'loan',
    stageKey: 'approved',
    recipient: 'borrower',
    triggerType: 'generate',
  },
  {
    id: 'cd-email',
    label: 'Closing Disclosure',
    description: 'Upload CD — Claude extracts final numbers and drafts the closing email',
    surface: 'loan',
    stageKey: 'clear_to_close',
    recipient: 'borrower',
    triggerType: 'pdf',
    triggerLabel: 'Upload CD',
    docType: 'closing_disclosure',
  },
  {
    id: 'closing-prep',
    label: 'Closing Prep',
    description: 'What to bring to closing',
    surface: 'loan',
    stageKey: 'clear_to_close',
    recipient: 'borrower',
    triggerType: 'generate',
  },
  {
    id: 'contract-received',
    label: 'Contract Received',
    description: 'Upload executed contract — Claude extracts key fields and drafts a reply-all',
    surface: 'loan',
    stageKey: 'setup',
    recipient: 'borrower',
    triggerType: 'pdf',
    triggerLabel: 'Upload Contract',
    docType: 'purchase_contract',
  },
  {
    id: 'thank-you',
    label: 'Thank You',
    description: 'Post-close thank you',
    surface: 'loan',
    stageKey: 'funded',
    recipient: 'borrower',
    triggerType: 'generate',
  },
  {
    id: 'review-request',
    label: 'Review Request',
    description: 'Ask for Google/Zillow review',
    surface: 'loan',
    stageKey: 'funded',
    recipient: 'borrower',
    triggerType: 'generate',
  },
]

// ── Stage pipeline order (for "show nearby stages" logic) ────────────────────

const STAGE_ORDER: StageKey[] = [
  'lead', 'new_application', 'pre_approval', 'setup', 'disclosed',
  'submitted', 'approved', 'resubmit', 'underwriting', 'processing',
  'clear_to_close', 'funded',
]

/**
 * Returns loan automations visible for a given stage:
 * automations whose stageKey matches the current stage,
 * or one stage before/after in the pipeline.
 * Automations with no stageKey are always shown.
 */
export function getLoanAutomationsForStage(currentStage: StageKey): AutomationDef[] {
  const idx = STAGE_ORDER.indexOf(currentStage)
  const nearbyStages = new Set<StageKey>()

  if (idx >= 0) {
    if (idx > 0) nearbyStages.add(STAGE_ORDER[idx - 1])
    nearbyStages.add(STAGE_ORDER[idx])
    if (idx < STAGE_ORDER.length - 1) nearbyStages.add(STAGE_ORDER[idx + 1])
  } else {
    // Unknown stage — show all
    return LOAN_AUTOMATIONS
  }

  return LOAN_AUTOMATIONS.filter(a => !a.stageKey || nearbyStages.has(a.stageKey))
}

/** All automation definitions for lookup by id */
export const ALL_AUTOMATIONS: AutomationDef[] = [...CONTACT_AUTOMATIONS, ...LOAN_AUTOMATIONS]

export function getAutomationById(id: string): AutomationDef | undefined {
  return ALL_AUTOMATIONS.find(a => a.id === id)
}
