'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export interface DripRow {
  id: string
  contact_name: string
  campaign_name: string
  status: string
  enrolled_at: string
  current_step: number
  total_steps: number
}

interface DripDetailDrawerProps {
  enrollment: DripRow
  children: React.ReactNode
}

export default function DripDetailDrawer({ enrollment, children }: DripDetailDrawerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{enrollment.contact_name}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3 text-sm">
          <p>
            <span className="font-medium">Campaign:</span> {enrollment.campaign_name}
          </p>
          <p>
            <span className="font-medium">Status:</span> {enrollment.status}
          </p>
          <p>
            <span className="font-medium">Step:</span> {enrollment.current_step + 1} of{' '}
            {enrollment.total_steps}
          </p>
          <p>
            <span className="font-medium">Enrolled:</span>{' '}
            {new Date(enrollment.enrolled_at).toLocaleDateString()}
          </p>
          <p className="text-muted-foreground text-xs">
            Full send timeline — connect drip_sends table in Phase 2.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
