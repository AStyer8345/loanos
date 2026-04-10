import { createClient } from '@/lib/supabase/client'

type SupabaseClient = ReturnType<typeof createClient>

/**
 * Updates a contact's last_touch_at timestamp and logs an event to activity_log.
 * Call this whenever any contact or loan event occurs that constitutes a "touch."
 *
 * The activity_log write goes through POST /api/activity so that the summary
 * and metadata fields are encrypted into activity_log_pii server-side. The
 * contacts.last_touch_at update still happens directly against Supabase via
 * the passed-in client (RLS enforces org scope).
 *
 * @param supabase  - Supabase client instance (used for contacts.last_touch_at update)
 * @param contactId - The contact to update
 * @param eventType - Machine-readable type (e.g. 'note_added', 'stage_changed')
 * @param description - Human-readable description (e.g. 'Added a note')
 * @param loanId    - Optional loan ID if the event originated from a loan
 */
export async function updateLastTouch(
  supabase: SupabaseClient,
  contactId: string,
  eventType: string,
  description: string,
  loanId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const now = new Date().toISOString()

  await Promise.all([
    // 1. Contact timestamp — RLS-enforced via session client
    supabase
      .from('contacts')
      .update({ last_touch_at: now })
      .eq('id', contactId),

    // 2. Activity log with encrypted PII — routed through server endpoint
    //    so the encryption key never touches the browser. user_id and
    //    organization_id are enforced from the session on the server side.
    fetch('/api/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicFields: {
          contact_id: contactId,
          loan_id: loanId ?? null,
          action: eventType,
          type: eventType,
          entity_type: 'contact',
          occurred_at: now,
        },
        pii: {
          summary: description,
          metadata: metadata ?? null,
        },
      }),
    }).catch(err => {
      // Don't fail the whole call if activity logging fails — last_touch_at
      // update is the load-bearing side effect. Log and continue.
      console.error('[updateLastTouch] activity log write failed:', err)
    }),
  ])
}
