'use client'

import { useState } from 'react'
import { Download, Link2, Save } from 'lucide-react'
import type {
  ScenarioMode, PurchaseScenarioInput,
  RefiScenarioInput, CurrentLoanInput, ReinvestmentResult,
} from '@/lib/scenarios/types'

export default function ActionsBar({
  mode, borrowerName, propertyAddress, propertyValue,
  purchaseScenarios, refiScenarios,
  currentLoan, narrative, narrativeEdited, reinvestmentResult,
  scenarioId, onSaved,
}: {
  mode: ScenarioMode
  borrowerName: string
  propertyAddress: string
  propertyValue: number
  purchaseScenarios: PurchaseScenarioInput[]
  refiScenarios: RefiScenarioInput[]
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

  const save = async () => {
    setSaving(true)
    try {
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
          narrative,
          narrative_edited: narrativeEdited,
          reinvestment_data: reinvestmentResult ? { returnRate: 7, horizonYears: 10, result: reinvestmentResult } : null,
        }),
      })
      const data = await res.json()
      if (data.id) {
        onSaved(data.id)
        setShareToken(data.share_token)
      }
    } catch (e) {
      console.error('Save failed:', e)
    } finally {
      setSaving(false)
    }
  }

  const generatePdf = async () => {
    if (!scenarioId) {
      await save()
    }
    setGeneratingPdf(true)
    try {
      const res = await fetch('/api/scenarios/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: scenarioId }),
      })
      const data = await res.json()
      if (data.url) {
        window.open(data.url, '_blank')
      }
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setGeneratingPdf(false)
    }
  }

  const copyShareLink = async () => {
    if (!scenarioId) await save()
    const token = shareToken || scenarioId
    if (!token) return
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
        PDF includes your branding, comparison table, charts, and AI analysis
      </p>
    </div>
  )
}
