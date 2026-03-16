/**
 * Single source of truth for all loan stage definitions in LoanOS.
 *
 * DB status values come from two sources:
 *   1. Arive webhooks (raw: DISCLOSURE_SENT, UNDERWRITING_SUBMITTED, etc.)
 *   2. Manual LoanOS updates (canonical: Disclosed, Submitted to UW, etc.)
 *
 * Every component that touches stage/status logic imports from here.
 */

// ── Canonical stage keys ─────────────────────────────────────────────────────
// These are the internal identifiers used for grouping.

export type StageKey =
  | 'lead'
  | 'new_application'
  | 'pre_approval'
  | 'setup'
  | 'disclosed'
  | 'submitted'
  | 'approved'
  | 'resubmit'
  | 'underwriting'
  | 'processing'
  | 'clear_to_close'
  | 'funded'

// ── Human-readable labels ────────────────────────────────────────────────────

export const STAGE_LABELS: Record<StageKey, string> = {
  lead: 'Lead',
  new_application: 'New Application',
  pre_approval: 'Pre-Approval',
  setup: 'Loan Setup',
  disclosed: 'Disclosed',
  submitted: 'Submitted to UW',
  approved: 'Approved w/ Conditions',
  resubmit: 'Resubmitted',
  underwriting: 'Underwriting',
  processing: 'Processing',
  clear_to_close: 'Clear to Close',
  funded: 'Funded / Closed',
}

// ── Stage groupings ──────────────────────────────────────────────────────────

export const STAGE_GROUPS = {
  LEADS: ['lead'] as StageKey[],
  NEW_APPLICATION: ['new_application'] as StageKey[],
  PRE_APPROVAL: ['pre_approval'] as StageKey[],
  IN_PROCESS: [
    'setup', 'disclosed', 'submitted', 'approved',
    'resubmit', 'clear_to_close', 'underwriting', 'processing',
  ] as StageKey[],
  FUNDED: ['funded'] as StageKey[],
  CLOSED: ['funded'] as StageKey[], // funded = closed, same thing
} as const

// ── Map raw DB status values → canonical StageKey ────────────────────────────
// Includes both Arive raw statuses AND LoanOS canonical display names.
// Case-insensitive lookup via normalizeToStageKey().

const RAW_STATUS_MAP: Record<string, StageKey> = {
  // Lead
  'lead': 'lead',
  'Lead': 'lead',
  'Lead - New': 'lead',
  'Lead - Contacted': 'lead',
  'Lead - Cold / Inactive': 'lead',
  'Long Term': 'lead',

  // New application
  'new_application': 'new_application',
  'New Application': 'new_application',

  // Pre-approval
  'pre_approval': 'pre_approval',
  'pre_approved': 'pre_approval',
  'Pre-Approved': 'pre_approval',
  'Pre-App': 'pre_approval',
  'pre-approval': 'pre_approval',
  'Started': 'pre_approval',
  'Started App': 'pre_approval',
  'Application': 'pre_approval',
  'application_intake': 'pre_approval',
  'APPLICATION_INTAKE': 'pre_approval',
  'QUALIFICATION': 'pre_approval',

  // Loan Setup
  'setup': 'setup',
  'Loan Setup': 'setup',
  'LOAN_SETUP': 'setup',

  // Processing
  'processing': 'processing',
  'Processing': 'processing',
  'In Process': 'processing',
  'Loan in Process': 'processing',

  // Disclosed
  'disclosed': 'disclosed',
  'Disclosed': 'disclosed',
  'DISCLOSURE_SENT': 'disclosed',

  // Submitted to UW
  'submitted': 'submitted',
  'Submitted': 'submitted',
  'Submitted to UW': 'submitted',
  'Submitted to Underwriting': 'submitted',
  'SUBMITTED': 'submitted',
  'UNDERWRITING_SUBMITTED': 'submitted',

  // Underwriting (in review, not yet approved)
  'underwriting': 'underwriting',
  'Underwriting': 'underwriting',

  // Approved with Conditions
  'approved': 'approved',
  'Approved': 'approved',
  'Approved with Conditions': 'approved',
  'Approved w/ Conditions': 'approved',
  'APPROVED_WITH_CONDITIONS': 'approved',
  'CONDITIONAL_APPROVAL': 'approved',
  'Conditional Approval': 'approved',
  'conditional-approval': 'approved',

  // Resubmitted
  'resubmit': 'resubmit',
  'Resubmit': 'resubmit',
  'Resubmitted': 'resubmit',
  'RESUBMIT': 'resubmit',
  'RESUBMITTED': 'resubmit',
  'RE_SUBMITTAL': 'resubmit',

  // Clear to Close
  'clear_to_close': 'clear_to_close',
  'Clear to Close': 'clear_to_close',
  'Clear To Close': 'clear_to_close',
  'CLEAR_TO_CLOSE': 'clear_to_close',
  'CTC': 'clear_to_close',
  'Closing': 'clear_to_close',

  // Funded / Closed
  'funded': 'funded',
  'Funded': 'funded',
  'Closed': 'funded',
  'closed': 'funded',
  'Closed/Funded': 'funded',
  'LOAN_FUNDED': 'funded',
  'Closed Client': 'funded',
}

/**
 * Normalize any raw DB status string to a canonical StageKey.
 * Returns 'lead' for unknown/null values.
 */
export function normalizeToStageKey(raw: string | null | undefined): StageKey {
  if (!raw) return 'lead'
  return RAW_STATUS_MAP[raw] ?? RAW_STATUS_MAP[raw.toLowerCase()] ?? 'lead'
}

/**
 * Get display label for any raw DB status string.
 */
export function getStageLabel(raw: string | null | undefined): string {
  return STAGE_LABELS[normalizeToStageKey(raw)]
}

/**
 * Check if a raw status belongs to a stage group.
 */
export function isInStageGroup(raw: string | null | undefined, group: readonly StageKey[]): boolean {
  return group.includes(normalizeToStageKey(raw))
}

// ── Collect all raw status strings that map to a stage group ─────────────────
// Used for Supabase .in() queries against the raw status column.

export function rawStatusesForGroup(group: readonly StageKey[]): string[] {
  const set = new Set(group)
  return Object.entries(RAW_STATUS_MAP)
    .filter(([, key]) => set.has(key))
    .map(([raw]) => raw)
}

// Pre-computed arrays for common queries
export const IN_PROCESS_STATUSES = rawStatusesForGroup(STAGE_GROUPS.IN_PROCESS)
export const FUNDED_STATUSES = rawStatusesForGroup(STAGE_GROUPS.FUNDED)
export const PRE_APPROVAL_STATUSES = rawStatusesForGroup(STAGE_GROUPS.PRE_APPROVAL)
export const LEAD_STATUSES = rawStatusesForGroup(STAGE_GROUPS.LEADS)
export const NEW_APP_STATUSES = rawStatusesForGroup(STAGE_GROUPS.NEW_APPLICATION)

// All statuses considered "inactive" (not in pipeline)
export const INACTIVE_STATUSES = [
  ...FUNDED_STATUSES,
  'Cancelled', 'canceled', 'Dead', 'Denied', 'Withdrawn', 'Suspended', 'On Hold', 'on_hold',
]

// Status options for inline edit / bulk update dropdowns (canonical display names)
export const LOAN_STATUS_OPTIONS = [
  'Loan Setup', 'Disclosed', 'Submitted to UW', 'Approved w/ Conditions',
  'Resubmitted', 'Clear to Close', 'Underwriting', 'Processing',
  'Pre-Approved', 'Lead', 'New Application',
  'Funded', 'On Hold', 'Cancelled', 'Denied', 'Dead',
] as const

// ── Pipeline sub-stage definitions (for in-process dashboard bar) ────────────

export const PIPELINE_STAGES: { key: StageKey; label: string; short: string; hex: string }[] = [
  { key: 'setup',          label: 'Loan Setup',         short: 'Setup',     hex: '#52525b' },
  { key: 'disclosed',      label: 'Disclosed',          short: 'Disclosed', hex: '#2563eb' },
  { key: 'submitted',      label: 'Submitted to UW',    short: 'Submitted', hex: '#7c3aed' },
  { key: 'approved',       label: 'Approved w/ Cond.',   short: 'Approved',  hex: '#059669' },
  { key: 'resubmit',       label: 'Resubmitted',        short: 'Resubmit',  hex: '#d97706' },
  { key: 'clear_to_close', label: 'Clear to Close',     short: 'CTC',       hex: '#C9A84C' },
]

// ── Dashboard stage mapping (for KPI pipeline cards) ─────────────────────────

export const DASHBOARD_STAGES = ['Pre-Approval', 'Processing', 'Underwriting', 'Clear to Close'] as const

export function toDashboardStage(raw: string | null | undefined): string {
  const key = normalizeToStageKey(raw)
  switch (key) {
    case 'lead':
    case 'new_application':
    case 'pre_approval':
      return 'Pre-Approval'
    case 'setup':
    case 'disclosed':
    case 'processing':
      return 'Processing'
    case 'submitted':
    case 'underwriting':
    case 'approved':
    case 'resubmit':
      return 'Underwriting'
    case 'clear_to_close':
      return 'Clear to Close'
    case 'funded':
      return 'Funded'
    default:
      return 'Other'
  }
}

// ── Contact stage sync mapping ───────────────────────────────────────────────
// Maps a loan's canonical StageKey to the contact's stage value.

export function contactStageFromLoanKey(key: StageKey): string {
  if (STAGE_GROUPS.IN_PROCESS.includes(key)) return 'In Process'
  if (key === 'funded') return 'Closed'
  if (key === 'pre_approval') return 'Pre-Approved'
  if (key === 'new_application') return 'Application'
  return 'Lead'
}

// ── Stage colors (for badges + charts) ───────────────────────────────────────

export const STAGE_COLORS: Record<string, string> = {
  'Pre-Approval': '#3b82f6',
  'Processing': '#f59e0b',
  'Underwriting': '#8b5cf6',
  'Clear to Close': '#10b981',
  'Funded': '#059669',
}
