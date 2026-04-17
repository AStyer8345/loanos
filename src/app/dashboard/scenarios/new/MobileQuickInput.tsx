'use client'

import { useState, useMemo } from 'react'
import { Zap, Copy, ExternalLink, CheckCircle } from 'lucide-react'
import type { LoanTerm } from '@/lib/scenarios/types'
import { DEFAULT_CLOSING_COSTS, sumClosingCosts } from '@/lib/scenarios/utils'

function makeId() { return globalThis.crypto.randomUUID() }

function calcPI(loanAmount: number, annualRate: number, termYears: number): number {
  if (loanAmount <= 0 || annualRate <= 0 || termYears <= 0) return 0
  const r = annualRate / 100 / 12
  const n = termYears * 12
  return loanAmount * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
}

function fmt(n: number) {
  return n > 0 ? `$${Math.round(n).toLocaleString('en-US')}` : '—'
}

const TERMS: { value: LoanTerm; label: string }[] = [
  { value: 30, label: '30 yr' },
  { value: 20, label: '20 yr' },
  { value: 15, label: '15 yr' },
  { value: 10, label: '10 yr' },
]

export default function MobileQuickInput() {
  const [purchasePrice, setPurchasePrice] = useState(0)
  const [downPct, setDownPct] = useState(20)
  const [rate, setRate] = useState(0)
  const [term, setTerm] = useState<LoanTerm>(30)
  const [isGenerating, setIsGenerating] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loanAmount = useMemo(() => purchasePrice > 0 ? Math.round(purchasePrice * (1 - downPct / 100)) : 0, [purchasePrice, downPct])
  const downAmount = useMemo(() => purchasePrice > 0 ? Math.round(purchasePrice * downPct / 100) : 0, [purchasePrice, downPct])
  const monthlyPI = useMemo(() => calcPI(loanAmount, rate, term), [loanAmount, rate, term])

  const canGenerate = loanAmount > 0 && rate > 0

  const getShareLink = async () => {
    if (!canGenerate) return
    setIsGenerating(true)
    setError(null)
    try {
      const scenario = {
        id: makeId(),
        label: 'Option A',
        loanType: 'conventional' as const,
        purchasePrice,
        downPaymentAmount: downAmount,
        downPaymentPercent: downPct,
        loanAmount,
        interestRate: rate,
        loanTerm: term,
        pointsPercent: 0,
        creditsPercent: 0,
        points: 0,
        propertyTaxes: 0,
        homeownersInsurance: 0,
        hoa: 0,
        pmi: 0,
        closingCostBreakdown: { ...DEFAULT_CLOSING_COSTS },
        totalClosingCosts: sumClosingCosts(DEFAULT_CLOSING_COSTS),
        sellerCredits: 0,
        buydownType: 'none' as const,
        buydownYearRates: [],
        extraMonthlyPayment: 0,
      }

      // Calculate
      const calcRes = await fetch('/api/scenarios/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'purchase',
          propertyValue: purchasePrice,
          purchaseScenarios: [scenario],
          currentLoan: null,
          refiScenarios: [],
          reinvestment: { returnRate: 7, horizonYears: 10 },
        }),
      })
      if (!calcRes.ok) throw new Error('Calculation failed')
      const calcData = await calcRes.json() as { purchaseResults?: unknown[] }
      const purchaseResults = calcData.purchaseResults ?? []

      // Save
      const saveRes = await fetch('/api/scenarios/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario_type: 'purchase',
          borrower_name: '',
          property_address: '',
          property_value: purchasePrice,
          current_loan_data: null,
          scenarios_data: [scenario],
          results_data: purchaseResults,
          narrative: '',
          narrative_edited: false,
          reinvestment_data: null,
        }),
      })
      if (!saveRes.ok) throw new Error('Save failed')
      const saveData = await saveRes.json() as { id?: string; share_token?: string }
      if (!saveData.share_token) throw new Error('No share token')

      const link = `${window.location.origin}/share/${saveData.share_token}`
      setShareLink(link)

      // Fire-and-forget Q&A generation
      fetch('/api/scenarios/generate-qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: saveData.id }),
      }).catch(() => { /* best-effort */ })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyLink = async () => {
    if (!shareLink) return
    await navigator.clipboard.writeText(shareLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const reset = () => {
    setShareLink(null)
    setCopied(false)
    setError(null)
  }

  return (
    <div
      className="md:hidden mb-6 rounded-[16px] p-5"
      style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex items-center justify-center w-7 h-7 rounded-lg"
          style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.3)' }}
        >
          <Zap size={14} style={{ color: '#C9A84C' }} />
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}>
            Quick Mode
          </p>
          <p className="text-[10px]" style={{ color: 'var(--sc-muted)' }}>
            Get a share link in 10 seconds
          </p>
        </div>
      </div>

      {!shareLink ? (
        <>
          {/* 2×2 input grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* Purchase Price */}
            <div>
              <label className="block text-[10px] font-medium mb-1.5" style={{ color: 'var(--sc-muted)' }}>
                Purchase Price
              </label>
              <div className="relative">
                <span
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--sc-muted)' }}
                >$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={purchasePrice > 0 ? purchasePrice.toLocaleString('en-US') : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    setPurchasePrice(parseInt(raw) || 0)
                    setShareLink(null)
                  }}
                  placeholder="450,000"
                  className="w-full pl-6 pr-2.5 py-2.5 rounded-[10px] text-sm border outline-none"
                  style={{
                    borderColor: 'var(--sc-border)',
                    color: 'var(--sc-text)',
                    background: 'var(--sc-bg)',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                />
              </div>
            </div>

            {/* Down Payment % */}
            <div>
              <label className="block text-[10px] font-medium mb-1.5" style={{ color: 'var(--sc-muted)' }}>
                Down Payment
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={downPct > 0 ? String(downPct) : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '')
                    setDownPct(parseFloat(raw) || 0)
                    setShareLink(null)
                  }}
                  placeholder="20"
                  className="w-full pl-2.5 pr-6 py-2.5 rounded-[10px] text-sm border outline-none"
                  style={{
                    borderColor: 'var(--sc-border)',
                    color: 'var(--sc-text)',
                    background: 'var(--sc-bg)',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                />
                <span
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--sc-muted)' }}
                >%</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-[10px] font-medium mb-1.5" style={{ color: 'var(--sc-muted)' }}>
                Rate
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={rate > 0 ? String(rate) : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^0-9.]/g, '')
                    setRate(parseFloat(raw) || 0)
                    setShareLink(null)
                  }}
                  placeholder="6.875"
                  className="w-full pl-2.5 pr-6 py-2.5 rounded-[10px] text-sm border outline-none"
                  style={{
                    borderColor: 'var(--sc-border)',
                    color: 'var(--sc-text)',
                    background: 'var(--sc-bg)',
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                />
                <span
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--sc-muted)' }}
                >%</span>
              </div>
            </div>

            {/* Term */}
            <div>
              <label className="block text-[10px] font-medium mb-1.5" style={{ color: 'var(--sc-muted)' }}>
                Term
              </label>
              <div className="flex items-center gap-1">
                {TERMS.map(t => (
                  <button
                    key={t.value}
                    onClick={() => { setTerm(t.value); setShareLink(null) }}
                    className="flex-1 py-2.5 rounded-[8px] text-[11px] font-medium transition-all"
                    style={{
                      background: term === t.value ? 'rgba(201,168,76,0.15)' : 'var(--sc-bg)',
                      border: `1px solid ${term === t.value ? 'rgba(201,168,76,0.5)' : 'var(--sc-border)'}`,
                      color: term === t.value ? '#C9A84C' : 'var(--sc-muted)',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live P&I preview */}
          {monthlyPI > 0 && (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-[10px] mb-3"
              style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}
            >
              <span className="text-[11px]" style={{ color: 'var(--sc-muted)' }}>
                Est. P&amp;I
              </span>
              <span
                className="text-base font-bold"
                style={{ color: '#C9A84C', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                {fmt(monthlyPI)}/mo
              </span>
            </div>
          )}

          {/* Loan summary (only when inputs filled) */}
          {loanAmount > 0 && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px]" style={{ color: 'var(--sc-muted)' }}>
                Loan: {fmt(loanAmount)} · Down: {fmt(downAmount)}
              </span>
            </div>
          )}

          {error && (
            <p className="text-[11px] mb-3" style={{ color: '#f87171' }}>{error}</p>
          )}

          {/* CTA */}
          <button
            onClick={getShareLink}
            disabled={!canGenerate || isGenerating}
            className="w-full py-3 rounded-[12px] text-sm font-semibold transition-all disabled:opacity-40"
            style={{ background: '#C9A84C', color: '#000000' }}
          >
            {isGenerating ? 'Generating...' : '⚡ Get Share Link'}
          </button>
        </>
      ) : (
        /* Success state */
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} style={{ color: '#4ade80' }} />
            <span className="text-sm font-semibold" style={{ color: '#4ade80' }}>
              Share link ready!
            </span>
          </div>

          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] mb-3"
            style={{ background: 'var(--sc-bg)', border: '1px solid var(--sc-border)' }}
          >
            <span
              className="flex-1 text-xs truncate"
              style={{ color: 'var(--sc-muted)', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {shareLink}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-sm font-semibold transition-all"
              style={{ background: '#C9A84C', color: '#000000' }}
            >
              {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            <a
              href={shareLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-[10px] text-sm font-medium transition-all"
              style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-text)' }}
            >
              <ExternalLink size={14} />
              View
            </a>
            <button
              onClick={reset}
              className="px-3 py-2.5 rounded-[10px] text-xs transition-all"
              style={{ border: '1px solid var(--sc-border)', color: 'var(--sc-muted)' }}
            >
              New
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
