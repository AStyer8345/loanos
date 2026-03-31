import type { StageKey } from '@/lib/constants/loan-stages'

export interface AutomationDef {
  id: string
  label: string
  description: string
  surface: 'contact' | 'loan'
  stageKey?: StageKey
  recipient: 'borrower' | 'agent'
}

// ── Contact-level automations ────────────────────────────────────────────────

export const CONTACT_AUTOMATIONS: AutomationDef[] = [
  {
    id: 'referral-thank-you',
    label: 'Referral Thank You',
    description: 'Thank the referring agent',
    surface: 'contact',
    recipient: 'agent',
  },
  {
    id: 'referral-intro',
    label: 'Referral Intro',
    description: 'Welcome email to referred borrower',
    surface: 'contact',
    recipient: 'borrower',
  },
  {
    id: 'application-link',
    label: 'Application Link',
    description: 'Send the loan application link',
    surface: 'contact',
    recipient: 'borrower',
  },
  {
    id: 'nurture-followup',
    label: 'Nurture Follow-Up',
    description: 'Casual check-in on a cold lead',
    surface: 'contact',
    recipient: 'borrower',
  },
]

// ── Loan-level automations ───────────────────────────────────────────────────

export const LOAN_AUTOMATIONS: AutomationDef[] = [
  {
    id: 'app-received',
    label: 'Application Received',
    description: 'Confirm we got their app',
    surface: 'loan',
    stageKey: 'new_application',
    recipient: 'borrower',
  },
  {
    id: 'doc-request',
    label: 'Document Request',
    description: 'List of docs we need',
    surface: 'loan',
    stageKey: 'pre_approval',
    recipient: 'borrower',
  },
  {
    id: 'pre-approval-email',
    label: 'Pre-Approval Letter',
    description: 'Congrats, you\u2019re pre-approved',
    surface: 'loan',
    stageKey: 'pre_approval',
    recipient: 'borrower',
  },
  {
    id: 'pre-approval-agent',
    label: 'Pre-Approval to Agent',
    description: 'Notify agent of PA',
    surface: 'loan',
    stageKey: 'pre_approval',
    recipient: 'agent',
  },
  {
    id: 'processing-update',
    label: 'Processing Update',
    description: 'Your loan is moving through',
    surface: 'loan',
    stageKey: 'processing',
    recipient: 'borrower',
  },
  {
    id: 'conditional-approval',
    label: 'Conditional Approval',
    description: 'Approved with conditions',
    surface: 'loan',
    stageKey: 'approved',
    recipient: 'borrower',
  },
  {
    id: 'cd-email',
    label: 'Closing Disclosure',
    description: 'Final CD numbers email',
    surface: 'loan',
    stageKey: 'clear_to_close',
    recipient: 'borrower',
  },
  {
    id: 'closing-prep',
    label: 'Closing Prep',
    description: 'What to bring to closing',
    surface: 'loan',
    stageKey: 'clear_to_close',
    recipient: 'borrower',
  },
  {
    id: 'thank-you',
    label: 'Thank You',
    description: 'Post-close thank you',
    surface: 'loan',
    stageKey: 'funded',
    recipient: 'borrower',
  },
  {
    id: 'review-request',
    label: 'Review Request',
    description: 'Ask for Google/Zillow review',
    surface: 'loan',
    stageKey: 'funded',
    recipient: 'borrower',
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
