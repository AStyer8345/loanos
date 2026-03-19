'use client'

import { useState, useRef } from 'react'
import { Sparkles, RotateCcw, Pencil } from 'lucide-react'
import type {
  ScenarioMode, PurchaseScenarioInput, PurchaseCalculatedResult,
  RefiScenarioInput, RefiCalculatedResult, CurrentLoanInput, ReinvestmentResult,
} from '@/lib/scenarios/types'

const DISCLAIMER = 'This analysis is for informational purposes only and does not constitute a loan commitment or financial advice. Consult with your loan officer for personalized guidance.'

export default function NarrativeSection({
  mode, narrative, narrativeEdited,
  purchaseScenarios, purchaseResults, refiScenarios, refiResults,
  currentLoan, reinvestmentResult, borrowerName,
  onNarrativeChange, onNarrativeGenerated,
}: {
  mode: ScenarioMode
  narrative: string
  narrativeEdited: boolean
  purchaseScenarios: PurchaseScenarioInput[]
  purchaseResults: PurchaseCalculatedResult[]
  refiScenarios: RefiScenarioInput[]
  refiResults: RefiCalculatedResult[]
  currentLoan: CurrentLoanInput
  reinvestmentResult: ReinvestmentResult | null
  borrowerName: string
  onNarrativeChange: (text: string) => void
  onNarrativeGenerated: (text: string) => void
}) {
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const textRef = useRef<HTMLTextAreaElement>(null)

  const generate = async () => {
    setGenerating(true)
    onNarrativeGenerated('')

    try {
      const res = await fetch('/api/scenarios/generate-narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          borrowerName,
          purchaseScenarios: mode === 'purchase' ? purchaseScenarios : [],
          purchaseResults: mode === 'purchase' ? purchaseResults : [],
          refiScenarios: mode === 'refinance' ? refiScenarios : [],
          refiResults: mode === 'refinance' ? refiResults : [],
          currentLoan: mode === 'refinance' ? currentLoan : null,
          reinvestmentResult,
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error || `Request failed (${res.status})`)
      }

      // Stream response
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          // Parse SSE chunks
          const lines = chunk.split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  accumulated += parsed.text
                  onNarrativeGenerated(accumulated)
                } else if (parsed.error) {
                  throw new Error(parsed.error)
                }
              } catch (parseErr) {
                if (parseErr instanceof SyntaxError) {
                  // Non-JSON data, append directly
                  accumulated += data
                  onNarrativeGenerated(accumulated)
                } else {
                  throw parseErr
                }
              }
            }
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      console.error('[NarrativeSection] generation failed:', msg)
      onNarrativeGenerated('Error: AI generation failed. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="rounded-[14px]" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Sparkles size={16} style={{ color: 'var(--sc-accent)' }} />
          <h3 className="text-sm font-semibold" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>AI Analysis</h3>
        </div>
        <div className="flex items-center gap-2">
          {narrative && (
            <>
              <button
                onClick={() => setEditing(!editing)}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors"
                style={{
                  background: editing ? 'var(--sc-gold-dim)' : 'transparent',
                  color: 'var(--sc-muted)',
                  border: `1px solid ${editing ? 'var(--sc-gold)' : 'var(--sc-border)'}`,
                }}
              >
                <Pencil size={10} />
                {editing ? 'Done' : 'Edit'}
              </button>
              <button
                onClick={generate}
                disabled={generating}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium"
                style={{ color: 'var(--sc-muted)', border: '1px solid var(--sc-border)' }}
              >
                <RotateCcw size={10} />
                Regenerate
              </button>
            </>
          )}
        </div>
      </div>

      <div className="px-5 pb-5">
        {!narrative && !generating ? (
          <button
            onClick={generate}
            className="w-full py-3.5 rounded-[10px] text-sm font-semibold flex items-center justify-center gap-2 transition-all"
            style={{ background: 'var(--sc-accent)', color: '#ffffff' }}
          >
            <Sparkles size={16} />
            Generate Analysis
          </button>
        ) : editing ? (
          <textarea
            ref={textRef}
            value={narrative}
            onChange={e => onNarrativeChange(e.target.value)}
            rows={12}
            className="w-full p-3 rounded-md text-sm border outline-none resize-y"
            style={{
              borderColor: 'var(--sc-border)',
              color: 'var(--sc-text)',
              background: 'var(--sc-card-alt)',
              fontFamily: "'IBM Plex Mono', monospace",
              lineHeight: '1.6',
            }}
          />
        ) : (
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap"
            style={{
              color: narrative.startsWith('Error:') ? '#C0392B' : 'var(--sc-text)',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            {narrative}
            {generating && <span className="inline-block w-2 h-4 ml-0.5 animate-pulse" style={{ background: 'var(--sc-accent)' }} />}
          </div>
        )}

        {narrativeEdited && (
          <p className="text-[10px] mt-2 italic" style={{ color: 'var(--sc-muted)' }}>
            This narrative has been manually edited.
          </p>
        )}

        <p className="text-[10px] mt-4 leading-relaxed" style={{ color: 'var(--sc-muted)' }}>
          {DISCLAIMER}
        </p>
      </div>
    </div>
  )
}
