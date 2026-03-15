'use client'

import { useState, useCallback, useRef } from 'react'
import { Home, RefreshCw } from 'lucide-react'
import type {
  ScenarioMode, ScenarioState, PurchaseScenarioInput, RefiScenarioInput,
  CurrentLoanInput, PurchaseCalculatedResult, RefiCalculatedResult,
  ReinvestmentResult, LoanTerm,
} from '@/lib/scenarios/types'
import ScenarioCard from './ScenarioCard'
import CurrentLoanCard from './CurrentLoanCard'
import ResultsTable from './ResultsTable'
import ScenarioCharts from './ScenarioCharts'
import ReinvestmentAnalysis from './ReinvestmentAnalysis'
import NarrativeSection from './NarrativeSection'
import ActionsBar from './ActionsBar'
import MISMOUpload from './MISMOUpload'
import StatementUpload from './StatementUpload'

function makeId() { return crypto.randomUUID() }

const DEFAULT_PURCHASE: () => PurchaseScenarioInput = () => ({
  id: makeId(),
  label: '',
  loanType: 'conventional',
  purchasePrice: 0,
  downPaymentAmount: 0,
  downPaymentPercent: 20,
  loanAmount: 0,
  interestRate: 0,
  loanTerm: 30 as LoanTerm,
  points: 0,
  propertyTaxes: 0,
  homeownersInsurance: 0,
  hoa: 0,
  pmi: 0,
  totalClosingCosts: 0,
  sellerCredits: 0,
  buydownType: 'none',
  buydownYearRates: [],
  extraMonthlyPayment: 0,
})

const DEFAULT_REFI: () => RefiScenarioInput = () => ({
  id: makeId(),
  label: '',
  loanType: 'conventional',
  newLoanAmount: 0,
  interestRate: 0,
  loanTerm: 30 as LoanTerm,
  points: 0,
  closingCosts: 0,
  cashOutAmount: 0,
  payOffDebts: false,
  propertyTaxes: 0,
  insurance: 0,
  hoa: 0,
  pmi: 0,
  extraMonthlyPayment: 0,
})

const DEFAULT_CURRENT_LOAN: CurrentLoanInput = {
  originalLoanAmount: 0,
  loanStartDate: '',
  originalLoanTerm: 30 as LoanTerm,
  interestRate: 0,
  currentMonthlyPI: 0,
  currentPayoffBalance: 0,
  propertyTaxes: 0,
  insurance: 0,
  hoa: 0,
  pmi: 0,
  debts: [],
}

export default function ScenarioBuilder({ initialState }: { initialState?: Partial<ScenarioState> }) {
  const [mode, setMode] = useState<ScenarioMode>(initialState?.mode ?? 'purchase')
  const [borrowerName, setBorrowerName] = useState(initialState?.borrowerName ?? '')
  const [propertyAddress, setPropertyAddress] = useState(initialState?.propertyAddress ?? '')
  const [propertyValue, setPropertyValue] = useState(initialState?.propertyValue ?? 0)

  // Purchase
  const [purchaseScenarios, setPurchaseScenarios] = useState<PurchaseScenarioInput[]>(
    initialState?.purchaseScenarios ?? [
      { ...DEFAULT_PURCHASE(), label: 'Option A' },
      { ...DEFAULT_PURCHASE(), label: 'Option B' },
    ]
  )
  const [purchaseResults, setPurchaseResults] = useState<PurchaseCalculatedResult[]>([])

  // Refinance
  const [currentLoan, setCurrentLoan] = useState<CurrentLoanInput>(initialState?.currentLoan ?? { ...DEFAULT_CURRENT_LOAN })
  const [refiScenarios, setRefiScenarios] = useState<RefiScenarioInput[]>(
    initialState?.refiScenarios ?? [{ ...DEFAULT_REFI(), label: 'New Loan Option' }]
  )
  const [refiResults, setRefiResults] = useState<RefiCalculatedResult[]>([])

  // Shared
  const [narrative, setNarrative] = useState(initialState?.narrative ?? '')
  const [narrativeEdited, setNarrativeEdited] = useState(false)
  const [reinvestmentSettings, setReinvestmentSettings] = useState({ returnRate: 7, horizonYears: 10 })
  const [reinvestmentResult, setReinvestmentResult] = useState<ReinvestmentResult | null>(null)
  const [calculating, setCalculating] = useState(false)
  const [scenarioId, setScenarioId] = useState<string | null>(null)

  const resultsRef = useRef<HTMLDivElement>(null)

  // ─── Calculation ────────────────────────────────────────────────
  const runCalculation = useCallback(async () => {
    setCalculating(true)
    try {
      const res = await fetch('/api/scenarios/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          propertyValue,
          purchaseScenarios: mode === 'purchase' ? purchaseScenarios : [],
          currentLoan: mode === 'refinance' ? currentLoan : null,
          refiScenarios: mode === 'refinance' ? refiScenarios : [],
          reinvestment: reinvestmentSettings,
        }),
      })
      const data = await res.json()
      if (mode === 'purchase') {
        setPurchaseResults(data.purchaseResults ?? [])
      } else {
        setRefiResults(data.refiResults ?? [])
      }
      if (data.reinvestmentResult) setReinvestmentResult(data.reinvestmentResult)
      // Scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
    } catch (e) {
      console.error('Calculation failed:', e)
    } finally {
      setCalculating(false)
    }
  }, [mode, propertyValue, purchaseScenarios, currentLoan, refiScenarios, reinvestmentSettings])

  // ─── Purchase scenario management ──────────────────────────────
  const updatePurchaseScenario = (idx: number, updates: Partial<PurchaseScenarioInput>) => {
    setPurchaseScenarios(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s))
  }

  const addPurchaseScenario = () => {
    if (purchaseScenarios.length >= 4) return
    const labels = ['Option A', 'Option B', 'Option C', 'Option D']
    setPurchaseScenarios(prev => [...prev, { ...DEFAULT_PURCHASE(), label: labels[prev.length] || `Option ${prev.length + 1}` }])
  }

  const removePurchaseScenario = (idx: number) => {
    if (purchaseScenarios.length <= 2) return
    setPurchaseScenarios(prev => prev.filter((_, i) => i !== idx))
  }

  // ─── Refi scenario management ──────────────────────────────────
  const updateRefiScenario = (idx: number, updates: Partial<RefiScenarioInput>) => {
    setRefiScenarios(prev => prev.map((s, i) => i === idx ? { ...s, ...updates } : s))
  }

  const addRefiScenario = () => {
    if (refiScenarios.length >= 3) return
    setRefiScenarios(prev => [...prev, { ...DEFAULT_REFI(), label: `Option ${prev.length + 1}` }])
  }

  const removeRefiScenario = (idx: number) => {
    if (refiScenarios.length <= 1) return
    setRefiScenarios(prev => prev.filter((_, i) => i !== idx))
  }

  // ─── MISMO import handler ──────────────────────────────────────
  const handleMISMOImport = (data: Record<string, unknown>) => {
    if (mode === 'purchase' && purchaseScenarios.length > 0) {
      updatePurchaseScenario(0, {
        purchasePrice: (data.purchasePrice as number) || 0,
        loanAmount: (data.loanAmount as number) || 0,
        interestRate: (data.interestRate as number) || 0,
        loanTerm: (data.loanTerm as LoanTerm) || 30,
        propertyTaxes: (data.propertyTaxes as number) || 0,
        homeownersInsurance: (data.insurance as number) || 0,
      })
    }
    if (data.borrowerName) setBorrowerName(data.borrowerName as string)
    if (data.propertyAddress) setPropertyAddress(data.propertyAddress as string)
    if (data.purchasePrice) setPropertyValue(data.purchasePrice as number)
  }

  // ─── Mortgage statement import handler ────────────────────────
  const handleStatementImport = (data: Partial<CurrentLoanInput> & { borrowerName?: string; propertyAddress?: string }) => {
    const { borrowerName: name, propertyAddress: addr, ...loanUpdates } = data
    setCurrentLoan(prev => ({ ...prev, ...loanUpdates }))
    if (name) setBorrowerName(name)
    if (addr) setPropertyAddress(addr)
  }

  const hasResults = mode === 'purchase' ? purchaseResults.length > 0 : refiResults.length > 0

  return (
    <div className="min-h-screen" style={{ background: 'var(--sc-bg)', color: 'var(--sc-text)', fontFamily: "'Inter', sans-serif" }}>
      <div className="max-w-[1600px] mx-auto px-5 md:px-8 py-8">

        {/* ─── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              Scenario Builder
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--sc-muted)' }}>
              Compare loan options side by side
            </p>
          </div>
          <MISMOUpload onImport={handleMISMOImport} />
        </div>

        {/* ─── Mode Toggle ───────────────────────────────────────── */}
        <div className="flex items-center gap-1 p-1.5 rounded-[14px] w-fit mb-8" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
          <button
            onClick={() => setMode('purchase')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: mode === 'purchase' ? 'var(--sc-accent)' : 'transparent',
              color: mode === 'purchase' ? '#ffffff' : 'var(--sc-muted)',
            }}
          >
            <Home size={16} />
            Purchase
          </button>
          <button
            onClick={() => setMode('refinance')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all"
            style={{
              background: mode === 'refinance' ? 'var(--sc-accent)' : 'transparent',
              color: mode === 'refinance' ? '#ffffff' : 'var(--sc-muted)',
            }}
          >
            <RefreshCw size={16} />
            Refinance
          </button>
        </div>

        {/* ─── Borrower Info Row ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <InputField label="Borrower Name" value={borrowerName} onChange={setBorrowerName} placeholder="John & Jane Smith" />
          <InputField label="Property Address" value={propertyAddress} onChange={setPropertyAddress} placeholder="123 Main St, Austin, TX" />
          <CurrencyField label="Estimated Property Value" value={propertyValue} onChange={setPropertyValue} />
        </div>

        {/* ═══ Side-by-Side Layout ═══════════════════════════════════ */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8">

          {/* ─── LEFT: Scenario Inputs ─────────────────────────────── */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--sc-muted)' }}>
              Loan Options
            </h2>

            {mode === 'purchase' ? (
              <div className="space-y-5">
                {purchaseScenarios.map((s, i) => (
                  <ScenarioCard
                    key={s.id}
                    scenario={s}
                    index={i}
                    propertyValue={propertyValue}
                    canRemove={purchaseScenarios.length > 2}
                    onUpdate={(updates) => updatePurchaseScenario(i, updates)}
                    onRemove={() => removePurchaseScenario(i)}
                    copySource={i > 0 ? purchaseScenarios[0] : null}
                    onCopyFrom={i > 0 ? () => {
                      const src = purchaseScenarios[0]
                      updatePurchaseScenario(i, {
                        loanType: src.loanType,
                        purchasePrice: src.purchasePrice,
                        downPaymentAmount: src.downPaymentAmount,
                        downPaymentPercent: src.downPaymentPercent,
                        loanAmount: src.loanAmount,
                        interestRate: src.interestRate,
                        loanTerm: src.loanTerm,
                        points: src.points,
                        propertyTaxes: src.propertyTaxes,
                        homeownersInsurance: src.homeownersInsurance,
                        hoa: src.hoa,
                        pmi: src.pmi,
                        totalClosingCosts: src.totalClosingCosts,
                        sellerCredits: src.sellerCredits,
                        buydownType: src.buydownType,
                        buydownYearRates: [...src.buydownYearRates],
                        extraMonthlyPayment: src.extraMonthlyPayment,
                      })
                    } : undefined}
                  />
                ))}
                {purchaseScenarios.length < 4 && (
                  <button
                    onClick={addPurchaseScenario}
                    className="w-full py-3 rounded-[14px] text-sm font-medium border border-dashed transition-colors hover:border-solid"
                    style={{ borderColor: 'var(--sc-accent)', color: 'var(--sc-accent)' }}
                  >
                    + Add Option
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium" style={{ color: 'var(--sc-muted)' }}>Current Loan</span>
                    <StatementUpload onImport={handleStatementImport} />
                  </div>
                  <CurrentLoanCard
                    currentLoan={currentLoan}
                    onUpdate={(updates) => setCurrentLoan(prev => ({ ...prev, ...updates }))}
                  />
                </div>
                {refiScenarios.map((s, i) => (
                  <ScenarioCard
                    key={s.id}
                    refiScenario={s}
                    index={i}
                    propertyValue={propertyValue}
                    canRemove={refiScenarios.length > 1}
                    currentLoan={currentLoan}
                    onUpdateRefi={(updates) => updateRefiScenario(i, updates)}
                    onRemove={() => removeRefiScenario(i)}
                    isRefi
                    copySource={i > 0 ? refiScenarios[0] : null}
                    onCopyFrom={i > 0 ? () => {
                      const src = refiScenarios[0]
                      updateRefiScenario(i, {
                        loanType: src.loanType,
                        newLoanAmount: src.newLoanAmount,
                        interestRate: src.interestRate,
                        loanTerm: src.loanTerm,
                        points: src.points,
                        closingCosts: src.closingCosts,
                        cashOutAmount: src.cashOutAmount,
                        payOffDebts: src.payOffDebts,
                        propertyTaxes: src.propertyTaxes,
                        insurance: src.insurance,
                        hoa: src.hoa,
                        pmi: src.pmi,
                        extraMonthlyPayment: src.extraMonthlyPayment,
                      })
                    } : undefined}
                  />
                ))}
                {refiScenarios.length < 3 && (
                  <button
                    onClick={addRefiScenario}
                    className="w-full py-3 rounded-[14px] text-sm font-medium border border-dashed transition-colors hover:border-solid"
                    style={{ borderColor: 'var(--sc-accent)', color: 'var(--sc-accent)' }}
                  >
                    + Add Option
                  </button>
                )}
              </div>
            )}

            {/* ─── Calculate Button ─────────────────────────────────── */}
            <div className="mt-6">
              <button
                onClick={runCalculation}
                disabled={calculating}
                className="w-full py-3.5 rounded-[14px] text-sm font-semibold transition-all"
                style={{
                  background: calculating ? 'var(--sc-border)' : 'var(--sc-accent)',
                  color: calculating ? 'var(--sc-muted)' : '#ffffff',
                }}
              >
                {calculating ? 'Calculating...' : 'Calculate & Compare'}
              </button>
            </div>
          </div>

          {/* ─── RIGHT: Results Panel ──────────────────────────────── */}
          <div ref={resultsRef}>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--sc-muted)' }}>
              Results
            </h2>

            {!hasResults ? (
              <div className="rounded-[14px] p-12 text-center" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
                <p className="text-sm" style={{ color: 'var(--sc-muted)' }}>
                  Enter loan options and click Calculate to see results
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <ResultsTable
                  mode={mode}
                  purchaseScenarios={purchaseScenarios}
                  purchaseResults={purchaseResults}
                  refiScenarios={refiScenarios}
                  refiResults={refiResults}
                />

                <ScenarioCharts
                  mode={mode}
                  purchaseScenarios={purchaseScenarios}
                  purchaseResults={purchaseResults}
                  refiScenarios={refiScenarios}
                  refiResults={refiResults}
                />

                <ReinvestmentAnalysis
                  mode={mode}
                  purchaseResults={purchaseResults}
                  refiResults={refiResults}
                  settings={reinvestmentSettings}
                  result={reinvestmentResult}
                  onSettingsChange={setReinvestmentSettings}
                  onRecalculate={runCalculation}
                />

                <NarrativeSection
                  mode={mode}
                  narrative={narrative}
                  narrativeEdited={narrativeEdited}
                  purchaseScenarios={purchaseScenarios}
                  purchaseResults={purchaseResults}
                  refiScenarios={refiScenarios}
                  refiResults={refiResults}
                  currentLoan={currentLoan}
                  reinvestmentResult={reinvestmentResult}
                  borrowerName={borrowerName}
                  onNarrativeChange={(text) => { setNarrative(text); setNarrativeEdited(true) }}
                  onNarrativeGenerated={setNarrative}
                />

                <ActionsBar
                  mode={mode}
                  borrowerName={borrowerName}
                  propertyAddress={propertyAddress}
                  propertyValue={propertyValue}
                  purchaseScenarios={purchaseScenarios}
                  purchaseResults={purchaseResults}
                  refiScenarios={refiScenarios}
                  refiResults={refiResults}
                  currentLoan={currentLoan}
                  narrative={narrative}
                  narrativeEdited={narrativeEdited}
                  reinvestmentResult={reinvestmentResult}
                  scenarioId={scenarioId}
                  onSaved={setScenarioId}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Shared Input Components ──────────────────────────────────────

export function InputField({ label, value, onChange, placeholder, className }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; className?: string
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--sc-muted)' }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-[10px] text-sm border outline-none focus:ring-1"
        style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-bg)', fontFamily: "'Inter', sans-serif" }}
      />
    </div>
  )
}

export function CurrencyField({ label, value, onChange, className, readOnly, accent }: {
  label: string; value: number; onChange: (v: number) => void; className?: string; readOnly?: boolean; accent?: string
}) {
  const display = value > 0 ? value.toLocaleString('en-US') : ''
  return (
    <div className={className}>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--sc-muted)' }}>{label}</label>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--sc-muted)' }}>$</span>
        <input
          type="text"
          value={display}
          readOnly={readOnly}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9.]/g, '')
            onChange(parseFloat(raw) || 0)
          }}
          className="w-full pl-8 pr-3.5 py-2.5 rounded-[10px] text-sm border outline-none focus:ring-1"
          style={{
            borderColor: 'var(--sc-border)',
            color: accent || 'var(--sc-text)',
            background: readOnly ? 'var(--sc-card)' : 'var(--sc-bg)',
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        />
      </div>
    </div>
  )
}

export function PercentField({ label, value, onChange, decimals = 3 }: {
  label: string; value: number; onChange: (v: number) => void; decimals?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--sc-muted)' }}>{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value > 0 ? value.toFixed(decimals) : ''}
          onChange={e => {
            const raw = e.target.value.replace(/[^0-9.]/g, '')
            onChange(parseFloat(raw) || 0)
          }}
          className="w-full px-3.5 py-2.5 rounded-[10px] text-sm border outline-none focus:ring-1 pr-8"
          style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-bg)', fontFamily: "'IBM Plex Mono', monospace" }}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--sc-muted)' }}>%</span>
      </div>
    </div>
  )
}

export function SelectField({ label, value, onChange, options }: {
  label: string; value: string | number; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-2" style={{ color: 'var(--sc-muted)' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3.5 py-2.5 rounded-[10px] text-sm border outline-none"
        style={{ borderColor: 'var(--sc-border)', color: 'var(--sc-text)', background: 'var(--sc-card)', fontFamily: "'Inter', sans-serif" }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}
