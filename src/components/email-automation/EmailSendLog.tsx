import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createServiceClient } from '@/lib/supabase/service'

interface SendRow {
  id: string
  created_at: string
  to_address: string | null
  summary: string | null
  type: string | null         // template key — e.g. 'pa_welcome_step_1'
  event_type: string | null   // 'email.sent' | 'email.bounced' | 'email.opened' | etc.
  contact_id: string | null
  external_id: string | null
  contact_name: string | null
}

async function fetchRecentSends(): Promise<SendRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('activity_log')
    .select(
      `
      id,
      created_at,
      to_address,
      summary,
      type,
      event_type,
      contact_id,
      external_id,
      contacts(first_name, last_name)
    `,
    )
    .like('event_type', 'email.%')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(100)

  return (data ?? []).map((row: Record<string, unknown>) => {
    const contact = row.contacts as { first_name?: string; last_name?: string } | null
    const name = contact
      ? `${contact.first_name ?? ''} ${contact.last_name ?? ''}`.trim() || null
      : null
    return {
      id: row.id as string,
      created_at: row.created_at as string,
      to_address: (row.to_address as string | null) ?? null,
      summary: (row.summary as string | null) ?? null,
      type: (row.type as string | null) ?? null,
      event_type: (row.event_type as string | null) ?? null,
      contact_id: (row.contact_id as string | null) ?? null,
      external_id: (row.external_id as string | null) ?? null,
      contact_name: name,
    }
  })
}

function formatTemplate(t: string | null): string {
  if (!t) return '—'
  // pa_welcome_step_1 → PA Welcome · Step 1
  return t
    .replace(/_/g, ' ')
    .replace(/\bpa\b/gi, 'PA')
    .replace(/\bdpa\b/gi, 'DPA')
    .replace(/\bstep (\d+)\b/i, '· Step $1')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function eventBadgeVariant(
  evt: string | null,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (evt === 'email.bounced' || evt === 'email.complained') return 'destructive'
  if (evt === 'email.opened' || evt === 'email.clicked') return 'default'
  if (evt === 'email.delivered') return 'secondary'
  return 'outline'
}

function eventLabel(evt: string | null): string {
  if (!evt) return 'unknown'
  return evt.replace(/^email\./, '')
}

function formatWhen(ts: string): string {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default async function EmailSendLog() {
  const rows = await fetchRecentSends()

  return (
    <Card data-testid="email-send-log">
      <CardHeader>
        <CardTitle>
          Email Send Log{' '}
          <span className="text-sm font-normal text-muted-foreground">(last 30 days)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No emails sent yet. Once a workflow fires, sends will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">When</th>
                  <th className="py-2 pr-4 font-medium">To</th>
                  <th className="py-2 pr-4 font-medium">Contact</th>
                  <th className="py-2 pr-4 font-medium">Template</th>
                  <th className="py-2 pr-4 font-medium">Subject</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0 align-top">
                    <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
                      {formatWhen(r.created_at)}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">{r.to_address ?? '—'}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{r.contact_name ?? '—'}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{formatTemplate(r.type)}</td>
                    <td className="py-2 pr-4 max-w-md truncate" title={r.summary ?? ''}>
                      {r.summary ?? '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={eventBadgeVariant(r.event_type)}>
                        {eventLabel(r.event_type)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
