const CANONICAL_STAGES = [
  'Lead', 'Pre-App', 'Application', 'Pre-Approved',
  'In Process', 'Closing', 'Closed', 'Other'
];

const STAGE_MAP: Record<string, string> = {
  'Closed Client': 'Closed',
  'LOAN_FUNDED': 'Closed',
  'Commission Paid': 'Closed',
  'commission paid': 'Closed',
  'COMMISSION_PAID': 'Closed',
  'Lead - Cold / Inactive': 'Lead',
  'Lead - Contacted': 'Lead',
  'Lead - New': 'Lead',
  'Long Term': 'Lead',
  'UNDERWRITING_SUBMITTED': 'In Process',
  'DISCLOSURE_SENT': 'In Process',
  'APPROVED_WITH_CONDITION': 'Pre-Approved',
  'Not Qualified': 'Other',
  'unsubscribed': 'Other',
};

export function normalizeStage(raw: string | null | undefined): string {
  if (!raw) return 'Lead';
  if (CANONICAL_STAGES.includes(raw)) return raw;
  return STAGE_MAP[raw] ?? STAGE_MAP[raw.toLowerCase()] ?? 'Other';
}
