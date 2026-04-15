'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, Link2, Save, Mail, CheckCircle, X, Eye } from 'lucide-react'
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
  const [showEmailPanel, setShowEmailPanel] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [viewCount, setViewCount] = useState<number | null>(null)
  const [viewCountJustIncreased, setViewCountJustIncreased] = useState(false)
  const prevViewCount = useRef<number | null>(null)

  // Poll view_count every 30 seconds after save so Adam sees when borrower opens the link
  useEffect(() => {
    if (!scenarioId) return

    const fetchViewCount = async () => {
      try {
        const res = await fetch(`/api/scenarios/views?id=${scenarioId}`)
        if (!res.ok) return
        const data = await res.json() as { view_count: number }
        const newCount = data.view_count ?? 0
        setViewCount(prev => {
          if (prev !== null && newCount > prev) {
            setViewCountJustIncreased(true)
            setTimeout(() => setViewCountJustIncreased(false), 3000)
          }
          return newCount
        })
        prevViewCount.current = newCount
      } catch {
        // Silently ignore — view count is non-critical
      }
    }

    fetchViewCount()
    const interval = setInterval(fetchViewCount, 30_000)
    return () => clearInterval(interval)
  }, [scenarioId])

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

        // Fire-and-forget: generate borrower Q&A in the background.
        // No await — this must not delay the LO's workflow.
        fetch('/api/scenarios/generate-qa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scenarioId: data.id }),
        }).catch(() => { /* best-effort — silently ignore */ })

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
    let token = shareToken
    if (!token) {
      const saved = await save()
      if (!saved) return
      token = saved.share_token
    }
    setGeneratingPdf(true)
    try {
      // Open the share page in a new tab — print styles handle PDF formatting
      const url = `${window.location.origin}/share/${token}?print=1`
      window.open(url, '_blank')
    } catch (e) {
      console.error('PDF generation failed:', e)
    } finally {
      setGeneratingPdf(false)
    }
  }

  const sendEmail = async () => {
    if (!emailAddress.trim()) return
    setSendingEmail(true)
    setEmailError(null)
    try {
      let id = scenarioId
      if (!id) {
        const saved = await save()
        if (!saved) { setEmailError('Could not save scenario.'); return }
        id = saved.id
      }
      const res = await fetch('/api/scenarios/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: id, borrowerEmail: emailAddress.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEmailError(data.error || 'Failed to send.')
      } else {
        setEmailSent(true)
        setShowEmailPanel(false)
        setTimeout(() => setEmailSent(false), 4000)
      }
    } catch {
      setEmailError('Network error. Try again.')
    } finally {
      setSendingEmail(false)
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
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          onClick={generatePdf}
          disabled={generatingPdf}
          className="flex items-center gap-2 px-6 py-3 rounded-[14px] text-sm font-semibold transition-all"
          style={{ background: 'var(--sc-accent)', color: '#ffffff' }}
        >
          <Download size={16} />
          {generatingPdf ? 'Generating...' : 'Download PDF'}
        </button>

        <button
          onClick={() => { setShowEmailPanel(p => !p); setEmailError(null) }}
          className="flex items-center gap-2 px-6 py-3 rounded-[14px] text-sm font-medium transition-all"
          style={{ border: '1px solid var(--sc-border)', color: emailSent ? '#4ade80' : 'var(--sc-text)' }}
        >
          {emailSent ? <CheckCircle size={16} /> : <Mail size={16} />}
          {emailSent ? 'Draft Created!' : 'Email Borrower'}
        </button>

        <button
          onClick={copyShareLink}
          className="flex items-center gap-2 px-6 py-3 rounded-[14px] text-sm font-medium transition-all"
          style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-text)' }}
        >
          <Link2 size={16} />
          {copied ? 'Copied!' : 'Copy Share Link'}
        </button>

        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-[14px] text-sm font-medium transition-all"
          style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-text)' }}
        >
          <Save size={16} />
          {saving ? 'Saving...' : scenarioId ? 'Update Scenario' : 'Save Scenario'}
        </button>
      </div>

      {showEmailPanel && (
        <div
          className="w-full max-w-md rounded-[14px] p-4"
          style={{ background: 'var(--sc-surface)', border: '1px solid var(--sc-border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold" style={{ color: 'var(--sc-text)' }}>
              Send Share Link to Borrower
            </p>
            <button onClick={() => setShowEmailPanel(false)}>
              <X size={14} style={{ color: 'var(--sc-muted)' }} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="borrower@email.com"
              value={emailAddress}
              onChange={e => setEmailAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendEmail()}
              className="flex-1 px-3 py-2 rounded-[10px] text-sm outline-none"
              style={{
                background: 'var(--sc-bg)',
                border: '1px solid var(--sc-border)',
                color: 'var(--sc-text)',
              }}
            />
            <button
              onClick={sendEmail}
              disabled={sendingEmail || !emailAddress.trim()}
              className="px-4 py-2 rounded-[10px] text-sm font-semibold transition-all disabled:opacity-40"
              style={{ background: 'var(--sc-accent)', color: '#ffffff' }}
            >
              {sendingEmail ? 'Sending...' : 'Send'}
            </button>
          </div>
          {emailError && (
            <p className="mt-2 text-xs" style={{ color: '#f87171' }}>{emailError}</p>
          )}
          <p className="mt-2 text-[10px]" style={{ color: 'var(--sc-muted)' }}>
            Creates an Outlook draft in your inbox — review and send from there.
          </p>
        </div>
      )}

      {viewCount !== null && (
        <div className="flex items-center gap-2">
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-500"
            style={{
              border: `1px solid ${viewCountJustIncreased ? '#C9A84C' : 'var(--sc-border)'}`,
              color: viewCountJustIncreased ? '#C9A84C' : viewCount > 0 ? '#C9A84C' : 'var(--sc-muted)',
              background: viewCountJustIncreased ? 'rgba(201,168,76,0.1)' : 'transparent',
              fontFamily: "'IBM Plex Mono', monospace",
            }}
          >
            <Eye size={12} />
            {viewCount === 0
              ? 'Not yet viewed'
              : viewCount === 1
                ? '1 view'
                : `${viewCount} views`}
            {viewCountJustIncreased && (
              <span style={{ color: '#C9A84C', marginLeft: 4 }}>↑ Borrower just opened it!</span>
            )}
          </div>
        </div>
      )}

      <p className="text-[10px]" style={{ color: 'var(--sc-muted)' }}>
        Use Ctrl/⌘+P in the PDF window to save as PDF
      </p>
    </div>
  )
}
