/**
 * Lead source categorization.
 *
 * Classifies a contact into one of six buckets based on how they arrived:
 * - AEO: recommended by an AI assistant (ChatGPT, Claude, Perplexity, etc.)
 * - Realtor Referral: manually tagged as a realtor referral
 * - Web Lead: came through a form on styermortgage.com
 * - SEO: non-AI search engine (Google, Bing, DuckDuckGo, etc.)
 * - Social: Instagram, Facebook, LinkedIn, etc.
 * - Direct: no referrer, no utm — typed URL or saved bookmark
 * - Other: everything uncategorized
 *
 * Precedence matters — AEO wins over SEO even when a user lands
 * via a Google AI Overview link that still carries google.com as referrer.
 */

export type LeadSourceCategory =
  | 'AEO'
  | 'Realtor Referral'
  | 'Web Lead'
  | 'SEO'
  | 'Social'
  | 'Direct'
  | 'Other'

/** URL-safe slug for use in routes like /dashboard/contacts/by-source/[slug]. */
export const CATEGORY_SLUGS: Record<LeadSourceCategory, string> = {
  'AEO':              'aeo',
  'Realtor Referral': 'realtor-referral',
  'Web Lead':         'web-lead',
  'SEO':              'seo',
  'Social':           'social',
  'Direct':           'direct',
  'Other':            'other',
}

/** Inverse lookup — slug back to category label. Returns null for unknown slug. */
export function categoryFromSlug(slug: string): LeadSourceCategory | null {
  const entry = Object.entries(CATEGORY_SLUGS).find(([, s]) => s === slug)
  return entry ? (entry[0] as LeadSourceCategory) : null
}

const AEO_HOSTS = [
  'chatgpt.com',
  'chat.openai.com',
  'claude.ai',
  'claude.com',
  'perplexity.ai',
  'www.perplexity.ai',
  'copilot.microsoft.com',
  'gemini.google.com',
  'you.com',
  'phind.com',
  'kagi.com',
]

const SEARCH_HOSTS = [
  'google.com',
  'www.google.com',
  'bing.com',
  'www.bing.com',
  'duckduckgo.com',
  'yahoo.com',
  'search.yahoo.com',
  'ecosia.org',
]

const SOCIAL_HOSTS = [
  'instagram.com',
  'www.instagram.com',
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'l.facebook.com',
  'linkedin.com',
  'www.linkedin.com',
  'twitter.com',
  'x.com',
  'youtube.com',
  'www.youtube.com',
  'tiktok.com',
  't.co',
]

/** Parse a referrer URL and extract its hostname. Returns null for invalid/empty input. */
function hostnameOf(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) return null
  try {
    // Handle bare hostnames ("google.com") as well as full URLs
    const withProtocol = trimmed.includes('://') ? trimmed : `https://${trimmed}`
    return new URL(withProtocol).hostname
  } catch {
    return null
  }
}

export interface ContactSourceFields {
  lead_source: string | null
  referrer: string | null
  source_page: string | null
  utm_params: { source?: string | null; medium?: string | null; campaign?: string | null } | null
}

/**
 * Classify a contact based on its source-tracking fields.
 * Returns the single best-fit category.
 *
 * Precedence:
 * 1. Manual lead_source tag (Adam typed it, so it's authoritative)
 * 2. AEO via referrer host or utm_source (AI tool signals)
 * 3. Realtor tag in lead_source
 * 4. Web Lead via source_page / utm_source=website
 * 5. Social / SEO via referrer host
 * 6. Fuzzy lead_source matching
 * 7. Direct if no signal at all
 */
export function classifyLeadSource(c: ContactSourceFields): LeadSourceCategory {
  const host = hostnameOf(c.referrer)
  const utmSource = (c.utm_params?.source ?? '').toLowerCase().trim()
  const ls = (c.lead_source ?? '').toLowerCase().trim()

  // 1. Manual tag wins — Adam (or the team) explicitly labeled this contact.
  //    Matches exact values AND common prefixes like "AEO: ChatGPT" / "SEO: Google".
  if (ls) {
    if (ls === 'aeo' || ls.startsWith('aeo:') || ls.startsWith('aeo ')) return 'AEO'
    if (ls === 'seo' || ls.startsWith('seo:') || ls.startsWith('seo ')) return 'SEO'
    if (ls === 'social' || ls.startsWith('social:') || ls.startsWith('social ')) return 'Social'
    if (ls === 'direct' || ls === 'bookmark' || ls === 'typed url') return 'Direct'
    if (ls === 'web lead' || ls === 'website' || ls === 'web') return 'Web Lead'
    // Realtor tag — also checked below as a fallback on non-exact matches
    if (ls === 'realtor referral' || ls === 'realtor' || ls === 'agent referral') return 'Realtor Referral'
  }

  // 2. AEO check — AI tools sometimes preserve the origin domain (a Google AI
  //    Overview link carries google.com as referrer) but utm_source tells the
  //    truth. Check both dimensions.
  if (host && AEO_HOSTS.includes(host)) return 'AEO'
  if (utmSource && AEO_HOSTS.some(h => utmSource.includes(h.replace('www.', '')))) return 'AEO'
  if (utmSource === 'chatgpt' || utmSource === 'claude' || utmSource === 'perplexity' || utmSource === 'ai') {
    return 'AEO'
  }

  // 3. Realtor tag via fuzzy lead_source match (e.g. "Realtor - Smith Team")
  if (ls && (ls.includes('realtor') || ls.includes('agent'))) return 'Realtor Referral'

  // 4. Website form submissions — has a source_page or utm_source=website/site
  if (c.source_page || utmSource === 'website' || utmSource === 'site' || utmSource === 'styermortgage.com') {
    return 'Web Lead'
  }

  // 5. Auto-detect from referrer host
  if (host && SOCIAL_HOSTS.includes(host)) return 'Social'
  if (host && SEARCH_HOSTS.includes(host)) return 'SEO'

  // 6. Fuzzy lead_source fallback (e.g. "Past Client", "Friend", "Instagram DM")
  if (ls) {
    if (ls.includes('web') || ls.includes('website')) return 'Web Lead'
    if (ls.includes('social') || ls.includes('instagram') || ls.includes('facebook') || ls.includes('linkedin')) {
      return 'Social'
    }
    if (ls.includes('google') || ls.includes('bing') || ls.includes('search')) return 'SEO'
    if (ls.includes('chatgpt') || ls.includes('claude') || ls.includes('perplexity') || ls.includes('copilot') || ls.includes('gemini')) {
      return 'AEO'
    }
    return 'Other'
  }

  // 7. No signal at all = typed URL or bookmark
  if (!host && !c.source_page && !utmSource) return 'Direct'

  return 'Other'
}

/** Aggregate a set of contacts into {category, count} tuples sorted by count desc. */
export function aggregateBySource(
  contacts: ContactSourceFields[]
): Array<{ source: LeadSourceCategory; count: number }> {
  const counts = new Map<LeadSourceCategory, number>()
  for (const c of contacts) {
    const cat = classifyLeadSource(c)
    counts.set(cat, (counts.get(cat) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
}
