import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createServiceClient } from '@/lib/supabase/service'

interface Summary {
  activeDrips: number
  emailsLast7Days: number
  bouncesLast7Days: number
  lastEventAt: string | null
}

async function fetchEmailAutomationSummary(): Promise<Summary> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createServiceClient() as any
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: activeDrips },
    { count: emailsLast7Days },
    { count: bouncesLast7Days },
    { data: lastEvent },
  ] = await Promise.all([
    supabase
      .from('drip_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),
    supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'email.sent')
      .gte('created_at', sevenDaysAgo),
    supabase
      .from('activity_log')
      .select('*', { count: 'exact', head: true })
      .in('event_type', ['email.bounced', 'email.complained'])
      .gte('created_at', sevenDaysAgo),
    supabase
      .from('activity_log')
      .select('created_at')
      .like('event_type', 'email.%')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    activeDrips: activeDrips ?? 0,
    emailsLast7Days: emailsLast7Days ?? 0,
    bouncesLast7Days: bouncesLast7Days ?? 0,
    lastEventAt: (lastEvent?.created_at as string | undefined) ?? null,
  }
}

export default async function EmailAutomationCard() {
  const s = await fetchEmailAutomationSummary()
  const health: 'healthy' | 'warn' | 'unknown' =
    s.bouncesLast7Days > 5 ? 'warn' : s.emailsLast7Days > 0 ? 'healthy' : 'unknown'

  return (
    <Link href="/admin/email-automation" className="block">
      <Card className="hover:border-primary transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Email Automation</CardTitle>
          <Badge
            variant={
              health === 'warn' ? 'destructive' : health === 'healthy' ? 'default' : 'secondary'
            }
          >
            {health}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-2xl font-semibold">{s.activeDrips}</div>
              <div className="text-xs text-muted-foreground">Active drips</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{s.emailsLast7Days}</div>
              <div className="text-xs text-muted-foreground">Sent (7d)</div>
            </div>
            <div>
              <div
                className={`text-2xl font-semibold ${s.bouncesLast7Days > 0 ? 'text-destructive' : ''}`}
              >
                {s.bouncesLast7Days}
              </div>
              <div className="text-xs text-muted-foreground">Bounced (7d)</div>
            </div>
          </div>
          {s.lastEventAt && (
            <div className="mt-3 text-xs text-muted-foreground">
              Last event: {new Date(s.lastEventAt).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  )
}
