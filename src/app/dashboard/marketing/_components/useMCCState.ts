'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { type MCCState, BLANK_STATE } from '@/lib/marketing/types'

export type UseMCCStateReturn = {
  state:    MCCState | null
  loading:  boolean
  error:    string | null
  saveState: (next: MCCState) => Promise<void>
}

/**
 * Reads and writes the mcc_state JSON blob in Supabase.
 * Table schema: id (uuid), user_id (uuid FK auth.users), state (jsonb), updated_at (timestamptz)
 * Read:  SELECT state FROM mcc_state WHERE user_id = auth.uid() LIMIT 1
 * Write: Upsert on (user_id) conflict — sets state + updated_at
 *
 * First-time user: if no record exists, state is null until first save.
 * First save writes BLANK_STATE merged with the new changes.
 */
export function useMCCState(): UseMCCStateReturn {
  const supabase = useMemo(() => createClient(), [])
  const [state, setState] = useState<MCCState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data, error: dbErr } = await supabase
          .from('mcc_state')
          .select('state')
          .eq('user_id', user.id)
          .limit(1)
          .single()

        if (cancelled) return

        if (dbErr && dbErr.code !== 'PGRST116') {
          // PGRST116 = no rows found — that's fine (first-time user)
          setError(dbErr.message)
        } else if (data?.state) {
          setState(data.state as MCCState)
        }
        // else: first-time user — state stays null
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [supabase])

  const saveState = useCallback(async (next: MCCState) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error: upsertErr } = await supabase
      .from('mcc_state')
      .upsert(
        { user_id: user.id, state: next, updated_at: new Date().toISOString() },
        { onConflict: 'user_id' }
      )

    if (upsertErr) throw new Error(upsertErr.message)
    setState(next)
  }, [supabase])

  return { state, loading, error, saveState }
}

/**
 * Returns the current state merged with BLANK_STATE for safe reads.
 * Use this instead of `state` directly so null fields don't cause crashes.
 */
export function mergedState(state: MCCState | null): MCCState {
  if (!state) return BLANK_STATE
  return {
    ...BLANK_STATE,
    ...state,
    contacts: { ...BLANK_STATE.contacts, ...state.contacts },
    last:     { ...state.last },
  }
}
