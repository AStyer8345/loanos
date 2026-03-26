'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

const TH_STYLE: React.CSSProperties = {
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: 10,
  color: '#555',
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  textAlign: 'left',
  padding: '6px 10px',
  whiteSpace: 'nowrap',
}

const TD_STYLE: React.CSSProperties = {
  fontFamily: '"IBM Plex Mono", monospace',
  fontSize: 11,
  color: '#bbb',
  padding: '9px 10px',
  verticalAlign: 'top',
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
    <div style={{
      background: '#111',
      border: '1px solid #2a2a2a',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid #2a2a2a',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <span style={{ fontSize: 14 }}>🔥</span>
        <span style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 11,
          color: '#C9A84C',
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}>
          Hot Leads
        </span>
        <span style={{
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 10,
          color: '#444',
          marginLeft: 4,
        }}>
          — recent leads · last 14 days
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
              <th style={TH_STYLE}>Name</th>
              <th style={TH_STYLE}>Email</th>
              <th style={TH_STYLE}>Phone</th>
              <th style={TH_STYLE}>Notes</th>
              <th style={TH_STYLE}>Referred By</th>
              <th style={{ ...TH_STYLE, textAlign: 'right' }}>Age</th>
              <th style={{ ...TH_STYLE, width: 32 }}></th>
            </tr>
          </thead>
          <tbody>
            {visible.map((lead, i) => {
              const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
              const noteSnippet = lead.notes.length > 80
                ? lead.notes.slice(0, 77) + '…'
                : lead.notes
              const daysLabel = lead.daysAgo === 0
                ? 'today'
                : lead.daysAgo === 1
                  ? '1d ago'
                  : `${lead.daysAgo}d ago`

              return (
                <tr
                  key={lead.id}
                  style={{ borderBottom: i < visible.length - 1 ? '1px solid #1a1a1a' : 'none' }}
                >
                  <td style={TD_STYLE}>
                    <Link
                      href={`/dashboard/contacts/${lead.id}`}
                      style={{ color: '#e0e0e0', textDecoration: 'none', fontWeight: 500 }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#C9A84C')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#e0e0e0')}
                    >
                      {name}
                    </Link>
                  </td>
                  <td style={TD_STYLE}>
                    {lead.email
                      ? <a href={`mailto:${lead.email}`} style={{ color: '#888', textDecoration: 'none' }}>{lead.email}</a>
                      : <span style={{ color: '#333' }}>—</span>
                    }
                  </td>
                  <td style={{ ...TD_STYLE, whiteSpace: 'nowrap' }}>
                    {lead.phone
                      ? <a href={`tel:${lead.phone}`} style={{ color: '#888', textDecoration: 'none' }}>{lead.phone}</a>
                      : <span style={{ color: '#333' }}>—</span>
                    }
                  </td>
                  <td style={{ ...TD_STYLE, color: '#666', fontStyle: 'italic', maxWidth: 260 }}>
                    {noteSnippet || <span style={{ color: '#333' }}>—</span>}
                  </td>
                  <td style={{ ...TD_STYLE, color: '#666' }}>
                    {lead.referred_by || <span style={{ color: '#333' }}>—</span>}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'right', color: '#444', whiteSpace: 'nowrap' }}>
                    {daysLabel}
                  </td>
                  <td style={{ ...TD_STYLE, textAlign: 'center', padding: '9px 8px' }}>
                    <button
                      onClick={() => handleDismiss(lead.id)}
                      title="Remove from hot leads"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#333',
                        fontSize: 14,
                        lineHeight: 1,
                        padding: '2px 4px',
                        borderRadius: 3,
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#888')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#333')}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
