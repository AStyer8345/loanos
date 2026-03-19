'use client'

import { useState, useCallback, useRef } from 'react'
import { Home, RefreshCw, ChevronRight, ChevronLeft, Check } from 'lucide-react'
import type {
  ScenarioMode, ScenarioState, PurchaseScenarioInput, RefiScenarioInput,
  CurrentLoanInput, PurchaseCalculatedResult, RefiCalculatedResult,
  ReinvestmentResult, LoanTerm,
} from '@/lib/scenarios/types'
import { DEFAULT_CLOSING_COSTS, ensureClosingCosts, sumClosingCosts } from '@/lib/scenarios/utils'
import { buildPurchaseDisplayData, buildRefiDisplayData } from '@/lib/scenarios/displayData'
import ScenarioCard from './ScenarioCard'
import CurrentLoanCard from './CurrentLoanCard'
import ScenarioSummaryTable from './ScenarioSummaryTable'
import KeyMetricsGrid from './KeyMetricsGrid'
import BreakEvenTable from './BreakEvenTable'
import { MonthlyPaymentChart, TotalInterestChart, CumulativeSavingsChart } from './ScenarioCharts'
import ReinvestmentAnalysis from './ReinvestmentAnalysis'
import NarrativeSection from './NarrativeSection'
import ActionsBar from './ActionsBar'
import MISMOUpload from './MISMOUpload'
import StatementUpload from './StatementUpload'
import { InputField, CurrencyField, PercentField, SelectField } from './FormFields'

export { DEFAULT_CLOSING_COSTS, ensureClosingCosts, sumClosingCosts }

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
  pointsPercent: 0,
  creditsPercent: 0,
  points: 0,
  closingCostBreakdown: { ...DEFAULT_CLOSING_COSTS },
  closingCosts: sumClosingCosts(DEFAULT_CLOSING_COSTS),
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
  const runCalculation = useCallback(async (): Promise<boolean> => {
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
      if (!res.ok) {
        console.error('Calculation API error:', res.status)
        return false
      }
      const data = await res.json()
      if (data.error) {
        console.error('Calculation error:', data.error)
        return false
      }
      if (mode === 'purchase') {
        setPurchaseResults(data.purchaseResults ?? [])
      } else {
        setRefiResults(data.refiResults ?? [])
      }
      if (data.reinvestmentResult) setReinvestmentResult(data.reinvestmentResult)
      // Scroll to results
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 200)
      return true
    } catch (e) {
      console.error('Calculation failed:', e)
      return false
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

  // ─── Wizard Step Management ──────────────────────────────────
  const [step, setStep] = useState(0)
  const STEPS = [
    { label: 'Setup', description: 'Borrower & property info' },
    { label: 'Loan Options', description: mode === 'purchase' ? 'Configure scenarios' : 'Current loan & new options' },
    { label: 'Results', description: 'Compare & export' },
  ]

  const canAdvance = step === 0
    ? (borrowerName.length > 0 || propertyValue > 0) // at least some info entered
    : step === 1
    ? (mode === 'purchase' ? purchaseScenarios.some(s => s.loanAmount > 0) : refiScenarios.some(s => s.newLoanAmount > 0))
    : true

  const goNext = async () => {
    try {
      if (step === 1) {
        // Auto-calculate when advancing from Loan Options to Results
        const success = await runCalculation()
        if (!success) return // Don't advance if calculation failed
      }
      setStep(prev => Math.min(prev + 1, STEPS.length - 1))
    } catch (e) {
      console.error('goNext error:', e)
    }
  }

  const goBack = () => setStep(prev => Math.max(prev - 1, 0))

  return (
    <div className="min-h-screen" style={{ background: 'var(--sc-bg)', color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace" }}>
      <div className="w-full px-5 md:px-8 py-8">

        {/* ─── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              Scenario Builder
            </h1>
          </div>
          <MISMOUpload onImport={(data) => { handleMISMOImport(data); setStep(1) }} />
        </div>

        {/* ─── Step Indicator ─────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <button
                onClick={() => i < step ? setStep(i) : undefined}
                className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm transition-all"
                style={{
                  background: i === step ? 'var(--sc-accent)' : i < step ? 'var(--sc-card)' : 'transparent',
                  color: i === step ? '#ffffff' : i < step ? 'var(--sc-accent)' : 'var(--sc-muted)',
                  border: `1px solid ${i === step ? 'var(--sc-accent)' : i < step ? 'var(--sc-accent)' : 'var(--sc-border)'}`,
                  cursor: i < step ? 'pointer' : 'default',
                }}
              >
                {i < step ? (
                  <Check size={14} />
                ) : (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold"
                    style={{
                      background: i === step ? 'rgba(255,255,255,0.2)' : 'var(--sc-border)',
                      color: i === step ? '#fff' : 'var(--sc-muted)',
                    }}>
                    {i + 1}
                  </span>
                )}
                <span className="font-medium">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight size={14} style={{ color: 'var(--sc-muted)' }} />
              )}
            </div>
          ))}
        </div>

        {/* ═══ Step 0: Setup ════════════════════════════════════════ */}
        {step === 0 && (
          <div className="space-y-6">
            {/* Mode Toggle */}
            <div className="rounded-[14px] p-6" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--sc-muted)' }}>
                Analysis Type
              </label>
              <div className="flex items-center gap-1 p-1.5 rounded-[14px] w-fit" style={{ background: 'var(--sc-bg)', border: '1px solid var(--sc-border)' }}>
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
            </div>

            {/* Borrower Info */}
            <div className="rounded-[14px] p-6" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--sc-muted)' }}>
                Borrower & Property
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <InputField label="Borrower Name" value={borrowerName} onChange={setBorrowerName} placeholder="John & Jane Smith" />
                <InputField label="Property Address" value={propertyAddress} onChange={setPropertyAddress} placeholder="123 Main St, Austin, TX" />
                <CurrencyField label="Estimated Property Value" value={propertyValue} onChange={setPropertyValue} />
              </div>
            </div>
          </div>
        )}

        {/* ═══ Step 1: Loan Options ════════════════════════════════ */}
        {step === 1 && (
          <div>
            {mode === 'purchase' ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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
                          pointsPercent: src.pointsPercent,
                          creditsPercent: src.creditsPercent,
                          points: src.points,
                          propertyTaxes: src.propertyTaxes,
                          homeownersInsurance: src.homeownersInsurance,
                          hoa: src.hoa,
                          pmi: src.pmi,
                          closingCostBreakdown: { ...src.closingCostBreakdown },
                          totalClosingCosts: src.totalClosingCosts,
                          sellerCredits: src.sellerCredits,
                          buydownType: src.buydownType,
                          buydownYearRates: [...src.buydownYearRates],
                          extraMonthlyPayment: src.extraMonthlyPayment,
                        })
                      } : undefined}
                    />
                  ))}
                </div>
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
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
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
                          pointsPercent: src.pointsPercent,
                          creditsPercent: src.creditsPercent,
                          points: src.points,
                          closingCostBreakdown: { ...src.closingCostBreakdown },
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
                </div>
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
          </div>
        )}

        {/* ═══ Step 2: Results ═════════════════════════════════════ */}
        {step === 2 && (
          <div ref={resultsRef}>
            {!hasResults ? (
              <div className="rounded-[14px] p-12 text-center" style={{ background: 'var(--sc-card)', border: '1px solid var(--sc-border)' }}>
                <p className="text-sm mb-4" style={{ color: 'var(--sc-muted)' }}>
                  {calculating ? 'Calculating results...' : 'No results yet. Click Recalculate to generate.'}
                </p>
                {!calculating && (
                  <button
                    onClick={runCalculation}
                    className="px-6 py-2.5 rounded-[10px] text-sm font-semibold"
                    style={{ background: 'var(--sc-accent)', color: '#fff' }}
                  >
                    Calculate
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recalculate button */}
                <div className="flex justify-end">
                  <button
                    onClick={runCalculation}
                    disabled={calculating}
                    className="px-5 py-2 rounded-[10px] text-xs font-semibold transition-all"
                    style={{
                      background: calculating ? 'var(--sc-border)' : 'var(--sc-card)',
                      color: calculating ? 'var(--sc-muted)' : 'var(--sc-accent)',
                      border: '1px solid var(--sc-accent)',
                    }}
                  >
                    {calculating ? 'Calculating...' : '↻ Recalculate'}
                  </button>
                </div>

                {(() => {
                  const displayData = mode === 'purchase'
                    ? buildPurchaseDisplayData(purchaseScenarios, purchaseResults)
                    : buildRefiDisplayData(currentLoan, refiScenarios, refiResults)
                  return (
                    <div className="space-y-5">

                      {/* ── Row 1: Scenario table (left) + Key Metrics (right) ── */}
                      <div className="flex gap-5 items-start">
                        <div className="overflow-x-auto">
                          <ScenarioSummaryTable data={displayData} />
                        </div>
                        <div className="flex-shrink-0 w-72">
                          <KeyMetricsGrid metrics={displayData.keyMetrics} mode={displayData.mode} />
                        </div>
                      </div>

                      {/* ── Row 2: Break-Even Analysis ──────────────────────── */}
                      <BreakEvenTable rows={displayData.breakEvenRows} mode={displayData.mode} />

                      {/* ── Row 3: Total Interest Paid ──────────────────────── */}
                      <TotalInterestChart data={displayData} />

                      {/* ── Row 4: Monthly Payment + Cumulative Savings ─────── */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <MonthlyPaymentChart data={displayData} />
                        <div className="lg:col-span-2">
                          <CumulativeSavingsChart data={displayData} />
                        </div>
                      </div>

                    </div>
                  )
                })()}

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
        )}

        {/* ─── Navigation Buttons ─────────────────────────────────── */}
        <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid var(--sc-border)' }}>
          <button
            onClick={goBack}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all"
            style={{
              border: '1px solid var(--sc-border)',
              color: step === 0 ? 'var(--sc-border)' : 'var(--sc-text)',
              cursor: step === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            <ChevronLeft size={16} />
            Back
          </button>

          <span className="text-xs" style={{ color: 'var(--sc-muted)' }}>
            Step {step + 1} of {STEPS.length} — {STEPS[step].description}
          </span>

          {step < STEPS.length - 1 ? (
            <button
              onClick={goNext}
              disabled={!canAdvance}
              className="flex items-center gap-2 px-6 py-2.5 rounded-[10px] text-sm font-semibold transition-all"
              style={{
                background: canAdvance ? 'var(--sc-accent)' : 'var(--sc-border)',
                color: canAdvance ? '#ffffff' : 'var(--sc-muted)',
                cursor: canAdvance ? 'pointer' : 'not-allowed',
              }}
            >
              {step === 1 ? 'Calculate & Compare' : 'Next'}
              <ChevronRight size={16} />
            </button>
          ) : (
            <div /> // Empty spacer on last step
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Shared Input Components ──────────────────────────────────────
// Imported from FormFields.tsx (above) to break the circular import chain.
// Re-exported here for backward compatibility with page.tsx and [id]/page.tsx.
export { InputField, CurrencyField, PercentField, SelectField }
