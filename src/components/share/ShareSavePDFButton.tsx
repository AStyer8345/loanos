'use client'

import { Printer } from 'lucide-react'
import { GOLD, MUTED, BORDER } from './constants'

export default function ShareSavePDFButton() {
  return (
    <button
      onClick={() => window.print()}
      className="print:hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all hover:opacity-80 active:scale-95"
      style={{
        background: 'transparent',
        color: MUTED,
        border: `1px solid ${BORDER}`,
        fontFamily: "'IBM Plex Mono', monospace",
        cursor: 'pointer',
      }}
      title="Save this analysis as a PDF"
    >
      <Printer size={13} style={{ color: GOLD }} />
      Save as PDF
    </button>
  )
}
