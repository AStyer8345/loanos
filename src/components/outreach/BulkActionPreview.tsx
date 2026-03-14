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
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-xs font-mono">
      <div className="mb-2 font-semibold text-zinc-100">
        {actionType === 'email' && `Email ${count} contact${count !== 1 ? 's' : ''}`}
        {actionType === 'text' && `Text ${count} contact${count !== 1 ? 's' : ''}`}
        {actionType === 'admin' && `Bulk Update ${count} contact${count !== 1 ? 's' : ''}`}
      </div>

      {/* Contact list */}
      <div className="mb-2 text-zinc-500">
        {nameList.join(', ')}
        {remaining > 0 && ` +${remaining} more`}
      </div>

      {/* Admin action details */}
      {actionType === 'admin' && adminAction && (
        <div className="mb-2 rounded bg-zinc-800 border border-zinc-700 p-2">
          <span className="text-zinc-500">Action:</span>{' '}
          <span className="text-zinc-300 font-medium">
            {adminAction === 'update_stage' && `Move to "${adminValue}"`}
            {adminAction === 'update_type' && `Set type to "${adminValue}"`}
            {adminAction === 'delete' && 'Delete contacts'}
          </span>
        </div>
      )}

      {/* Generated content preview */}
      {generatedContent && (actionType === 'email' || actionType === 'text') && (
        <div className="mb-2 rounded bg-zinc-800 border border-zinc-700 p-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-zinc-300 font-mono">
          {generatedContent}
        </div>
      )}

      {isLoading && (
        <div className="mb-2 text-zinc-500 animate-pulse font-mono">Generating content...</div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 rounded bg-amber-500 px-3 py-1.5 text-zinc-900 font-mono font-medium hover:bg-amber-400 transition-colors disabled:opacity-50"
        >
          {actionType === 'email' && 'Open in Email'}
          {actionType === 'text' && 'Open in Messages'}
          {actionType === 'admin' && (adminAction === 'delete' ? 'Delete' : 'Apply')}
        </button>
        <button
          onClick={onCancel}
          className="rounded border border-zinc-600 px-3 py-1.5 text-zinc-400 hover:bg-zinc-800 transition-colors font-mono"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
