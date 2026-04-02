'use client'

import { useState } from 'react'
import type { DripStepRow } from '@/lib/drip/types'

interface StepEditorProps {
  step: DripStepRow
  campaignId: string
  onSave: (updated: DripStepRow) => void
  onCancel: () => void
}

export default function StepEditor({ step, campaignId, onSave, onCancel }: StepEditorProps) {
  const [skeleton, setSkeleton] = useState(step.skeleton)
  const [requiresApproval, setRequiresApproval] = useState(step.requires_approval)
  const [tone, setTone] = useState(step.tone)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/drip/campaigns/${campaignId}/steps`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: step.id,
          updates: { skeleton, requires_approval: requiresApproval, tone },
        }),
      })
      const updated = await res.json() as DripStepRow
      onSave(updated)
    } catch (err) {
      console.error('Failed to save step:', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-surface border-2 border-gold/30 rounded-lg px-5 py-4 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-[10px] font-semibold bg-surface2 text-gold px-2.5 py-0.5 rounded">
          {step.step_order}
        </span>
        <span className="text-[13px] font-semibold">{step.name}</span>
      </div>

      <div>
        <label className="font-mono text-[11px] font-semibold uppercase tracking-wider block mb-1">Skeleton Prompt</label>
        <textarea
          value={skeleton}
          onChange={(e) => setSkeleton(e.target.value)}
          className="w-full bg-surface2 border border-loanborder rounded-lg px-3 py-2 text-sm font-sans resize-y min-h-[80px]"
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 font-mono text-xs">
          <input
            type="checkbox"
            checked={requiresApproval}
            onChange={(e) => setRequiresApproval(e.target.checked)}
            className="accent-gold"
          />
          Requires approval
        </label>

        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] font-semibold uppercase">Tone:</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as DripStepRow['tone'])}
            className="bg-surface2 border border-loanborder rounded px-2 py-1 font-mono text-xs"
          >
            <option value="knowledgeable_friend">Knowledgeable Friend</option>
            <option value="straight_shooter">Straight Shooter</option>
            <option value="quiet_confidence">Quiet Confidence</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="font-mono text-xs px-4 py-2 border border-loanborder bg-surface rounded-lg hover:bg-surface2">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving} className="font-mono text-xs px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
