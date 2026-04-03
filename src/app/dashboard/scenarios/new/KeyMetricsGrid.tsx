'use client'

import { useState, useEffect } from 'react'
import { X, Info } from 'lucide-react'
import type { KeyMetrics, ScenarioDisplayRow } from '@/lib/scenarios/displayData'

const fmtCurrency = (v: number) => '$' + Math.round(v).toLocaleString('en-US')

const APPRECIATION_RATE = 0.04

// ─── More Info Modal ───────────────────────────────────────────────

function MoreInfoModal({
  rows,
  mode,
  onClose,
}: {
  rows: ScenarioDisplayRow[]
  mode: 'purchase' | 'refinance'
  onClose: () => void
}) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const isPurchase = mode === 'purchase'

  const baselineIdx = rows.reduce((maxIdx, r, i) =>
    r.totalMonthlyPayment > rows[maxIdx].totalMonthlyPayment ? i : maxIdx
  , 0)

  const tdMuted: React.CSSProperties = {
    padding: '6px 14px', fontSize: 10,
    color: 'var(--sc-muted)',
    borderBottom: '1px solid var(--sc-border)',
    whiteSpace: 'nowrap',
    fontFamily: "'IBM Plex Mono', monospace",
  }
  const tdVal: React.CSSProperties = {
    padding: '6px 14px', textAlign: 'right', fontSize: 10,
    color: 'var(--sc-text)', fontFamily: "'IBM Plex Mono', monospace",
    borderBottom: '1px solid var(--sc-border)',
    fontWeight: 500,
  }
  const tdTotalLabel: React.CSSProperties = {
    padding: '9px 14px', fontSize: 11, fontWeight: 700,
    color: 'var(--sc-accent)', borderTop: '1px solid var(--sc-border)',
    fontFamily: "'IBM Plex Mono', monospace",
  }
  const tdTotalVal: React.CSSProperties = {
    padding: '9px 14px', textAlign: 'right', fontSize: 11,
    fontWeight: 700, color: 'var(--sc-accent)',
    borderTop: '1px solid var(--sc-border)',
    fontFamily: "'IBM Plex Mono', monospace",
  }

  const sectionHeader = (title: string) => (
    <tr key={'h-' + title}>
      <td colSpan={rows.length + 1} style={{
        padding: '12px 14px 4px',
        fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--sc-accent)',
      }}>
        {title}
      </td>
    </tr>
  )

  const dataRow = (label: string, values: (string | number)[]) => (
    <tr key={label}>
      <td style={tdMuted}>{label}</td>
      {values.map((v, i) => (
        <td key={i} style={tdVal}>{typeof v === 'number' ? fmtCurrency(v) : v}</td>
      ))}
    </tr>
  )

  const totalRow = (label: string, values: (string | number)[]) => (
    <tr key={'total-' + label}>
      <td style={tdTotalLabel}>{label}</td>
      {values.map((v, i) => (
        <td key={i} style={tdTotalVal}>{typeof v === 'number' ? fmtCurrency(v) : v}</td>
      ))}
    </tr>
  )

  const netSavings5yr = rows.map((r, i) => {
    if (i === baselineIdx) return '—'
    const ns = r.horizonAnalysis?.netSavings5yr ?? 0
    return ns >= 0 ? fmtCurrency(ns) : `(${fmtCurrency(Math.abs(ns))})`
  })

  const netSavings15yr = rows.map((r, i) => {
    if (i === baselineIdx) return '—'
    const savings = (r.monthlySavingsVsCurrent ?? 0) * 180 - Math.max(r.additionalCostToClose ?? 0, 0)
    return savings >= 0 ? fmtCurrency(savings) : `(${fmtCurrency(Math.abs(savings))})`
  })

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--sc-card)', border: '1px solid var(--sc-border)',
          borderRadius: 16, width: '100%', maxWidth: 720,
          maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '18px 20px', borderBottom: '1px solid var(--sc-border)',
          position: 'sticky', top: 0, background: 'var(--sc-card)', zIndex: 1,
        }}>
          <div>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--sc-accent)', fontWeight: 700 }}>
              Scenario Analysis
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--sc-text)', marginTop: 2 }}>
              60-Month &amp; 15-Year Breakdown
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--sc-border)', border: '1px solid var(--sc-border)',
              borderRadius: 8, padding: 6, cursor: 'pointer', color: '#888',
              display: 'flex', alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '4px 0 20px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 420 }}>
              <thead>
                <tr>
                  <th style={{
                    padding: '12px 14px', textAlign: 'left', fontSize: 10,
                    color: 'var(--sc-muted)', fontWeight: 500,
                    borderBottom: '1px solid var(--sc-border)',
                  }} />
                  {rows.map((row, i) => (
                    <th key={i} style={{
                      padding: '12px 14px', textAlign: 'right', fontSize: 11,
                      fontWeight: 700, color: 'var(--sc-text)',
                      borderBottom: '1px solid var(--sc-border)',
                    }}>
                      {row.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectionHeader('60-Month Analysis (5 Years)')}
                {dataRow('Total P&I Payments', rows.map(r => r.horizonAnalysis?.totalPIPaid5yr ?? 0))}
                {dataRow('Principal Paid', rows.map(r => r.horizonAnalysis?.principalPaid5yr ?? 0))}
                {dataRow('Balance Remaining', rows.map(r => r.horizonAnalysis?.balanceAt5yr ?? 0))}
                {dataRow('Interest & MI Paid', rows.map(r => r.horizonAnalysis?.interestMIPaid5yr ?? 0))}
                {dataRow('Closing Costs / Points', rows.map(r => r.cashToClose))}
                {dataRow('Total Cost (60 mo)', rows.map(r => r.horizonAnalysis?.totalCost5yr ?? 0))}
                {totalRow('Net Savings vs. Baseline', netSavings5yr)}

                {sectionHeader('15-Year Analysis')}
                {isPurchase && dataRow(
                  `Home Value (${(APPRECIATION_RATE * 100).toFixed(0)}%/yr appreciation)`,
                  rows.map(r => r.horizonAnalysis?.homeValue15yr ?? 0)
                )}
                {dataRow('Loan Balance at 15 Years', rows.map(r => r.horizonAnalysis?.balanceAt15yr ?? 0))}
                {isPurchase && dataRow('Equity at 15 Years', rows.map(r => r.horizonAnalysis?.equity15yr ?? 0))}
                {dataRow('Total Principal Paid', rows.map(r => r.horizonAnalysis?.principalPaid15yr ?? 0))}
                {dataRow('Total PITI (180 payments)', rows.map(r => r.horizonAnalysis?.totalPITI15yr ?? 0))}
                {totalRow('Net Savings vs. Baseline', netSavings15yr)}
              </tbody>
            </table>
          </div>

          <div style={{
            margin: '16px 20px 0',
            padding: '10px 14px',
            background: 'var(--sc-card-alt)',
            border: '1px solid var(--sc-border)',
            borderRadius: 8,
            fontSize: 9,
            color: 'var(--sc-muted)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--sc-muted)' }}>Assumptions: </strong>
            {isPurchase ? `Home appreciation at ${(APPRECIATION_RATE * 100).toFixed(0)}% per year. ` : ''}
            Savings calculated vs. baseline (highest monthly payment).
            Principal and balance from amortization schedule.
            Total cost includes P&I, escrow, and cash to close.
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Savings Card ──────────────────────────────────────────────────

function SavingsCard({
  label,
  value,
  subLabel,
  mathNote,
  positive,
  onMoreInfo,
}: {
  label: string
  value: string
  subLabel?: string
  mathNote?: string
  positive?: boolean
  onMoreInfo?: () => void
}) {
  const [showMath, setShowMath] = useState(false)

  return (
    <div
      className="rounded-[14px] p-5 flex flex-col min-w-0"
      style={{
        background: 'var(--sc-card)',
        border: `1px solid ${positive ? 'rgba(42,122,75,0.3)' : 'var(--sc-border)'}`,
        minHeight: 110,
      }}
    >
      <p className="text-[10px] font-medium uppercase tracking-wider mb-2 truncate" style={{ color: 'var(--sc-muted)' }}>
        {label}
      </p>
      <p className="text-base font-bold flex-1 whitespace-nowrap overflow-hidden text-ellipsis" style={{
        fontFamily: "'IBM Plex Mono', monospace",
        color: positive ? '#4CC98A' : 'var(--sc-text)',
      }}>
        {value}
      </p>
      {subLabel && (
        <p className="text-[10px] mt-1" style={{ color: 'var(--sc-muted)' }}>{subLabel}</p>
      )}

      {/* Math tooltip */}
      {mathNote && (
        <div style={{ marginTop: 6, position: 'relative' }}>
          <button
            onMouseEnter={() => setShowMath(true)}
            onMouseLeave={() => setShowMath(false)}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 9, color: 'rgba(201,168,76,0.65)',
            }}
          >
            <Info size={9} />
            How this is calculated
          </button>
          {showMath && (
            <div style={{
              position: 'absolute', bottom: '100%', left: 0, marginBottom: 6,
              background: 'var(--sc-card-alt, #0A1628)', border: '1px solid var(--sc-accent)',
              borderRadius: 8, padding: '8px 10px', zIndex: 50,
              fontSize: 9, color: 'var(--sc-text)', whiteSpace: 'pre-line',
              lineHeight: 1.6, minWidth: 180, maxWidth: 240,
              boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
              pointerEvents: 'none',
            }}>
              {mathNote}
            </div>
          )}
        </div>
      )}

      {/* More Info button */}
      {onMoreInfo && (
        <button
          onClick={onMoreInfo}
          style={{
            marginTop: 8,
            background: 'rgba(201,168,76,0.08)',
            border: '1px solid rgba(201,168,76,0.2)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 9,
            fontWeight: 600,
            color: 'var(--sc-accent)',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            alignSelf: 'flex-start',
          }}
        >
          More Info
        </button>
      )}
    </div>
  )
}

// ─── Component ─────────────────────────────────────────────────────

export default function KeyMetricsGrid({
  metrics,
  mode,
  rows,
}: {
  metrics: KeyMetrics
  mode: 'purchase' | 'refinance'
  rows?: ScenarioDisplayRow[]
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const hasSavings = metrics.monthlySavings > 0
  const baseline = mode === 'refinance' ? 'current payment' : 'most expensive option'

  const savings5yrNote = [
    `Monthly savings × 60 months:`,
    `${fmtCurrency(metrics.monthlySavings)}/mo × 60`,
    `= ${fmtCurrency(metrics.savings5yr)}`,
    ``,
    `Gross savings — does not deduct`,
    `closing cost differences.`,
    `See "More Info" for net figures.`,
  ].join('\n')

  const savings15yrNote = [
    `Monthly savings × 180 months:`,
    `${fmtCurrency(metrics.monthlySavings)}/mo × 180`,
    `= ${fmtCurrency(metrics.savings15yr)}`,
    ``,
    `Gross savings — does not deduct`,
    `closing cost differences.`,
    `See "More Info" for net figures.`,
  ].join('\n')

  const openModal = rows?.length ? () => setModalOpen(true) : undefined

  return (
    <div>
      <h3 className="text-sm font-semibold mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        Key Metrics — Best Scenario
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
        <SavingsCard
          label="Monthly Savings"
          value={fmtCurrency(metrics.monthlySavings) + '/mo'}
          subLabel={`vs. ${baseline}`}
          mathNote={`Monthly payment difference\nvs. ${baseline}.`}
          positive={hasSavings}
          onMoreInfo={openModal}
        />
        <SavingsCard
          label="Savings over 5 Years"
          value={fmtCurrency(metrics.savings5yr)}
          subLabel={`${fmtCurrency(metrics.monthlySavings)}/mo × 60`}
          mathNote={savings5yrNote}
          positive={hasSavings}
          onMoreInfo={openModal}
        />
        <SavingsCard
          label="Savings over 15 Years"
          value={fmtCurrency(metrics.savings15yr)}
          subLabel={`${fmtCurrency(metrics.monthlySavings)}/mo × 180`}
          mathNote={savings15yrNote}
          positive={hasSavings}
          onMoreInfo={openModal}
        />
      </div>

      {modalOpen && rows?.length && (
        <MoreInfoModal rows={rows} mode={mode} onClose={() => setModalOpen(false)} />
      )}
    </div>
  )
}
