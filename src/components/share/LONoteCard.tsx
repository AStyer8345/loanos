'use client'

import { GOLD } from './constants'

interface LONoteCardProps {
  note: string
  loName: string
}

export default function LONoteCard({ note, loName }: LONoteCardProps) {
  if (!note.trim()) return null

  return (
    <section className="no-break">
      <div
        className="rounded-[16px] p-5"
        style={{
          background: 'rgba(201,168,76,0.05)',
          border: `1px solid ${GOLD}40`,
          borderLeft: `3px solid ${GOLD}`,
        }}
      >
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.12em] mb-2"
          style={{ color: GOLD }}
        >
          A Note from {loName}
        </p>
        <p
          className="text-sm leading-relaxed"
          style={{ color: '#F0EDE8CC', fontStyle: 'italic' }}
        >
          &ldquo;{note}&rdquo;
        </p>
      </div>
    </section>
  )
}
