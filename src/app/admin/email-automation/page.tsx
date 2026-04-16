import { Suspense } from 'react'
import WorkflowStatusPanel from '@/components/email-automation/WorkflowStatusPanel'
import EmailSendLog from '@/components/email-automation/EmailSendLog'
import ActiveDripsTable from '@/components/email-automation/ActiveDripsTable'
import LeadOriginTable from '@/components/email-automation/LeadOriginTable'

export const dynamic = 'force-dynamic'

function PanelSkeleton() {
  return <div className="h-32 animate-pulse bg-muted rounded-lg" />
}

export default function EmailAutomationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Email Automation</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live view of outbound emails, active drips, and workflow health.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6">
        <Suspense fallback={<PanelSkeleton />}>
          <WorkflowStatusPanel />
        </Suspense>
        <Suspense fallback={<PanelSkeleton />}>
          <EmailSendLog />
        </Suspense>
        <Suspense fallback={<PanelSkeleton />}>
          <ActiveDripsTable />
        </Suspense>
        <Suspense fallback={<PanelSkeleton />}>
          <LeadOriginTable />
        </Suspense>
      </div>
    </div>
  )
}
