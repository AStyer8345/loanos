/**
 * "Needs Your Attention" widget — data fetcher + scoring logic.
 *
 * Reads from activity_log (public columns, populated by the n8n Inbound Email
 * classifier). Does NOT decrypt PII — subject comes from the optional
 * contact-name join + activity_log.summary, not from the encrypted companion.
 *
 * Org-scoped via the caller passing organization_id. No ambient auth here.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export interface NeedsAttentionItem {
  id: string
  created_at: string
  contact_id: string | null
  loan_id: string | null
  contact_name: string | null
  ai_intent: string | null
  ai_urgency: string | null
  ai_sentiment: string | null
  ai_suggested_action: string | null
  ai_confidence: number | null
  ai_reasoning: string | null
  score: number
  daysAgo: number
}

// ─────────────────────────────────────────────────────────────────────────────
// TODO — Adam: tune this scoring function.
//
// This is the heart of the widget. It decides which classified emails deserve
// to appear in your "Needs Your Attention" list and in what order.
//
// Inputs you have to work with (all from activity_log):
//   row.ai_intent            — question | thanks | document | status_request |
//                              urgent | complaint | scheduling | ping | other
//   row.ai_urgency           — high | medium | low
//   row.ai_sentiment         — positive | neutral | negative | frustrated
//   row.ai_suggested_action  — respond_today | respond_this_week |
//                              route_to_janie | log_only | escalate
//   row.ai_confidence        — 0.0 – 1.0
//   daysAgo                  — integer, 0 for today
//
// Return number (higher = more urgent). Return 0 or negative to EXCLUDE the row
// from the widget entirely (filter-out semantic).
//
// Questions worth considering:
//   - Should `thanks` ever show up? Probably not — exclude?
//   - Should `route_to_janie` appear in YOUR list or hers? Exclude from yours?
//   - How much should low confidence matter? Boost? Penalty?
//   - Does a 3-day-old "escalate" beat a today's "respond_today"? (staleness multiplier)
//   - `frustrated` sentiment — always bubble up regardless of intent?
//
// Start simple. Ship it. Tune after a week of watching real data.
// ─────────────────────────────────────────────────────────────────────────────
export function needsAttentionScore(row: {
  ai_intent: string | null
  ai_urgency: string | null
  ai_sentiment: string | null
  ai_suggested_action: string | null
  ai_confidence: number | null
  daysAgo: number
}): number {
  // TODO — Adam: replace this placeholder with your real scoring logic.
  // This default exists so the widget doesn't render empty on day one,
  // but it's intentionally naive. Tune it.

  const action = row.ai_suggested_action
  if (action === 'log_only' || action === 'route_to_janie') return 0
  if (row.ai_intent === 'thanks') return 0

  let score = 0
  if (action === 'escalate') score += 100
  if (action === 'respond_today') score += 70
  if (row.ai_urgency === 'high') score += 40
  if (row.ai_sentiment === 'frustrated') score += 30
  score *= (row.ai_confidence ?? 0.5)
  // Decay by age: subtract 5 per day old
  score -= row.daysAgo * 5

  return Math.max(0, score)
}

// ─────────────────────────────────────────────────────────────────────────────
// Server-side fetcher. Called from the dashboard server component.
// ─────────────────────────────────────────────────────────────────────────────

/** Shape of the selected columns from activity_log (with optional contacts join).
 *  Kept inline rather than deriving from Database types so this module doesn't
 *  need to import/regenerate when activity_log schema shifts elsewhere. */
interface ActivityLogRow {
  id: string
  created_at: string
  contact_id: string | null
  loan_id: string | null
  ai_intent: string | null
  ai_urgency: string | null
  ai_sentiment: string | null
  ai_suggested_action: string | null
  ai_confidence: number | null
  ai_reasoning: string | null
  contacts:
    | { first_name: string | null; last_name: string | null }
    | Array<{ first_name: string | null; last_name: string | null }>
    | null
}

const LOOKBACK_DAYS = 7
const MAX_ITEMS = 5

export async function getNeedsAttention(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: SupabaseClient<any, 'public', any>,
  organizationId: string
): Promise<NeedsAttentionItem[]> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await client
    .from('activity_log')
    .select(`
      id,
      created_at,
      contact_id,
      loan_id,
      ai_intent,
      ai_urgency,
      ai_sentiment,
      ai_suggested_action,
      ai_confidence,
      ai_reasoning,
      dismissed,
      contacts:contact_id ( first_name, last_name )
    `)
    .eq('organization_id', organizationId)
    .eq('type', 'email_inbound')
    .not('ai_intent', 'is', null)
    .or('dismissed.is.null,dismissed.eq.false')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200)

  if (error || !data) {
    if (error) console.error('[needsAttention] fetch error:', error.message)
    return []
  }

  const now = Date.now()
  const scored: NeedsAttentionItem[] = data
    .map((r: ActivityLogRow) => {
      const daysAgo = Math.floor((now - new Date(r.created_at).getTime()) / 86_400_000)
      const contact = Array.isArray(r.contacts) ? r.contacts[0] : r.contacts
      const contactName = contact
        ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
        : null
      const score = needsAttentionScore({
        ai_intent: r.ai_intent,
        ai_urgency: r.ai_urgency,
        ai_sentiment: r.ai_sentiment,
        ai_suggested_action: r.ai_suggested_action,
        ai_confidence: r.ai_confidence,
        daysAgo,
      })
      return {
        id: r.id,
        created_at: r.created_at,
        contact_id: r.contact_id,
        loan_id: r.loan_id,
        contact_name: contactName || null,
        ai_intent: r.ai_intent,
        ai_urgency: r.ai_urgency,
        ai_sentiment: r.ai_sentiment,
        ai_suggested_action: r.ai_suggested_action,
        ai_confidence: r.ai_confidence,
        ai_reasoning: r.ai_reasoning,
        score,
        daysAgo,
      }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_ITEMS)

  return scored
}
