'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, MessageSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'

export type HotLead = {
  id: string
  first_name: string
  last_name: string | null
  email: string | null
  phone: string | null
  referred_by: string | null
  notes: string
  daysAgo: number
  score: number
}

interface HotLeadsWidgetProps {
  hotLeads: HotLead[]
}

export default function HotLeadsWidget({ hotLeads }: HotLeadsWidgetProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const supabase = createClient()

  const visible = hotLeads.filter(l => !dismissed.has(l.id))

  async function handleDismiss(id: string) {
    setDismissed(prev => new Set([...prev, id]))
    await supabase
      .from('contacts')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ hot_lead_dismissed: true } as any)
      .eq('id', id)
  }

  if (visible.length === 0) return null

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-input flex items-center gap-2">
        <span className="text-sm">🔥</span>
        <span className="text-xs font-mono font-semibold text-[#C9A84C] uppercase tracking-widest">Hot Leads</span>
        <span className="text-[10px] font-mono text-muted-foreground">last 14 days</span>
      </div>

      <div className="divide-y divide-input">
        {visible.map(lead => {
          const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
          const daysLabel = lead.daysAgo === 0 ? 'today' : lead.daysAgo === 1 ? '1d ago' : `${lead.daysAgo}d ago`
          const noteSnippet = lead.notes.length > 100 ? lead.notes.slice(0, 97) + '…' : lead.notes

          return (
            <div key={lead.id} className="px-4 py-3 hover:bg-[#1e293b]/30 transition-colors group">
              <div className="flex items-center justify-between gap-3">
                {/* Name + meta */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Link
                    href={`/dashboard/contacts/${lead.id}`}
                    className="text-xs font-mono font-medium text-foreground hover:text-[#C9A84C] transition-colors truncate"
                  >
                    {name}
                  </Link>
                  {lead.referred_by && (
                    <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">via {lead.referred_by}</span>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground flex-shrink-0">{daysLabel}</span>
                </div>

                {/* Action icons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {lead.phone && (
                    <>
                      <a
                        href={`tel:${lead.phone}`}
                        title={`Call ${lead.phone}`}
                        className="p-1.5 rounded hover:bg-emerald-900/40 text-muted-foreground hover:text-emerald-400 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <a
                        href={`sms:${lead.phone}`}
                        title={`Text ${lead.phone}`}
                        className="p-1.5 rounded hover:bg-blue-900/40 text-muted-foreground hover:text-blue-400 transition-colors"
                        onClick={e => e.stopPropagation()}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      title={`Email ${lead.email}`}
                      className="p-1.5 rounded hover:bg-violet-900/40 text-muted-foreground hover:text-violet-400 transition-colors"
                      onClick={e => e.stopPropagation()}
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDismiss(lead.id)}
                    title="Dismiss"
                    className="p-1.5 rounded text-zinc-700 hover:text-muted-foreground hover:bg-muted transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Notes */}
              {noteSnippet && (
                <p className="text-[11px] font-mono text-muted-foreground mt-1 pl-0 leading-relaxed italic">{noteSnippet}</p>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
