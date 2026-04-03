// All shared types for the marketing tab

export type MCCContact = {
  id:          string
  first:       string
  last:        string
  company:     string
  phone:       string
  email:       string
  lastTouch:   string | null   // YYYY-MM-DD date string, or null
  note:        string
  callHistory: { date: string; note: string }[]
  // NOTE: calledToday is NOT stored — computed at render by comparing lastTouch to today's date string
}

export type LogEntry = {
  id:       string   // crypto.randomUUID()
  date:     string   // ISO timestamp — new Date().toISOString()
  activity: string   // human-readable label
  channel:  string   // 'Email' | 'Phone Call' | 'LinkedIn' | 'Facebook' | 'Rate Update' | 'Task' | 'Other'
  notes:    string   // empty string if none
}

export type MCCState = {
  tasks:       Record<string, Record<string, boolean>>
  log:         LogEntry[]
  last:        Record<string, string>   // tracker key → ISO timestamp
  contacts:    {
    realtors:     MCCContact[]
    preapprovals: MCCContact[]
    inprocess:    MCCContact[]
    hotleads:     MCCContact[]
  }
  socialPosts: unknown[]
  newsletters: unknown[]
  todos:       unknown[]
  doneTodos:   unknown[]
}

export const BLANK_STATE: MCCState = {
  tasks:       {},
  log:         [],
  last:        {},
  contacts:    { realtors: [], preapprovals: [], inprocess: [], hotleads: [] },
  socialPosts: [],
  newsletters: [],
  todos:       [],
  doneTodos:   [],
}

// APR offset per product (in percentage points)
// FHA MIP and VA funding fee increase effective APR significantly
export const APR_OFFSETS: Record<string, number> = {
  '30-Yr Fixed':  0.07,
  '15-Yr Fixed':  0.10,
  '30-Yr Jumbo':  0.06,
  'VA 30-Yr':     0.18,
  'FHA 30-Yr':    0.58,
  'FHA 5-Yr ARM': 0.12,
}

// Rate table row — one per product in the Rate Update form
export type RateRow = {
  product: string
  rate:    string   // e.g. "6.875" — raw number, not formatted
  apr:     string   // e.g. "6.95" — auto-filled or manually overridden
}

export const DEFAULT_RATE_ROWS: RateRow[] = [
  { product: '30-Yr Fixed',  rate: '', apr: '' },
  { product: '15-Yr Fixed',  rate: '', apr: '' },
  { product: '30-Yr Jumbo',  rate: '', apr: '' },
  { product: 'VA 30-Yr',     rate: '', apr: '' },
  { product: 'FHA 30-Yr',    rate: '', apr: '' },
  { product: 'FHA 5-Yr ARM', rate: '', apr: '' },
]

// Channel values for LogEntry and manual log entry form
export const LOG_CHANNELS = [
  'Email',
  'Newsletter',
  'Phone Call',
  'LinkedIn',
  'Facebook',
  'Instagram',
  'Google',
  'Rate Update',
  'Task',
  'Other',
] as const

export type LogChannel = typeof LOG_CHANNELS[number]
