'use client'

import { useState } from 'react'
import { Download, Link2, Save } from 'lucide-react'
import type {
  ScenarioMode, PurchaseScenarioInput,
  RefiScenarioInput, CurrentLoanInput, ReinvestmentResult,
  PurchaseCalculatedResult, RefiCalculatedResult,
} from '@/lib/scenarios/types'

export default function ActionsBar({
  mode, borrowerName, propertyAddress, propertyValue,
  purchaseScenarios, purchaseResults, refiScenarios, refiResults,
  currentLoan, narrative, narrativeEdited, reinvestmentResult,
  scenarioId, onSaved,
}: {
  mode: ScenarioMode
  borrowerName: string
  propertyAddress: string
  propertyValue: number
  purchaseScenarios: PurchaseScenarioInput[]
  purchaseResults: PurchaseCalculatedResult[]
  refiScenarios: RefiScenarioInput[]
  refiResults: RefiCalculatedResult[]
  currentLoan: CurrentLoanInput
  narrative: string
  narrativeEdited: boolean
  reinvestmentResult: ReinvestmentResult | null
  scenarioId: string | null
  onSaved: (id: string) => void
}) {
  const [saving, setSaving] = useState(false)
  const [generatingPdf, setGeneratingPdf] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shareToken, setShareToken] = useState<string | null>(null)

  // Returns { id, share_token } so callers can use it immediately (avoids React state race)
  const save = async (): Promise<{ id: string; share_token: string } | null> => {
    setSaving(true)
    try {
      // Strip amortization schedules from results before saving (too large for JSONB)
      const cleanPurchaseResults = purchaseResults.map(r => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { amortizationSchedule, ...rest } = r
        return rest
      })
      const cleanRefiResults = refiResults.map(r => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { amortizationSchedule, currentLoanSchedule, ...rest } = r
        return rest
      })

      const res = await fetch('/api/scenarios/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: scenarioId,
          scenario_type: mode,
          borrower_name: borrowerName,
          property_address: propertyAddress,
          property_value: propertyValue,
          current_loan_data: mode === 'refinance' ? currentLoan : null,
          scenarios_data: mode === 'purchase' ? purchaseScenarios : refiScenarios,
          results_data: mode === 'purchase' ? cleanPurchaseResults : cleanRefiResults,
          narrative,
          narrative_edited: narrativeEdited,
          reinvestment_data: reinvestmentResult ? { returnRate: 7, horizonYears: 10, result: reinvestmentResult } : null,
        }),
      })
      const data = await res.json()
      if (data.id) {
        onSaved(data.id)
        setShareToken(data.share_token)
        return { id: data.id, share_token: data.share_token }
      }
      return null
    } catch (e) {
      console.error('Save failed:', e)
      return null
    } finally {
      setSaving(false)
    }
  }

  const generatePdf = async () => {
    let id = scenarioId
    if (!id) {
      const saved = await save()
      if (!saved) return
      id = saved.id
    }
    setGeneratingPdf(true)
    try {
      const res = await fetch('/api/scenarios/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: id }),
      })
      // API returns HTML — open in new window for print-to-PDF
      const html = await res.text()
      const w = window.open('', '_blank')
      if (w) {
        w.document.write(html)
        w.document.close()
      }
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setGeneratingPdf(false)
    }
  }

  const copyShareLink = async () => {
    let token = shareToken
    if (!token) {
      const saved = await save()
      if (!saved) return
      token = saved.share_token
    }
    const url = `${window.location.origin}/share/${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
      <button
        onClick={generatePdf}
        disabled={generatingPdf}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all"
        style={{ background: 'var(--sc-gold)', color: '#0a0a0a' }}
      >
        <Download size={16} />
        {generatingPdf ? 'Generating...' : 'Download PDF'}
      </button>

      <button
        onClick={copyShareLink}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
        style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-text)' }}
      >
        <Link2 size={16} />
        {copied ? 'Copied!' : 'Copy Share Link'}
      </button>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all"
        style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-text)' }}
      >
        <Save size={16} />
        {saving ? 'Saving...' : scenarioId ? 'Update Scenario' : 'Save Scenario'}
      </button>

      <p className="text-[10px] mt-2 sm:mt-0 sm:ml-2" style={{ color: 'var(--sc-muted)' }}>
        Use Ctrl/⌘+P in the PDF window to save as PDF
      </p>
    </div>
  )
}
