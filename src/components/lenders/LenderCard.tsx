'use client'

import { useState } from 'react'
import { Building2, Globe, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Contact = {
  name: string
  phone?: string
  email?: string
  role?: string
}

export type Lender = {
  id: string
  name: string
  channel: string | null
  website: string | null
  broker_id: string | null
  contacts: Contact[]
  specialty_products: string[]
  notes: string | null
  updated_at: string
}

function channelVariant(channel: string | null): 'info' | 'warning' | 'outline' {
  if (!channel) return 'outline'
  const lower = channel.toLowerCase()
  if (lower.includes('broker')) return 'info'
  if (lower.includes('correspondent')) return 'warning'
  return 'outline'
}

export default function LenderCard({ lender }: { lender: Lender }) {
  const [notesOpen, setNotesOpen] = useState(false)

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="size-4 shrink-0 text-muted-foreground" />
            <h3 className="font-semibold text-sm leading-tight truncate">{lender.name}</h3>
          </div>
          {lender.channel && (
            <Badge variant={channelVariant(lender.channel)} className="shrink-0 text-[10px]">
              {lender.channel}
            </Badge>
          )}
        </div>

        {/* Website + Broker ID */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
          {lender.website && (
            <a
              href={lender.website.startsWith('http') ? lender.website : `https://${lender.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Globe className="size-3" />
              Website
            </a>
          )}
          {lender.broker_id && (
            <span className="font-mono text-[11px]">ID: {lender.broker_id}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* AE Contacts */}
        {lender.contacts.length > 0 && (
          <div className="space-y-2">
            {lender.contacts.map((c, i) => (
              <div key={i} className="text-xs space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">{c.name}</span>
                  {c.role && (
                    <span className="text-muted-foreground">({c.role})</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground">
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                      <Phone className="size-3" />
                      {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="inline-flex items-center gap-1 hover:text-primary transition-colors">
                      <Mail className="size-3" />
                      {c.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Specialty Products */}
        {lender.specialty_products.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lender.specialty_products.map((prod) => (
              <Badge key={prod} variant="secondary" className="text-[10px]">
                {prod}
              </Badge>
            ))}
          </div>
        )}

        {/* Expandable Notes */}
        {lender.notes && (
          <div>
            <button
              type="button"
              onClick={() => setNotesOpen(!notesOpen)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {notesOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              Notes
            </button>
            {notesOpen && (
              <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {lender.notes}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
