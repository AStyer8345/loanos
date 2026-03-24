'use client'

import Link from 'next/link'

export type HotLead = {
  id: string
  first_name: string
  last_name: string | null
  notes: string
  daysAgo: number
  score: number
}

interface HotLeadsWidgetProps {
  hotLeads: HotLead[]
}

export default function HotLeadsWidget({ hotLeads }: HotLeadsWidgetProps) {
  if (hotLeads.length === 0) return null

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
      </div>
      <div>
        {hotLeads.map((lead, i) => {
          const name = [lead.first_name, lead.last_name].filter(Boolean).join(' ')
          const snippet = lead.notes.length > 60
            ? lead.notes.slice(0, 57) + '…'
            : lead.notes
          const daysLabel = lead.daysAgo === 0
            ? 'today'
            : lead.daysAgo === 1
              ? '1d ago'
              : `${lead.daysAgo}d ago`

          return (
            <Link
              key={lead.id}
              href={`/dashboard/contacts/${lead.id}`}
              style={{
                display: 'block',
                padding: '10px 14px',
                borderBottom: i < hotLeads.length - 1 ? '1px solid #1e1e1e' : 'none',
                textDecoration: 'none',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1a1a1a')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 3,
              }}>
                <span style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 11,
                  color: '#e0e0e0',
                  fontWeight: 500,
                }}>
                  {name}
                </span>
                <span style={{
                  fontFamily: '"IBM Plex Mono", monospace',
                  fontSize: 10,
                  color: '#555',
                }}>
                  {daysLabel}
                </span>
              </div>
              <div style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 10,
                color: '#666',
                fontStyle: 'italic',
              }}>
                &quot;{snippet}&quot;
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
