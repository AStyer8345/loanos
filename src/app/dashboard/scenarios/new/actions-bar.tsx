'use client'

import { Download, Link2, Save } from 'lucide-react'

interface ActionsBarProps {
  onDownloadPDF: () => void
  onCopyLink: () => void
  onSave: () => void
}

export function ActionsBar({ onDownloadPDF, onCopyLink, onSave }: ActionsBarProps) {
  return (
    <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
      <button
        onClick={onDownloadPDF}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--surface-1)] transition-colors"
      >
        <Download className="w-4 h-4" />
        Download PDF
      </button>
      
      <button
        onClick={onCopyLink}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] hover:bg-[var(--surface-1)] transition-colors"
      >
        <Link2 className="w-4 h-4" />
        Copy Share Link
      </button>
      
      <button
        onClick={onSave}
        className="flex items-center gap-2 px-4 py-2 bg-[var(--gold)] text-[var(--background)] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Save className="w-4 h-4" />
        Save Scenario
      </button>
    </div>
  )
}
