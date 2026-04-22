'use client'

import { useState } from 'react'
import { GOLD, MUTED } from './constants'

interface BorrowerIntentCaptureProps {
  token: string
  rows: { label: string }[]
}

export default function BorrowerIntentCapture({ token, rows }: BorrowerIntentCaptureProps) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  if (rows.length < 2) return null

  const handleSelect = async (index: number) => {
    if (done || submitting) return
    setSubmitting(true)
    setSelected(index)
    const label = rows[index].label || `Option ${String.fromCharCode(65 + index)}`
    try {
      await fetch(`/api/share/${token}/intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ option_index: index, option_label: label }),
      })
    } catch {
      // best-effort — never block the borrower
    } finally {
      setSubmitting(false)
      setDone(true)
    }
  }

  return (
    <section className="print:hidden">
      <div
        className="rounded-[16px] p-5"
        style={{ background: 'rgba(201,168,76,0.06)', border: `1px solid ${GOLD}30` }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.12em] mb-1"
          style={{ color: GOLD }}
        >
          Quick Question
        </p>
        <p className="text-sm font-medium mb-4" style={{ color: '#F0EDE8' }}>
          Which option interests you most?
        </p>

        {done ? (
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}60` }}
            >
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: GOLD }}>
              Got it — your loan officer will follow up on{' '}
              <span className="font-semibold">
                {rows[selected!].label || `Option ${String.fromCharCode(65 + selected!)}`}
              </span>
              .
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rows.map((row, i) => {
              const optionLabel = row.label || `Option ${String.fromCharCode(65 + i)}`
              const isSelected = selected === i
              return (
                <button
                  key={i}
                  onClick={() => handleSelect(i)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-[10px] text-sm font-medium transition-all disabled:opacity-60"
                  style={{
                    background: isSelected ? `${GOLD}20` : 'transparent',
                    border: `1px solid ${isSelected ? GOLD : `${GOLD}40`}`,
                    color: isSelected ? GOLD : '#F0EDE8CC',
                  }}
                >
                  {optionLabel}
                </button>
              )
            })}
          </div>
        )}

        <p className="mt-3 text-[10px]" style={{ color: MUTED }}>
          Your selection is shared with your loan officer. This is not a commitment or application.
        </p>
      </div>
    </section>
  )
}
