'use client'

import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Globe,
  Phone,
  Mail,
  Hash,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Lender } from '@/components/lenders/LenderCard'

function channelVariant(channel: string | null): 'info' | 'warning' | 'outline' {
  if (!channel) return 'outline'
  const lower = channel.toLowerCase()
  if (lower.includes('broker')) return 'info'
  if (lower.includes('correspondent')) return 'warning'
  return 'outline'
}

/** Split notes into product sections based on common patterns */
function parseNotes(notes: string): { intro: string; sections: { title: string; details: string }[] } {
  // Try to split on product-like patterns: "ProductName:" at the start of a sentence
  const parts = notes.split(/(?<=\.)\s+(?=[A-Z][A-Za-z\s\/\-]+:)/)

  if (parts.length <= 1) {
    // Try splitting on period-separated sentences that start with a product keyword
    const sentences = notes.split(/\.\s+/).filter(Boolean)
    if (sentences.length <= 2) return { intro: notes, sections: [] }

    // First sentence is intro, rest are details
    return { intro: sentences[0] + '.', sections: sentences.slice(1).map(s => {
      const colonIdx = s.indexOf(':')
      if (colonIdx > 0 && colonIdx < 40) {
        return { title: s.substring(0, colonIdx).trim(), details: s.substring(colonIdx + 1).trim() }
      }
      return { title: '', details: s.endsWith('.') ? s : s + '.' }
    }).filter(s => s.details) }
  }

  const intro = ''
  const sections = parts.map(part => {
    const colonIdx = part.indexOf(':')
    if (colonIdx > 0 && colonIdx < 50) {
      return { title: part.substring(0, colonIdx).trim(), details: part.substring(colonIdx + 1).trim() }
    }
    return { title: '', details: part }
  })

  return { intro, sections }
}

export default function LenderDetailClient({ lender }: { lender: Lender }) {
  const router = useRouter()
  const parsedNotes = lender.notes ? parseNotes(lender.notes) : null
  const updatedDate = lender.updated_at
    ? new Date(lender.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/dashboard/lenders')}
        className="mb-6 -ml-2 text-muted-foreground"
      >
        <ArrowLeft className="size-4 mr-1" />
        All Lenders
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 border border-primary/20">
            <Building2 className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{lender.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
              {lender.channel && (
                <Badge variant={channelVariant(lender.channel)} className="text-xs">
                  {lender.channel}
                </Badge>
              )}
              {lender.website && (
                <a
                  href={lender.website.startsWith('http') ? lender.website : `https://${lender.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 hover:text-primary transition-colors"
                >
                  <Globe className="size-3.5" />
                  Website
                </a>
              )}
              {lender.broker_id && (
                <span className="inline-flex items-center gap-1 font-mono text-xs">
                  <Hash className="size-3" />
                  {lender.broker_id}
                </span>
              )}
            </div>
          </div>
        </div>

        {updatedDate && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <Clock className="size-3" />
            Updated {updatedDate}
          </span>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left column: contacts + products */}
        <div className="space-y-6 md:col-span-1">
          {/* AE Contacts */}
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-semibold text-foreground">Account Executives</h2>
            </CardHeader>
            <CardContent>
              {lender.contacts.length === 0 ? (
                <p className="text-xs text-muted-foreground">No contacts on file.</p>
              ) : (
                <div className="space-y-4">
                  {lender.contacts.map((c, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{c.name}</span>
                        {c.role && (
                          <Badge variant="outline" className="text-[10px]">{c.role}</Badge>
                        )}
                      </div>
                      {c.phone && (
                        <a
                          href={`tel:${c.phone}`}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Phone className="size-3" />
                          {c.phone}
                        </a>
                      )}
                      {c.email && (
                        <a
                          href={`mailto:${c.email}`}
                          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Mail className="size-3" />
                          {c.email}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Specialty Products */}
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-semibold text-foreground">Specialty Products</h2>
            </CardHeader>
            <CardContent>
              {lender.specialty_products.length === 0 ? (
                <p className="text-xs text-muted-foreground">No specialty products listed.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {lender.specialty_products.map((prod) => (
                    <Badge key={prod} variant="secondary" className="text-xs">
                      {prod}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: notes / product details */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-sm font-semibold text-foreground">Product Details & Guidelines</h2>
            </CardHeader>
            <CardContent>
              {!parsedNotes ? (
                <p className="text-sm text-muted-foreground">
                  No detailed guidelines on file yet. As lender emails are processed, product details will appear here.
                </p>
              ) : (
                <div className="space-y-4">
                  {parsedNotes.intro && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {parsedNotes.intro}
                    </p>
                  )}

                  {parsedNotes.sections.length > 0 && parsedNotes.intro && <Separator />}

                  {parsedNotes.sections.map((section, i) => (
                    <div key={i}>
                      {section.title ? (
                        <>
                          <h3 className="text-sm font-medium text-foreground mb-1">{section.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{section.details}</p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground leading-relaxed">{section.details}</p>
                      )}
                      {i < parsedNotes.sections.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
