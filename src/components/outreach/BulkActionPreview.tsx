'use client'

import type { SelectedContact } from './OutreachChatContext'

type Props = {
  contacts: SelectedContact[]
  actionType: 'email' | 'text' | 'admin'
  generatedContent?: string
  adminAction?: string
  adminValue?: string
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export default function BulkActionPreview({
  contacts,
  actionType,
  generatedContent,
  adminAction,
  adminValue,
  onConfirm,
  onCancel,
  isLoading,
}: Props) {
  const count = contacts.length
  const nameList = contacts
    .slice(0, 5)
    .map((c) => [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Unknown')
  const remaining = count - nameList.length

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
      <div className="mb-2 font-semibold text-slate-800">
        {actionType === 'email' && `Email ${count} contact${count !== 1 ? 's' : ''}`}
        {actionType === 'text' && `Text ${count} contact${count !== 1 ? 's' : ''}`}
        {actionType === 'admin' && `Bulk Update ${count} contact${count !== 1 ? 's' : ''}`}
      </div>

      {/* Contact list */}
      <div className="mb-2 text-slate-500">
        {nameList.join(', ')}
        {remaining > 0 && ` +${remaining} more`}
      </div>

      {/* Admin action details */}
      {actionType === 'admin' && adminAction && (
        <div className="mb-2 rounded bg-slate-50 border border-slate-100 p-2">
          <span className="text-slate-400">Action:</span>{' '}
          <span className="text-slate-700 font-medium">
            {adminAction === 'update_stage' && `Move to "${adminValue}"`}
            {adminAction === 'update_type' && `Set type to "${adminValue}"`}
            {adminAction === 'delete' && 'Delete contacts'}
          </span>
        </div>
      )}

      {/* Generated content preview */}
      {generatedContent && (actionType === 'email' || actionType === 'text') && (
        <div className="mb-2 rounded bg-slate-50 border border-slate-100 p-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-slate-700">
          {generatedContent}
        </div>
      )}

      {isLoading && (
        <div className="mb-2 text-slate-400 animate-pulse">Generating content...</div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 rounded bg-emerald-600 px-3 py-1.5 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          {actionType === 'email' && 'Open in Email'}
          {actionType === 'text' && 'Open in Messages'}
          {actionType === 'admin' && (adminAction === 'delete' ? 'Delete' : 'Apply')}
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
