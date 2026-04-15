import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface WorkflowStatus {
  id: string
  name: string
  source: 'n8n' | 'workflow-devkit'
  active: boolean
  lastRunAt: string | null
  lastRunStatus: 'success' | 'error' | 'running' | null
}

async function fetchWorkflowStatuses(): Promise<WorkflowStatus[]> {
  // n8n: query active workflows via n8n REST API
  // N8N_API_BASE is the env var used in this codebase (matches /api/automations routes)
  const n8nApiBase = process.env.N8N_API_BASE
  const n8nApiKey = process.env.N8N_API_KEY

  if (!n8nApiBase || !n8nApiKey) return []

  let res: Response
  try {
    res = await fetch(`${n8nApiBase}/api/v1/workflows?active=true`, {
      headers: { 'X-N8N-API-KEY': n8nApiKey },
      next: { revalidate: 60 }, // cache 60s
    })
  } catch {
    return []
  }

  if (!res.ok) return []

  const { data: workflows } = (await res.json()) as {
    data: Array<{ id: string; name: string; active: boolean }>
  }

  return (workflows ?? []).map((wf) => ({
    id: wf.id,
    name: wf.name,
    source: 'n8n' as const,
    active: wf.active,
    lastRunAt: null,
    lastRunStatus: null,
  }))
}

export default async function WorkflowStatusPanel() {
  const statuses = await fetchWorkflowStatuses()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Status</CardTitle>
      </CardHeader>
      <CardContent>
        {statuses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No workflow data available.</p>
        ) : (
          <div className="space-y-2">
            {statuses.map((wf) => (
              <div
                key={wf.id}
                className="flex items-center justify-between py-1 border-b last:border-0"
              >
                <span className="text-sm font-medium">{wf.name}</span>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    {wf.source}
                  </Badge>
                  <Badge variant={wf.active ? 'default' : 'secondary'}>
                    {wf.active ? 'active' : 'inactive'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
