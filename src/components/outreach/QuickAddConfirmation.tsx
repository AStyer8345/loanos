'use client'

import type { ExtractedContact } from '@/lib/chat-command-parser'

type Props = {
  extracted: ExtractedContact
  duplicate?: { first_name: string; last_name: string; email: string; phone: string } | null
  onConfirm: (contact: ExtractedContact) => void
  onCancel: () => void
}

const FIELD_LABELS: [keyof ExtractedContact, string][] = [
  ['first_name', 'First Name'],
  ['last_name', 'Last Name'],
  ['email', 'Email'],
  ['phone', 'Phone'],
  ['stage', 'Stage'],
  ['contact_type', 'Type'],
  ['referred_by', 'Referred By'],
  ['source', 'Source'],
  ['company_name', 'Company'],
]

export default function QuickAddConfirmation({ extracted, duplicate, onConfirm, onCancel }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
      <div className="mb-2 font-semibold text-slate-800">Confirm New Contact</div>

      {duplicate && (
        <div className="mb-2 rounded bg-amber-50 border border-amber-200 p-2 text-amber-800">
          <span className="font-medium">Possible duplicate:</span>{' '}
          {duplicate.first_name} {duplicate.last_name}
          {duplicate.email && ` (${duplicate.email})`}
          {!duplicate.email && duplicate.phone && ` (${duplicate.phone})`}
        </div>
      )}

      <div className="space-y-1 mb-3">
        {FIELD_LABELS.map(([key, label]) => {
          const val = extracted[key]
          if (!val) return null
          return (
            <div key={key} className="flex gap-2">
              <span className="text-slate-400 w-20 shrink-0">{label}:</span>
              <span className="text-slate-700 font-medium">{val}</span>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(extracted)}
          className="flex-1 rounded bg-emerald-600 px-3 py-1.5 text-white font-medium hover:bg-emerald-700 transition-colors"
        >
          {duplicate ? 'Add Anyway' : 'Confirm & Add'}
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-slate-200 px-3 py-1.5 text-slate-500 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
