// Marketing cadence tracker definitions
// Imported by SendTab (cadence badges) and HistoryTab (health strip)

export type Tracker = {
  key:   string
  label: string
  freq:  number  // days
}

export const TRACKERS: readonly Tracker[] = [
  { key: 'rate-update',   label: 'Rate Update',          freq: 7 },
  { key: 'realtor-nl',    label: 'Newsletter (Realtor)',  freq: 7 },
  { key: 'borrower-nl',   label: 'Newsletter (Borrower)', freq: 7 },
  { key: 'realtor-calls', label: 'Realtor Calls',         freq: 7 },
  { key: 'preapproval',   label: 'Pre-Approval Calls',    freq: 7 },
  { key: 'social-post',   label: 'Social Posts',          freq: 2 },
] as const
