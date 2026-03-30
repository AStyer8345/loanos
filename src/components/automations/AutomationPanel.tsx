'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CONTACT_AUTOMATIONS,
  LOAN_AUTOMATIONS,
  type AutomationDef,
} from '@/lib/automations/definitions'
import AutomationCard from './AutomationCard'

const GOLD = '#C9A84C'

interface SentDraft {
  automation_name: string
  created_at: string
}

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
  const [sentMap, setSentMap] = useState<Record<string, string>>({})
  const [automations, setAutomations] = useState<AutomationDef[]>([])
  const [loaded, setLoaded] = useState(false)

  // Determine which automations to show — all loan automations always visible
  useEffect(() => {
    if (recordType === 'contact') {
      setAutomations(CONTACT_AUTOMATIONS)
    } else {
      setAutomations(LOAN_AUTOMATIONS)
    }
  }, [recordType])

  // Query sent state from email_drafts
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
        for (const row of data as SentDraft[]) {
          // Keep the most recent sent timestamp per automation
          if (!map[row.automation_name]) {
            map[row.automation_name] = row.created_at
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
            initialSent={!!sentMap[a.id]}
            sentAt={sentMap[a.id] ?? null}
          />
        ))}
      </div>
    </div>
  )
}
