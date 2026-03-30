'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AutomationRegistryRow } from '@/lib/automations/types'
import AutomationCard from './AutomationCard'

const GOLD = '#C9A84C'

interface Props {
  recordType: 'contact' | 'loan'
  recordId: string
  contactId: string
  loanId?: string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentStage?: string
}

export default function AutomationPanel({
  recordType,
  recordId,
  contactId,
  loanId,
}: Props) {
  // sentMap keys are automation_name (matches email_drafts.automation_name)
  const [sentMap, setSentMap] = useState<Record<string, string>>({})
  const [automations, setAutomations] = useState<AutomationRegistryRow[]>([])
  const [loaded, setLoaded] = useState(false)

  // Fetch email automations from automation_registry
  useEffect(() => {
    let cancelled = false

    async function fetchAutomations() {
      const supabase = createClient()

      // automation_registry is not in generated types yet — cast to bypass
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('automation_registry')
        .select('*')
        .eq('source', 'n8n')
        .not('email_mode', 'is', null)
        .order('name')

      if (!cancelled && data) {
        setAutomations(data as AutomationRegistryRow[])
      }
    }

    fetchAutomations()
    return () => { cancelled = true }
  }, [])

  // Query sent state from email_drafts — keyed by automation_name
  useEffect(() => {
    let cancelled = false

    async function fetchSentDrafts() {
      const supabase = createClient()

      let query = supabase
        .from('email_drafts')
        .select('automation_name, created_at')
        .eq('status', 'sent')

      if (recordType === 'contact') {
        query = query.eq('contact_id', contactId)
      } else if (loanId) {
        query = query.eq('loan_id', loanId)
      }

      const { data } = await query.order('created_at', { ascending: false })

      if (!cancelled && data) {
        const map: Record<string, string> = {}
        for (const row of data) {
          const name = row.automation_name
          if (name && !map[name]) {
            map[name] = row.created_at ?? ''
          }
        }
        setSentMap(map)
      }
      setLoaded(true)
    }

    fetchSentDrafts()
    return () => { cancelled = true }
  }, [recordType, contactId, loanId])

  if (!loaded) return null
  if (automations.length === 0) return null

  return (
    <div>
      <div
        className="font-bold mb-3"
        style={{
          fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          color: GOLD,
          fontSize: 9,
          letterSpacing: '0.2em',
        }}
      >
        EMAIL AUTOMATIONS
      </div>
      <div className="flex flex-col gap-2">
        {automations.map(a => (
          <AutomationCard
            key={a.id}
            automation={a}
            recordType={recordType}
            recordId={recordId}
            initialSent={!!sentMap[a.name]}
            sentAt={sentMap[a.name] ?? null}
          />
        ))}
      </div>
    </div>
  )
}
