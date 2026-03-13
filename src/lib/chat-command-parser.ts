/**
 * Chat Command Parser
 * Classifies natural language input into command types and extracts structured data.
 * Used by OutreachChat to route user intent before hitting any API.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export enum CommandType {
  QUICK_ADD = 'QUICK_ADD',
  BULK_EMAIL = 'BULK_EMAIL',
  BULK_TEXT = 'BULK_TEXT',
  BULK_ADMIN = 'BULK_ADMIN',
  GENERAL_CHAT = 'GENERAL_CHAT',
}

export type ParsedCommand =
  | { type: CommandType.QUICK_ADD; raw: string }
  | { type: CommandType.BULK_EMAIL; prompt: string }
  | { type: CommandType.BULK_TEXT; prompt: string }
  | { type: CommandType.BULK_ADMIN; action: string; value: string }
  | { type: CommandType.GENERAL_CHAT; raw: string }

export type ExtractedContact = {
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  stage: string | null
  contact_type: string | null
  referred_by: string | null
  notes: string | null
  source: string | null
  company_name: string | null
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STAGES = [
  'lead', 'pre-app', 'application', 'pre-approved',
  'in process', 'closing', 'closed', 'other',
  // Common shorthand
  'new app', 'new application', 'active', 'pre-approval',
]

const STAGE_NORMALIZE: Record<string, string> = {
  'lead': 'Lead',
  'pre-app': 'Pre-App',
  'pre-approval': 'Pre-Approved',
  'pre-approved': 'Pre-Approved',
  'application': 'Application',
  'new app': 'Application',
  'new application': 'Application',
  'active': 'Pre-Approved',
  'in process': 'In Process',
  'closing': 'Closing',
  'closed': 'Closed',
  'other': 'Other',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const CONTACT_TYPES = ['borrower', 'realtor', 'referral partner', 'vendor', 'other']

// ── Quick Add Detection ────────────────────────────────────────────────────────

const QUICK_ADD_PATTERNS = [
  /\b(?:add|create|new)\s+(?:a\s+)?(?:contact|client|borrower|realtor|lead)/i,
  /\bhad\s+(?:a\s+)?(?:new\s+)?(?:client|borrower|lead|referral)/i,
  /\bjust\s+(?:got|met|spoke\s+(?:with|to))\s+(?:a\s+)?(?:new\s+)?/i,
  /\bnew\s+(?:lead|client|borrower|referral)\b/i,
  /\badd\s+\w+\s+(?:to\s+)?(?:the\s+)?(?:crm|database|contacts|salesforce)/i,
]

// ── Bulk Email Detection ───────────────────────────────────────────────────────

const BULK_EMAIL_PATTERNS = [
  /\b(?:email|send\s+(?:an?\s+)?email|draft\s+(?:an?\s+)?email|blast\s+(?:an?\s+)?email)\b.*\b(?:selected|checked|these|them|all)\b/i,
  /\b(?:selected|checked|these|them)\b.*\b(?:email|send\s+(?:an?\s+)?email)\b/i,
  /\bsend\s+(?:an?\s+)?email\s+to\s+(?:the\s+)?(?:selected|checked)/i,
  /\bbulk\s+email\b/i,
  /\bemail\s+(?:these|them|the\s+selected)\b/i,
]

// ── Bulk Text Detection ────────────────────────────────────────────────────────

const BULK_TEXT_PATTERNS = [
  /\b(?:text|sms|imessage|message)\b.*\b(?:selected|checked|these|them|all)\b/i,
  /\b(?:selected|checked|these|them)\b.*\b(?:text|sms|imessage|message)\b/i,
  /\bsend\s+(?:a\s+)?(?:text|sms|message)\s+to\s+(?:the\s+)?(?:selected|checked)/i,
  /\bbulk\s+(?:text|sms)\b/i,
  /\b(?:text|message)\s+(?:these|them|the\s+selected)\b/i,
]

// ── Bulk Admin Detection ───────────────────────────────────────────────────────

const BULK_ADMIN_PATTERNS = [
  /\b(?:move|change|update|set)\s+(?:the\s+)?(?:selected|checked|these|them)\s+(?:to|stage|type)/i,
  /\b(?:selected|checked|these|them)\b.*\b(?:move|change|update|set)\s+(?:to|stage|type)/i,
  /\bbulk\s+(?:update|move|change|edit|delete|assign)/i,
  /\b(?:mark|tag)\s+(?:selected|checked|these|them)\b/i,
  /\b(?:delete|remove)\s+(?:the\s+)?(?:selected|checked|these|them)\b/i,
]

// ── Classifier ─────────────────────────────────────────────────────────────────

export function parseCommand(input: string, hasSelectedContacts: boolean = false): ParsedCommand {
  const trimmed = input.trim()

  // Bulk actions require selected contacts
  if (hasSelectedContacts) {
    // Check bulk email
    for (const p of BULK_EMAIL_PATTERNS) {
      if (p.test(trimmed)) {
        return { type: CommandType.BULK_EMAIL, prompt: extractPrompt(trimmed, 'email') }
      }
    }

    // Check bulk text
    for (const p of BULK_TEXT_PATTERNS) {
      if (p.test(trimmed)) {
        return { type: CommandType.BULK_TEXT, prompt: extractPrompt(trimmed, 'text') }
      }
    }

    // Check bulk admin
    for (const p of BULK_ADMIN_PATTERNS) {
      if (p.test(trimmed)) {
        const { action, value } = extractAdminAction(trimmed)
        return { type: CommandType.BULK_ADMIN, action, value }
      }
    }
  }

  // Check quick add
  for (const p of QUICK_ADD_PATTERNS) {
    if (p.test(trimmed)) {
      return { type: CommandType.QUICK_ADD, raw: trimmed }
    }
  }

  // Fallback — if it looks like contact info even without a trigger phrase
  if (looksLikeContactInfo(trimmed)) {
    return { type: CommandType.QUICK_ADD, raw: trimmed }
  }

  return { type: CommandType.GENERAL_CHAT, raw: trimmed }
}

// ── Contact Info Extractor ─────────────────────────────────────────────────────

export function extractContactInfo(input: string): ExtractedContact {
  const result: ExtractedContact = {
    first_name: null,
    last_name: null,
    email: null,
    phone: null,
    stage: null,
    contact_type: null,
    referred_by: null,
    notes: null,
    source: null,
    company_name: null,
  }

  // Email
  const emailMatch = input.match(/\b[\w.+-]+@[\w.-]+\.\w{2,}\b/)
  if (emailMatch) result.email = emailMatch[0].toLowerCase()

  // Phone — multiple formats
  const phoneMatch = input.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/)
  if (phoneMatch) result.phone = normalizePhone(phoneMatch[0])

  // Stage — look for explicit stage mentions
  const stageMatch = input.match(/\bstage[:\s]+([a-z\s-]+?)(?:\.|,|$)/i)
  if (stageMatch) {
    const raw = stageMatch[1].trim().toLowerCase()
    result.stage = STAGE_NORMALIZE[raw] || matchClosestStage(raw)
  } else {
    // Check for inline stage keywords
    for (const s of STAGES) {
      const re = new RegExp(`\\b${s}\\b`, 'i')
      if (re.test(input) && STAGE_NORMALIZE[s]) {
        result.stage = STAGE_NORMALIZE[s]
        break
      }
    }
  }

  // Contact type
  const typeMatch = input.match(/\b(?:type[:\s]+)?(borrower|realtor|referral\s*partner|vendor)\b/i)
  if (typeMatch) {
    result.contact_type = typeMatch[1].toLowerCase()
  } else if (/\b(?:client|borrower|buyer)\b/i.test(input)) {
    result.contact_type = 'borrower'
  } else if (/\b(?:agent|realtor)\b/i.test(input)) {
    result.contact_type = 'realtor'
  }

  // Referred by — look for "referred by X" or "referral from X"
  const refMatch = input.match(/\b(?:referred\s+by|referral\s+from|ref(?:erred)?[:\s]+)\s*(.+?)(?:\.|,|$)/i)
  if (refMatch) result.referred_by = refMatch[1].trim()

  // Company
  const companyMatch = input.match(/\b(?:company|brokerage|firm)[:\s]+(.+?)(?:\.|,|$)/i)
  if (companyMatch) result.company_name = companyMatch[1].trim()

  // Source — lead source
  const sourceMatch = input.match(/\b(?:source|lead\s+source)[:\s]+(.+?)(?:\.|,|$)/i)
  if (sourceMatch) result.source = sourceMatch[1].trim()

  // Name extraction — hardest part, do this last after stripping known tokens
  const name = extractName(input, result)
  result.first_name = name.first
  result.last_name = name.last

  return result
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function extractPrompt(input: string, type: 'email' | 'text'): string {
  // Strip the action prefix to get the content instruction
  let prompt = input
    .replace(/\b(?:email|send\s+(?:an?\s+)?email|draft\s+(?:an?\s+)?email)\s+(?:to\s+)?(?:the\s+)?(?:selected|checked|these|them)\s*/i, '')
    .replace(/\b(?:text|sms|message|imessage)\s+(?:to\s+)?(?:the\s+)?(?:selected|checked|these|them)\s*/i, '')
    .replace(/\bbulk\s+(?:email|text|sms)\s*/i, '')
    .replace(/\b(?:selected|checked|these|them)\b\s*/gi, '')
    .trim()

  // If nothing left, provide a generic instruction
  if (!prompt || prompt.length < 5) {
    prompt = type === 'email'
      ? 'Draft a professional follow-up email'
      : 'Draft a friendly text message check-in'
  }

  return prompt
}

function extractAdminAction(input: string): { action: string; value: string } {
  // "move selected to Closed"
  const moveMatch = input.match(/\b(?:move|change|update|set)\s+(?:the\s+)?(?:selected|checked|these|them|stage)\s+(?:to\s+)?(.+?)$/i)
  if (moveMatch) {
    const val = moveMatch[1].trim()
    const normalized = STAGE_NORMALIZE[val.toLowerCase()]
    if (normalized) return { action: 'update_stage', value: normalized }
    return { action: 'update_stage', value: val }
  }

  // "delete selected"
  if (/\b(?:delete|remove)\b/i.test(input)) {
    return { action: 'delete', value: '' }
  }

  // "mark as realtor"
  const markMatch = input.match(/\b(?:mark|tag|set)\s+(?:as\s+)?(.+?)$/i)
  if (markMatch) {
    return { action: 'update_type', value: markMatch[1].trim() }
  }

  return { action: 'unknown', value: input }
}

function looksLikeContactInfo(input: string): boolean {
  // Has a phone number or email + at least one name-like word
  const hasPhone = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(input)
  const hasEmail = /[\w.+-]+@[\w.-]+\.\w{2,}/.test(input)
  const hasName = /^[A-Z][a-z]+\s+[A-Z][a-z]+/.test(input.trim())
  return (hasPhone || hasEmail) && (hasName || input.split(/\s+/).length >= 3)
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) {
    const d = digits.slice(1)
    return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return raw // Return as-is if non-standard
}

function matchClosestStage(raw: string): string | null {
  for (const [key, val] of Object.entries(STAGE_NORMALIZE)) {
    if (key.includes(raw) || raw.includes(key)) return val
  }
  return null
}

function extractName(
  input: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _known: Partial<ExtractedContact>
): { first: string | null; last: string | null } {
  // Strip out tokens we already extracted
  const cleaned = input
    // Strip email
    .replace(/\b[\w.+-]+@[\w.-]+\.\w{2,}\b/g, '')
    // Strip phone
    .replace(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, '')
    // Strip known keywords
    .replace(/\b(?:add|create|new|contact|client|borrower|realtor|lead|had|just|got|met|spoke|with|to|a|the|my|crm|database|salesforce|contacts|as)\b/gi, '')
    // Strip stage keywords
    .replace(/\bstage[:\s]+\S+/gi, '')
    // Strip referred by
    .replace(/\b(?:referred\s+by|referral\s+from|ref)\s+.+?(?:\.|,|$)/gi, '')
    // Strip source/company/type labels
    .replace(/\b(?:source|lead\s+source|company|brokerage|firm|type)[:\s]+.+?(?:\.|,|$)/gi, '')
    .replace(/\b(?:email|phone|stage|type|source|notes?)[:\s]+/gi, '')
    // Strip punctuation
    .replace(/[.,;:!?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Look for capitalized name-like words
  const nameWords = cleaned.split(/\s+/).filter(w => /^[A-Z][a-z]+$/.test(w))

  if (nameWords.length >= 2) {
    return { first: nameWords[0], last: nameWords.slice(1).join(' ') }
  }
  if (nameWords.length === 1) {
    return { first: nameWords[0], last: null }
  }

  // Last resort: first two words if they look like names
  const words = cleaned.split(/\s+/).filter(w => w.length > 1)
  if (words.length >= 2 && /^[A-Za-z]+$/.test(words[0]) && /^[A-Za-z]+$/.test(words[1])) {
    return { first: capitalize(words[0]), last: capitalize(words[1]) }
  }
  if (words.length >= 1 && /^[A-Za-z]+$/.test(words[0])) {
    return { first: capitalize(words[0]), last: null }
  }

  return { first: null, last: null }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}
