'use client'

import { useState, useEffect } from 'react'
import { buildPurchaseDisplayData, buildRefiDisplayData } from '@/lib/scenarios/displayData'
import type { DisplayData, ScenarioDisplayRow } from '@/lib/scenarios/displayData'
import {
  calculatePurchaseScenario,
  calculateCurrentLoan,
  calculateRefiScenario,
} from '@/lib/scenarios/calculations'
import type { PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput } from '@/lib/scenarios/types'
import ScenarioSummaryTable from '@/app/dashboard/scenarios/new/ScenarioSummaryTable'
import KeyMetricsGrid from '@/app/dashboard/scenarios/new/KeyMetricsGrid'
import BreakEvenTable from '@/app/dashboard/scenarios/new/BreakEvenTable'
import ScenarioCharts from '@/app/dashboard/scenarios/new/ScenarioCharts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>

interface SharedScenario {
  scenario_type: string
  borrower_name: string | null
  property_address: string | null
  property_value: number | null
  current_loan_data: AnyObj | null
  scenarios_data: AnyObj[]
  narrative: string | null
  created_at: string
}

// CSS variable values for the dark share-page theme
const DARK_THEME = {
  '--sc-bg': 'var(--bg)',
  '--sc-card': '#141414',
  '--sc-card-alt': '#111111',
  '--sc-border': '#262626',
  '--sc-text': '#F0EDE8',
  '--sc-muted': '#888888',
  '--sc-accent': '#C9A84C',
} as React.CSSProperties

const GOLD = '#C9A84C'
const TEXT = '#F0EDE8'
const MUTED = '#888888'
const CARD_BG = '#141414'
const BORDER = '#262626'
const BG = 'var(--bg)'

function buildDisplayData(data: SharedScenario): DisplayData {
  const propertyValue = data.property_value || 0
  if (data.scenario_type === 'purchase') {
    const inputs = data.scenarios_data as unknown as PurchaseScenarioInput[]
    const results = inputs.map(input => calculatePurchaseScenario(input, propertyValue))
    return buildPurchaseDisplayData(inputs, results)
  } else {
    const currentLoan = data.current_loan_data as unknown as CurrentLoanInput
    const currentCalc = calculateCurrentLoan(currentLoan)
    const inputs = data.scenarios_data as unknown as RefiScenarioInput[]
    const results = inputs.map(input => calculateRefiScenario(input, currentLoan, currentCalc, propertyValue))
    return buildRefiDisplayData(currentLoan, inputs, results)
  }
}

function fmt(n: number) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtCurrency(n: number) {
  return `$${fmt(n)}`
}

// ─── Hero stat derivation ───────────────────────────────────────────
function getHeroStat(displayData: DisplayData): { label: string; value: string; sublabel?: string } {
  if (displayData.mode === 'purchase') {
    const lowestPayment = Math.min(...displayData.rows.map(r => r.totalMonthlyPayment).filter(p => p > 0))
    if (lowestPayment > 0) {
      const bestRow = displayData.rows.find(r => r.totalMonthlyPayment === lowestPayment)
      return {
        label: 'Starting At',
        value: `${fmtCurrency(lowestPayment)}/mo`,
        sublabel: bestRow ? `${bestRow.label} — lowest all-in payment` : undefined,
      }
    }
    return { label: 'Loan Analysis Ready', value: 'See details below' }
  } else {
    const savings = displayData.keyMetrics.monthlySavings
    if (savings > 0) {
      return {
        label: 'Monthly Savings',
        value: `${fmtCurrency(savings)}/mo`,
        sublabel: `${fmtCurrency(savings * 12)}/yr · ${fmtCurrency(savings * 60)} over 5 years`,
      }
    }
    const lowestPayment = Math.min(...displayData.rows.map(r => r.totalMonthlyPayment).filter(p => p > 0))
    if (lowestPayment > 0) {
      return { label: 'New Monthly Payment', value: `${fmtCurrency(lowestPayment)}/mo` }
    }
    return { label: 'Refinance Analysis Ready', value: 'See details below' }
  }
}

// ─── Summary stat cards ─────────────────────────────────────────────
interface StatCard {
  label: string
  value: string
  sub?: string
}

function getSummaryStats(displayData: DisplayData): StatCard[] {
  if (displayData.mode === 'purchase') {
    const rows = displayData.rows.filter(r => r.totalMonthlyPayment > 0)
    const lowestPayment = rows.length ? rows.reduce((a, b) => a.totalMonthlyPayment < b.totalMonthlyPayment ? a : b) : null
    const lowestCash = rows.length ? rows.reduce((a, b) => a.cashToClose < b.cashToClose ? a : b) : null
    const lowest15yr = rows.length ? rows.reduce((a, b) => a.totalInterest < b.totalInterest ? a : b) : null
    const stats: StatCard[] = []
    if (lowestPayment) stats.push({ label: 'Lowest Monthly', value: fmtCurrency(lowestPayment.totalMonthlyPayment), sub: lowestPayment.label })
    if (lowestCash) stats.push({ label: 'Lowest Cash to Close', value: fmtCurrency(lowestCash.cashToClose), sub: lowestCash.label })
    if (lowest15yr) stats.push({ label: '15-Year Interest', value: fmtCurrency(lowest15yr.totalInterest), sub: `${lowest15yr.label} — least paid` })
    return stats
  } else {
    const stats: StatCard[] = []
    const savings = displayData.keyMetrics.monthlySavings
    if (savings > 0) stats.push({ label: 'Monthly Savings', value: fmtCurrency(savings), sub: 'vs current payment' })
    const savings5yr = displayData.keyMetrics.savings5yr
    if (savings5yr > 0) stats.push({ label: '5-Year Savings', value: fmtCurrency(savings5yr) })
    // Find best break-even
    const bestBE = displayData.breakEvenRows.length
      ? displayData.breakEvenRows.reduce((a, b) => a.breakEvenMonths < b.breakEvenMonths ? a : b)
      : null
    if (bestBE && bestBE.breakEvenMonths > 0) {
      stats.push({ label: 'Break-Even', value: `${bestBE.breakEvenMonths} mo`, sub: `~${bestBE.breakEvenYears.toFixed(1)} years` })
    }
    return stats
  }
}

// ─── Narrative renderer ─────────────────────────────────────────────
function NarrativeBlock({ text }: { text: string }) {
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
  if (!paragraphs.length) return null

  return (
    <div>
      {paragraphs.map((para, i) => {
        if (i === 0) {
          // First paragraph: lede sentence gets gold emphasis
          const dotIdx = para.indexOf('.')
          const lede = dotIdx > -1 ? para.slice(0, dotIdx + 1) : para
          const rest = dotIdx > -1 ? para.slice(dotIdx + 1).trim() : ''
          return (
            <p key={i} className="text-sm leading-relaxed mb-4" style={{ color: TEXT }}>
              <span className="font-semibold" style={{ color: GOLD }}>{lede}</span>
              {rest ? ` ${rest}` : ''}
            </p>
          )
        }
        return (
          <p key={i} className="text-sm leading-relaxed mb-4" style={{ color: `${TEXT}CC` }}>
            {para}
          </p>
        )
      })}
    </div>
  )
}

// ─── Summary stat card ──────────────────────────────────────────────
function SummaryCard({ label, value, sub }: StatCard) {
  return (
    <div
      className="rounded-[12px] p-4"
      style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: MUTED }}>{label}</p>
      <p className="text-xl font-bold" style={{ color: GOLD, fontFamily: "'IBM Plex Mono', monospace" }}>{value}</p>
      {sub && <p className="text-[10px] mt-1" style={{ color: MUTED }}>{sub}</p>}
    </div>
  )
}

// ─── Section header ─────────────────────────────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <h2
      className="text-[10px] font-semibold uppercase tracking-widest mb-3"
      style={{ color: GOLD }}
    >
      {title}
    </h2>
  )
}

// ─── Recommended badge ───────────────────────────────────────────────
function getRecommendedLabel(rows: ScenarioDisplayRow[]): string | null {
  const rec = rows.find(r => r.isRecommended)
  return rec ? rec.label : null
}

export default function SharePage({ params }: { params: { token: string } }) {
  const [data, setData] = useState<SharedScenario | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/share/${params.token}`)
      .then(res => {
        if (res.status === 410) throw new Error('This share link has expired.')
        if (res.status === 404) throw new Error('Scenario not found.')
        if (!res.ok) throw new Error('Failed to load scenario.')
        return res.json()
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [params.token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG, color: `${TEXT}60` }}>
        <div className="text-center">
          <div
            className="w-6 h-6 border-2 rounded-full mx-auto mb-3 animate-spin"
            style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }}
          />
          <p className="text-xs" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Loading analysis…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <div className="text-center px-6">
          <p className="text-sm mb-2" style={{ color: '#C94C4C' }}>{error}</p>
          <p className="text-xs" style={{ color: MUTED }}>Contact your loan officer for assistance.</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const displayData = buildDisplayData(data)
  const mode = data.scenario_type === 'purchase' ? 'purchase' : 'refinance'
  const heroStat = getHeroStat(displayData)
  const summaryStats = getSummaryStats(displayData)
  const recommendedLabel = getRecommendedLabel(displayData.rows)
  const borrowerFirst = data.borrower_name ? data.borrower_name.split(' ')[0] : null

  return (
    <div className="min-h-screen" style={{ background: BG, color: TEXT, fontFamily: "'IBM Plex Sans', sans-serif" }}>

      {/* ── Hero Section ───────────────────────────────────────── */}
      <div style={{ background: '#0d0d0d', borderBottom: `1px solid ${BORDER}` }}>
        <div className="max-w-2xl mx-auto px-4 py-10 sm:py-14">

          {/* Mode badge */}
          <div className="mb-4">
            <span
              className="text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: `${GOLD}18`, color: GOLD, border: `1px solid ${GOLD}40` }}
            >
              {mode === 'purchase' ? 'Purchase Analysis' : 'Refinance Analysis'}
            </span>
          </div>

          {/* Borrower name / greeting */}
          {borrowerFirst ? (
            <h1 className="text-2xl sm:text-3xl font-semibold mb-1" style={{ color: TEXT }}>
              {borrowerFirst}&rsquo;s Loan Options
            </h1>
          ) : (
            <h1 className="text-2xl sm:text-3xl font-semibold mb-1" style={{ color: TEXT }}>
              Your Loan Analysis
            </h1>
          )}

          {/* Property address */}
          {data.property_address && (
            <p className="text-sm mb-6" style={{ color: MUTED }}>{data.property_address}</p>
          )}
          {!data.property_address && <div className="mb-6" />}

          {/* Hero stat */}
          {heroStat.value !== 'See details below' && (
            <div
              className="inline-block rounded-[14px] px-5 py-4"
              style={{ background: `${GOLD}10`, border: `1px solid ${GOLD}30` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: `${GOLD}90` }}>
                {heroStat.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: GOLD, fontFamily: "'IBM Plex Mono', monospace" }}>
                {heroStat.value}
              </p>
              {heroStat.sublabel && (
                <p className="text-xs mt-1" style={{ color: MUTED }}>{heroStat.sublabel}</p>
              )}
            </div>
          )}

          {/* Recommended label if available */}
          {recommendedLabel && mode === 'purchase' && (
            <p className="text-xs mt-3" style={{ color: MUTED }}>
              Recommended option: <span style={{ color: GOLD }}>{recommendedLabel}</span>
            </p>
          )}

        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10 space-y-10">

        {/* Summary stat bar */}
        {summaryStats.length > 0 && (
          <section>
            <div className={`grid gap-3 ${summaryStats.length === 2 ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
              {summaryStats.map((s, i) => (
                <SummaryCard key={i} {...s} />
              ))}
            </div>
          </section>
        )}

        {/* All data sections */}
        <div style={DARK_THEME} className="space-y-8">

          {/* Scenario Comparison */}
          {displayData.rows.length > 0 && (
            <section>
              <SectionHeader title="Scenario Comparison" />
              <div className="overflow-x-auto -mx-4 px-4">
                <ScenarioSummaryTable data={displayData} />
              </div>
            </section>
          )}

          {/* Key Metrics */}
          <section>
            <SectionHeader title="Key Metrics" />
            <KeyMetricsGrid metrics={displayData.keyMetrics} mode={displayData.mode} rows={displayData.rows} />
          </section>

          {/* Break-Even Analysis */}
          {displayData.breakEvenRows.length > 0 && (
            <section>
              <SectionHeader title="Break-Even Analysis" />
              <div className="overflow-x-auto -mx-4 px-4">
                <BreakEvenTable rows={displayData.breakEvenRows} mode={displayData.mode} />
              </div>
            </section>
          )}

          {/* Charts */}
          {displayData.rows.length > 0 && (
            <section>
              <SectionHeader title="Visual Analysis" />
              <ScenarioCharts data={displayData} />
            </section>
          )}

          {/* AI Narrative */}
          {data.narrative && (
            <section>
              <SectionHeader title="Analysis" />
              <div
                className="rounded-[14px] p-5 sm:p-6"
                style={{ background: CARD_BG, border: `1px solid ${BORDER}` }}
              >
                <NarrativeBlock text={data.narrative} />
              </div>
            </section>
          )}

        </div>

        {/* ── CTA Block ──────────────────────────────────────────── */}
        <section>
          <div
            className="rounded-[16px] p-6 sm:p-8 text-center"
            style={{ background: CARD_BG, border: `1px solid ${GOLD}30` }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: GOLD }}>
              Ready to Move Forward?
            </p>
            <h3 className="text-lg font-semibold mb-1" style={{ color: TEXT }}>
              Let&rsquo;s talk through your options.
            </h3>
            <p className="text-sm mb-6" style={{ color: MUTED }}>
              Questions about these numbers? Schedule a quick call — no pressure, no obligation.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://calendly.com/adamstyer/15minutes"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-[10px] text-sm font-semibold"
                style={{ background: GOLD, color: 'var(--bg)', fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Schedule a Call
              </a>
              <a
                href="https://mslp.my1003app.com/513013/register"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 rounded-[10px] text-sm font-semibold"
                style={{ background: 'transparent', color: GOLD, border: `1px solid ${GOLD}50`, fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Start Application
              </a>
            </div>

            <div className="mt-6 pt-5" style={{ borderTop: `1px solid ${BORDER}` }}>
              <p className="text-xs font-medium" style={{ color: TEXT }}>Adam Styer</p>
              <p className="text-[10px] mt-0.5" style={{ color: MUTED }}>
                Adam Styer | Mortgage Solutions LP · NMLS #513013
              </p>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────────────── */}
        <footer className="pt-4" style={{ borderTop: `1px solid ${BORDER}` }}>
          <p className="text-[10px] leading-relaxed mb-2" style={{ color: `${TEXT}30` }}>
            This analysis is for informational purposes only and does not constitute a loan commitment or financial advice.
            Consult with your loan officer for personalized guidance. This analysis was generated with AI assistance and
            reviewed by a licensed loan officer. Equal Housing Lender.
          </p>
          <p className="text-[10px] font-medium" style={{ color: `${GOLD}40` }}>
            Powered by LoanOS
          </p>
        </footer>

      </div>
    </div>
  )
}
