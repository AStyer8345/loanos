import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/service'

interface EmailLogEntry {
  id: string
  contact_id: string | null
  event_type: string
  summary: string | null
  created_at: string
}

async function fetchEmailLog(): Promise<EmailLogEntry[]> {
  // activity_log has no `body` column (dropped in migration 083).
  // `summary` is the correct non-PII descriptor field.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('activity_log')
    .select('id, contact_id, event_type, summary, created_at')
    .like('event_type', 'email.%')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as EmailLogEntry[]
}

export default async function EmailSendLog() {
  const entries = await fetchEmailLog()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Email Send Log{' '}
          <span className="text-sm font-normal text-muted-foreground">(last 30 days)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">No email events in the last 30 days.</p>
        ) : (
          <div className="space-y-1">
            {entries.map((e) => (
              <div
                key={e.id}
                className="flex items-start gap-3 py-1 border-b last:border-0 text-sm"
              >
                <span className="text-muted-foreground whitespace-nowrap">
                  {new Date(e.created_at).toLocaleDateString()}
                </span>
                <span className="font-mono text-xs bg-muted px-1 rounded">{e.event_type}</span>
                <span className="truncate text-muted-foreground">{e.summary ?? '—'}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
