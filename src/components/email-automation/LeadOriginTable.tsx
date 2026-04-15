import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createServiceClient } from '@/lib/supabase/service'

interface LeadOriginRow {
  id: string
  name: string
  source_page: string | null
  form_name: string | null
  utm_source: string | null
  referrer: string | null
  created_at: string
}

async function fetchLeadOrigins(): Promise<LeadOriginRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, source_page, form_name, utm_params, referrer, created_at')
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    name: `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim(),
    source_page: (row.source_page as string | null) ?? null,
    form_name: (row.form_name as string | null) ?? null,
    utm_source: ((row.utm_params as Record<string, string> | null)?.source) ?? null,
    referrer: (row.referrer as string | null) ?? null,
    created_at: row.created_at as string,
  }))
}

export default async function LeadOriginTable() {
  const leads = await fetchLeadOrigins()

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Lead Origin{' '}
          <span className="text-sm font-normal text-muted-foreground">(last 30 days)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {leads.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No leads with origin data in the last 30 days.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 font-medium">Contact</th>
                <th className="py-2 font-medium">Page</th>
                <th className="py-2 font-medium">Form</th>
                <th className="py-2 font-medium">UTM Source</th>
                <th className="py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b">
                  <td className="py-2">{lead.name}</td>
                  <td className="py-2 text-muted-foreground text-xs">{lead.source_page ?? '—'}</td>
                  <td className="py-2 text-muted-foreground text-xs">{lead.form_name ?? '—'}</td>
                  <td className="py-2 text-muted-foreground">{lead.utm_source ?? '—'}</td>
                  <td className="py-2 text-muted-foreground">
                    {new Date(lead.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
