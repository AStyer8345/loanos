import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createServiceClient } from '@/lib/supabase/service'
import DripDetailDrawer, { type DripRow } from './DripDetailDrawer'

async function fetchActiveDrips(): Promise<DripRow[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any

  const { data } = await supabase
    .from('drip_enrollments')
    .select(
      `
      id,
      status,
      enrolled_at,
      current_step,
      contacts!inner(first_name, last_name),
      drip_campaigns!inner(name),
      drip_steps(id)
    `,
    )
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false })
    .limit(50)

  return (data ?? []).map((row: Record<string, unknown>) => {
    const contact = row.contacts as { first_name: string; last_name: string }
    const campaign = row.drip_campaigns as { name: string }
    const steps = row.drip_steps as unknown[]
    return {
      id: row.id as string,
      contact_name: `${contact.first_name} ${contact.last_name}`.trim(),
      campaign_name: campaign.name,
      status: row.status as string,
      enrolled_at: row.enrolled_at as string,
      current_step: row.current_step as number,
      total_steps: steps.length,
    }
  })
}

export default async function ActiveDripsTable() {
  const drips = await fetchActiveDrips()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Drip Sequences</CardTitle>
      </CardHeader>
      <CardContent>
        {drips.length === 0 ? (
          <p className="text-sm text-muted-foreground">No active drip enrollments.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 font-medium">Contact</th>
                <th className="py-2 font-medium">Campaign</th>
                <th className="py-2 font-medium">Step</th>
                <th className="py-2 font-medium">Enrolled</th>
                <th className="py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {drips.map((d) => (
                <DripDetailDrawer key={d.id} enrollment={d}>
                  <tr className="border-b hover:bg-muted/40 cursor-pointer transition-colors">
                    <td className="py-2">{d.contact_name}</td>
                    <td className="py-2 text-muted-foreground">{d.campaign_name}</td>
                    <td className="py-2">
                      {d.current_step + 1}/{d.total_steps}
                    </td>
                    <td className="py-2 text-muted-foreground">
                      {new Date(d.enrolled_at).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      <Badge variant="default">{d.status}</Badge>
                    </td>
                  </tr>
                </DripDetailDrawer>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
