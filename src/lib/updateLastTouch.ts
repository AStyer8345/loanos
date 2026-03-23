import { createClient } from '@/lib/supabase/client'

type SupabaseClient = ReturnType<typeof createClient>

/**
 * Updates a contact's last_touch_at timestamp and logs an event to activity_log.
 * Call this whenever any contact or loan event occurs that constitutes a "touch."
 *
 * @param supabase  - Supabase client instance
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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  await Promise.all([
    supabase
      .from('contacts')
      .update({ last_touch_at: now })
      .eq('id', contactId),
    supabase.from('activity_log').insert({
      contact_id: contactId,
      loan_id: loanId ?? null,
      action: eventType,
      type: eventType,
      summary: description,
      entity_type: 'contact',
      occurred_at: now,
      user_id: user.id,
      organization_id: profile?.organization_id ?? null,
      metadata: (metadata ?? null) as never,
    }),
  ])
}
