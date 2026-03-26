import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  calculatePurchaseScenario,
  calculateCurrentLoan,
  calculateRefiScenario,
} from '@/lib/scenarios/calculations'
import { buildPurchaseDisplayData, buildRefiDisplayData } from '@/lib/scenarios/displayData'
import type { DisplayData, ScenarioDisplayRow, BreakEvenRow } from '@/lib/scenarios/displayData'
import type {
  PurchaseScenarioInput, RefiScenarioInput, CurrentLoanInput,
  ClosingCostBreakdown,
} from '@/lib/scenarios/types'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { scenarioId } = await req.json()
    if (!scenarioId) return NextResponse.json({ error: 'Missing scenarioId' }, { status: 400 })

    const serviceClient = createServiceClient()
    const { data: scenario, error } = await serviceClient
      .from('scenarios')
      .select('*')
      .eq('id', scenarioId)
      .eq('user_id', user.id)
      .single()

    if (error || !scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 })
    }

    const { data: settingsRows } = await serviceClient
      .from('user_settings')
      .select('key, value')
      .eq('user_id', user.id)

    // Convert key-value rows into a flat settings object
    const userSettings: Record<string, string> | null = settingsRows?.length
      ? Object.fromEntries(settingsRows.map(r => [r.key, String(r.value ?? '')]))
      : null
    const mode = scenario.scenario_type as string
    const propertyValue = scenario.property_value as number || 0
    const scenarioInputs = scenario.scenarios_data as Record<string, unknown>[]

    let displayData: DisplayData
    let closingCostsByScenario: Array<{
      label: string; cc: ClosingCostBreakdown | null
      loanAmount: number; interestRate: number; pointsPercent: number; creditsPercent: number
    }> = []

    if (mode === 'purchase') {
      const inputs = scenarioInputs.map(s => s as unknown as PurchaseScenarioInput)
      const results = inputs.map(input => calculatePurchaseScenario(input, propertyValue))
      displayData = buildPurchaseDisplayData(inputs, results)
      closingCostsByScenario = inputs.map((input, i) => ({
        label: displayData.rows[i]?.label || `Option ${i + 1}`,
        cc: input.closingCostBreakdown || null,
        loanAmount: input.loanAmount,
        interestRate: input.interestRate,
        pointsPercent: input.pointsPercent ?? 0,
        creditsPercent: input.creditsPercent ?? 0,
      }))
    } else {
      const currentLoan = scenario.current_loan_data as unknown as CurrentLoanInput
      const currentCalc = calculateCurrentLoan(currentLoan)
      const inputs = scenarioInputs.map(s => s as unknown as RefiScenarioInput)
      const results = inputs.map(input => calculateRefiScenario(input, currentLoan, currentCalc, propertyValue))
      displayData = buildRefiDisplayData(currentLoan, inputs, results)
      closingCostsByScenario = inputs.map((input, i) => ({
        label: displayData.rows[i]?.label || `Option ${i + 1}`,
        cc: input.closingCostBreakdown || null,
        loanAmount: input.newLoanAmount,
        interestRate: input.interestRate,
        pointsPercent: input.pointsPercent ?? 0,
        creditsPercent: input.creditsPercent ?? 0,
      }))
    }

    const html = generatePDFHTML(scenario, userSettings, displayData, closingCostsByScenario)

    return new Response(html, {
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('[scenarios/generate-pdf] error:', error)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}

// ─── Helpers ──────────────────────────────────────────────────────

function fmtCurrency(v: number): string {
  return '$' + Math.round(v).toLocaleString('en-US')
}

function fmtK(v: number): string {
  if (Math.abs(v) >= 1000) return '$' + (v / 1000).toFixed(0) + 'k'
  return fmtCurrency(v)
}

const CHART_COLORS = ['#4A90D9', '#3BB080', '#E86B4F', '#9B59B6', '#E67E22']

function renderSVGBarChart(
  items: { label: string; value: number }[],
  fmtFn: (v: number) => string
): string {
  const W = 500
  const BOTTOM = 155
  const TOP = 30
  const CHART_H = BOTTOM - TOP
  const maxVal = Math.max(...items.map(i => i.value), 1)
  const numBars = items.length
  const barW = Math.min(80, Math.floor(380 / numBars / 1.5))
  const gap = Math.floor(barW * 0.4)
  const totalWidth = numBars * barW + (numBars - 1) * gap
  const startX = Math.round((W - totalWidth) / 2)

  const rects = items.map((item, i) => {
    const barH = Math.max(4, Math.round((item.value / maxVal) * CHART_H))
    const x = startX + i * (barW + gap)
    const y = BOTTOM - barH
    const fill = CHART_COLORS[i % CHART_COLORS.length]
    const shortLabel = item.label.length > 12 ? item.label.slice(0, 11) + '\u2026' : item.label
    return [
      `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${fill}" rx="3"/>`,
      `<text x="${x + barW / 2}" y="${y - 5}" text-anchor="middle" font-size="9" font-family="IBM Plex Mono,monospace" fill="#1a1a1a" font-weight="600">${fmtFn(item.value)}</text>`,
      `<text x="${x + barW / 2}" y="${BOTTOM + 14}" text-anchor="middle" font-size="9" font-family="IBM Plex Sans,sans-serif" fill="#666">${shortLabel}</text>`,
    ].join('\n')
  }).join('\n')

  return `<svg width="100%" viewBox="0 0 ${W} ${BOTTOM + 24}" xmlns="http://www.w3.org/2000/svg">
    <line x1="0" y1="${BOTTOM}" x2="${W}" y2="${BOTTOM}" stroke="#e5e5e5" stroke-width="1"/>
    ${rects}
  </svg>`
}

function renderSummaryTable(rows: ScenarioDisplayRow[], mode: 'purchase' | 'refinance'): string {
  const hasPurchasePrice = mode === 'purchase' && rows.some(r => r.purchasePrice)
  const hasHOA = rows.some(r => r.hoa > 0)
  const hasPMI = rows.some(r => r.pmi > 0)

  const headerCells = rows.map(r =>
    `<th style="background:#f5f5f5;color:#333;padding:8px 12px;font-size:11px;font-weight:700;text-align:center;">
      ${r.label}
      <br><span style="font-size:9px;font-weight:500;color:#999;text-transform:uppercase;">${r.loanType}</span>
    </th>`
  ).join('')

  const cell = (val: string) =>
    `<td style="padding:6px 12px;font-size:10.5px;text-align:center;font-family:'IBM Plex Mono',monospace;">${val}</td>`

  const subCell = (val: string, color = '#888') =>
    `<td style="padding:4px 12px;font-size:9.5px;text-align:center;font-family:'IBM Plex Mono',monospace;color:${color};">${val}</td>`

  const labelCell = (label: string, indent = false) =>
    `<td style="padding:6px 12px;font-size:10.5px;color:#666;font-weight:500;white-space:nowrap;${indent ? 'padding-left:22px;font-size:9.5px;color:#999;' : ''}">${label}</td>`

  const staticRows: Array<[string, (r: ScenarioDisplayRow) => string]> = [
    ...(hasPurchasePrice ? [['Purchase Price', (r: ScenarioDisplayRow) => r.purchasePrice ? fmtCurrency(r.purchasePrice) : '—'] as [string, (r: ScenarioDisplayRow) => string]] : []),
    ['Loan Amount', r => fmtCurrency(r.loanAmount)],
    ['Interest Rate', r => `${r.interestRate.toFixed(3)}%`],
    ['APR', r => `${r.apr.toFixed(3)}%`],
  ]

  const staticRowsHTML = staticRows.map(([label, fn], rowIdx) =>
    `<tr style="background:${rowIdx % 2 === 0 ? '#fff' : '#fafafa'}">
      ${labelCell(label)}
      ${rows.map(r => cell(fn(r))).join('')}
    </tr>`
  ).join('')

  // Monthly Payment section (always expanded in PDF)
  const monthlyPaymentHTML = `
    <tr style="background:#f0f0f0;">
      <td style="padding:7px 12px;font-size:10.5px;font-weight:700;color:#0A1628;white-space:nowrap;">Monthly Payment</td>
      ${rows.map(r => `<td style="padding:7px 12px;font-size:10.5px;font-weight:700;color:#0A1628;text-align:center;font-family:'IBM Plex Mono',monospace;">${fmtCurrency(r.totalMonthlyPayment)}</td>`).join('')}
    </tr>
    <tr style="background:#fafafa;">
      ${labelCell('Principal &amp; Interest', true)}
      ${rows.map(r => subCell(fmtCurrency(r.monthlyPI))).join('')}
    </tr>
    <tr style="background:#fafafa;">
      ${labelCell('Property Tax (est.)', true)}
      ${rows.map(r => subCell(r.propertyTaxes > 0 ? fmtCurrency(r.propertyTaxes) : '—')).join('')}
    </tr>
    <tr style="background:#fafafa;">
      ${labelCell('Homeowners Insurance (est.)', true)}
      ${rows.map(r => subCell(r.homeownersInsurance > 0 ? fmtCurrency(r.homeownersInsurance) : '—')).join('')}
    </tr>
    ${hasHOA ? `<tr style="background:#fafafa;">
      ${labelCell('HOA', true)}
      ${rows.map(r => subCell(r.hoa > 0 ? fmtCurrency(r.hoa) : '—')).join('')}
    </tr>` : ''}
    ${hasPMI ? `<tr style="background:#fafafa;">
      ${labelCell('MI / PMI', true)}
      ${rows.map(r => subCell(r.pmi > 0 ? fmtCurrency(r.pmi) : '—')).join('')}
    </tr>` : ''}
  `

  // Cash to Close (totals only per instructions)
  const ctcHTML = `
    <tr style="background:#fff;">
      <td style="padding:7px 12px;font-size:10.5px;font-weight:600;color:#666;white-space:nowrap;">Cash to Close</td>
      ${rows.map(r => `<td style="padding:7px 12px;font-size:10.5px;font-weight:600;text-align:center;font-family:'IBM Plex Mono',monospace;color:#0A1628;">${fmtCurrency(r.cashToClose)}</td>`).join('')}
    </tr>
  `

  const savingsHTML = `
    <tr style="background:#fafafa;">
      <td style="padding:7px 12px;font-size:10.5px;color:#666;font-weight:500;white-space:nowrap;">${mode === 'purchase' ? 'Monthly Savings vs. Baseline' : 'Monthly Savings vs. Current'}</td>
      ${rows.map(r => {
        const s = r.monthlySavingsVsCurrent ?? 0
        return `<td style="padding:7px 12px;font-size:10.5px;font-weight:600;text-align:center;font-family:'IBM Plex Mono',monospace;color:${s > 0 ? '#2A7A4B' : '#666'};">${s > 0 ? `+${fmtCurrency(s)}/mo` : '—'}</td>`
      }).join('')}
    </tr>
  `

  return `<table style="width:100%;border-collapse:collapse;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
    <thead>
      <tr>
        <th style="padding:8px 12px;text-align:left;font-size:11px;color:#999;background:#f5f5f5;"></th>
        ${headerCells}
      </tr>
    </thead>
    <tbody>
      ${staticRowsHTML}
      ${monthlyPaymentHTML}
      ${ctcHTML}
      ${savingsHTML}
    </tbody>
  </table>`
}

function renderKeyMetricsGrid(data: DisplayData): string {
  const m = data.keyMetrics
  const cards = [
    { label: 'Monthly Savings', value: fmtCurrency(m.monthlySavings), sub: '/month', green: m.monthlySavings > 0 },
    { label: 'Savings — 5 Years', value: fmtCurrency(m.savings5yr), sub: 'cumulative', green: m.savings5yr > 0 },
    { label: 'Savings — 15 Years', value: fmtCurrency(m.savings15yr), sub: 'cumulative', green: m.savings15yr > 0 },
    { label: 'Interest at 15 Years', value: fmtCurrency(m.interestAt15yrBest), sub: 'best option, through yr 15', green: false },
  ]

  return `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
    ${cards.map(c => `
    <div style="background:${c.green ? '#F0FBF5' : '#fafafa'};border:1px solid ${c.green ? '#4CC98A' : '#ddd'};border-radius:8px;padding:14px 12px;text-align:center;">
      <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.06em;color:#888;font-weight:600;margin-bottom:6px;">${c.label}</div>
      <div style="font-size:20px;font-weight:700;color:${c.green ? '#2A7A4B' : '#0A1628'};font-family:'IBM Plex Mono',monospace;line-height:1;">${c.value}</div>
      <div style="font-size:9px;color:#999;margin-top:3px;">${c.sub}</div>
    </div>`).join('')}
  </div>`
}

function renderBreakEvenTable(rows: BreakEvenRow[]): string {
  if (!rows.length) return ''
  const tableRows = rows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
      <td style="padding:7px 12px;font-size:10.5px;font-weight:600;">${r.label}</td>
      <td style="padding:7px 12px;font-size:10.5px;font-family:'IBM Plex Mono',monospace;text-align:right;">${fmtCurrency(r.additionalCostToClose)}</td>
      <td style="padding:7px 12px;font-size:10.5px;font-family:'IBM Plex Mono',monospace;text-align:right;color:#2A7A4B;font-weight:600;">+${fmtCurrency(r.monthlySavings)}/mo</td>
      <td style="padding:7px 12px;font-size:10.5px;font-family:'IBM Plex Mono',monospace;text-align:right;color:#C9A84C;font-weight:700;">${r.breakEvenMonths} mo</td>
      <td style="padding:7px 12px;font-size:10.5px;font-family:'IBM Plex Mono',monospace;text-align:right;">${r.breakEvenYears} yrs</td>
    </tr>`).join('')

  return `<table style="width:100%;border-collapse:collapse;border:1px solid #ddd;border-radius:8px;overflow:hidden;">
    <thead>
      <tr style="background:#0A1628;">
        <th style="padding:8px 12px;text-align:left;font-size:10px;color:#fff;font-weight:600;">Scenario</th>
        <th style="padding:8px 12px;text-align:right;font-size:10px;color:#fff;font-weight:600;">Cost to Close</th>
        <th style="padding:8px 12px;text-align:right;font-size:10px;color:#fff;font-weight:600;">Monthly Savings</th>
        <th style="padding:8px 12px;text-align:right;font-size:10px;color:#C9A84C;font-weight:700;">Break-Even</th>
        <th style="padding:8px 12px;text-align:right;font-size:10px;color:#fff;font-weight:600;">Break-Even (Yrs)</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>`
}

function renderNarrativeHTML(narrative: string): string {
  const paragraphs = narrative.split(/\n\n+/).filter(p => p.trim())
  return paragraphs.map((p, i) => {
    const text = p.trim().replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    if (i === 0) {
      return `<p style="font-size:12px;font-weight:500;color:#1a1a1a;line-height:1.65;margin:0 0 14px;padding-left:12px;border-left:3px solid #C9A84C;">${text}</p>`
    }
    return `<p style="font-size:11px;color:#555;line-height:1.7;margin:0 0 11px;">${text}</p>`
  }).join('')
}

function renderHeroTitleBlock(
  borrower: string,
  address: string,
  mode: 'purchase' | 'refinance',
  loName: string,
  date: string,
  data: DisplayData
): string {
  const firstName = borrower ? borrower.split(/[\s,]+/)[0] : ''
  const headline = firstName
    ? `${firstName}'s ${mode === 'purchase' ? 'Purchase' : 'Refinance'} Options`
    : `${mode === 'purchase' ? 'Purchase' : 'Refinance'} Options`

  let heroValue = ''
  let heroLabel = ''
  let heroSublabel = ''

  if (mode === 'purchase') {
    const payments = data.rows.map(r => r.totalMonthlyPayment).filter(p => p > 0)
    if (payments.length > 0) {
      heroLabel = 'Starting At'
      heroValue = fmtCurrency(Math.min(...payments)) + '/mo'
      heroSublabel = data.rows.length > 1 ? `across ${data.rows.length} scenarios` : 'monthly payment'
    }
  } else {
    const savings = data.keyMetrics.monthlySavings
    if (savings > 0) {
      heroLabel = 'You Could Save'
      heroValue = fmtCurrency(savings) + '/mo'
      heroSublabel = 'vs. your current loan'
    } else {
      const payments = data.rows.map(r => r.totalMonthlyPayment).filter(p => p > 0)
      if (payments.length > 0) {
        heroLabel = 'Best Option'
        heroValue = fmtCurrency(Math.min(...payments)) + '/mo'
        heroSublabel = 'new monthly payment'
      }
    }
  }

  return `
  <div style="margin-bottom:20px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.09em;color:#C9A84C;font-weight:700;margin-bottom:6px;">${mode === 'purchase' ? 'Purchase Analysis' : 'Refinance Analysis'}${address ? ` &nbsp;·&nbsp; ${address}` : ''}</div>
        <h1 style="font-size:26px;font-weight:700;color:#0A1628;letter-spacing:-0.02em;line-height:1.1;margin:0 0 5px;">${headline}</h1>
        <div style="font-size:10px;color:#999;">Prepared by ${loName} &nbsp;·&nbsp; ${date}</div>
      </div>
      ${heroValue ? `
      <div style="text-align:right;flex-shrink:0;">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:#888;font-weight:600;margin-bottom:4px;">${heroLabel}</div>
        <div style="font-size:34px;font-weight:700;color:#C9A84C;font-family:'IBM Plex Mono',monospace;line-height:1;">${heroValue}</div>
        <div style="font-size:9px;color:#aaa;margin-top:3px;">${heroSublabel}</div>
      </div>` : ''}
    </div>
    <div style="height:2px;background:#C9A84C;margin-top:14px;"></div>
  </div>`
}

function renderSummaryStatCards(data: DisplayData): string {
  let cards: Array<{ label: string; value: string; sub: string; highlight: boolean }>

  if (data.mode === 'purchase') {
    const payments = data.rows.map(r => r.totalMonthlyPayment).filter(p => p > 0)
    const ctcs = data.rows.map(r => r.cashToClose).filter(c => c > 0)
    const interests = data.rows.map(r => r.totalInterest).filter(i => i > 0)
    cards = [
      {
        label: 'Lowest Monthly Payment',
        value: payments.length > 0 ? fmtCurrency(Math.min(...payments)) + '/mo' : '—',
        sub: 'best option',
        highlight: true,
      },
      {
        label: 'Lowest Cash to Close',
        value: ctcs.length > 0 ? fmtCurrency(Math.min(...ctcs)) : '—',
        sub: 'total at closing',
        highlight: false,
      },
      {
        label: 'Lowest Total Interest',
        value: interests.length > 0 ? fmtK(Math.min(...interests)) : '—',
        sub: 'over loan term',
        highlight: false,
      },
    ]
  } else {
    const m = data.keyMetrics
    const breakEven = data.breakEvenRows.length > 0 ? data.breakEvenRows[0].breakEvenMonths : 0
    cards = [
      {
        label: 'Monthly Savings',
        value: m.monthlySavings > 0 ? fmtCurrency(m.monthlySavings) + '/mo' : '—',
        sub: 'vs. current loan',
        highlight: m.monthlySavings > 0,
      },
      {
        label: '5-Year Savings',
        value: m.savings5yr > 0 ? fmtCurrency(m.savings5yr) : '—',
        sub: 'cumulative',
        highlight: m.savings5yr > 0,
      },
      {
        label: 'Break-Even',
        value: breakEven > 0 ? `${breakEven} mo` : '—',
        sub: 'cost recovery period',
        highlight: false,
      },
    ]
  }

  return `
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:4px;">
    ${cards.map(c => `
    <div style="background:${c.highlight ? '#0A1628' : '#F9F8F6'};border:1px solid ${c.highlight ? '#C9A84C' : '#E0DDD8'};border-radius:8px;padding:13px 14px;">
      <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.07em;color:${c.highlight ? '#C9A84C' : '#888'};font-weight:700;margin-bottom:5px;">${c.label}</div>
      <div style="font-size:20px;font-weight:700;color:${c.highlight ? '#C9A84C' : '#0A1628'};font-family:'IBM Plex Mono',monospace;line-height:1;">${c.value}</div>
      <div style="font-size:9px;color:${c.highlight ? '#666' : '#aaa'};margin-top:4px;">${c.sub}</div>
    </div>`).join('')}
  </div>`
}

function renderClosingCostsHTML(
  cc: ClosingCostBreakdown,
  loanAmount: number, interestRate: number,
  pointsPct: number, creditsPct: number
): string {
  const lenderFees: [string, number][] = [
    ['Origination Fee', cc.originationFee],
    ['Underwriting Fee', cc.underwritingFee],
    ['Processing Fee', cc.processingFee],
    ...(cc.applicationFee > 0 ? [['Application Fee', cc.applicationFee]] as [string, number][] : []),
    ...(cc.adminFee > 0 ? [['Admin Fee', cc.adminFee]] as [string, number][] : []),
  ]
  const thirdParty: [string, number][] = [
    ['Appraisal', cc.appraisal],
    ['Credit Report', cc.creditReport],
    ['Doc Preparation', cc.docPrepFee],
    ['Flood Certification', cc.floodCert],
    ['TX Attorney Fee', cc.attorneyFee],
    ['Settlement Fee', cc.settlementFee],
    ['Title Search', cc.titleSearch],
    ['Title Endorsements', cc.titleEndorsements],
    ['Recording Fee', cc.recordingFee],
    ["Lender's Title Policy", cc.lendersTitlePolicy],
  ]
  const dailyRate = loanAmount > 0 && interestRate > 0 ? (loanAmount * (interestRate / 100)) / 365 : 0
  const prepaidInterest = Math.round(dailyRate * cc.prepaidInterestDays)
  const prepaids: [string, number][] = [
    [`Prepaid Interest (${cc.prepaidInterestDays} days)`, prepaidInterest],
    ...(cc.annualHazardInsurance > 0 ? [['Hazard Insurance (annual)', cc.annualHazardInsurance]] as [string, number][] : []),
  ]
  const pointsDollar = Math.round(loanAmount * (pointsPct / 100))
  const creditsDollar = Math.round(loanAmount * (creditsPct / 100))
  const lenderTotal = lenderFees.reduce((s, [, v]) => s + v, 0)
  const thirdPartyTotal = thirdParty.reduce((s, [, v]) => s + v, 0)
  const prepaidTotal = prepaids.reduce((s, [, v]) => s + v, 0)
  const grandTotal = lenderTotal + thirdPartyTotal + prepaidTotal + pointsDollar
  const netTotal = grandTotal - creditsDollar

  const sectionStyle = 'font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#999;border-bottom:1px solid #e5e5e5;padding:6px 0 3px;'
  const rowStyle = 'font-size:10px;padding:2px 0;'
  const valStyle = 'text-align:right;font-family:"IBM Plex Mono",monospace;font-weight:500;'

  const renderSection = (title: string, items: [string, number][], total: number) => {
    const rows = items.filter(([, v]) => v > 0).map(([label, val]) =>
      `<tr><td style="${rowStyle}color:#888;">${label}</td><td style="${rowStyle}${valStyle}">${fmtCurrency(val)}</td></tr>`
    ).join('')
    return `<tr><td colspan="2" style="${sectionStyle}">${title}<span style="float:right;font-family:'IBM Plex Mono',monospace;color:#1a1a1a;text-transform:none;letter-spacing:0;">${fmtCurrency(total)}</span></td></tr>${rows}`
  }

  return `<table style="width:100%;border-collapse:collapse;">
    <tbody>
      ${renderSection('Lender Fees', lenderFees, lenderTotal)}
      ${renderSection('Third Party Fees', thirdParty, thirdPartyTotal)}
      ${renderSection('Prepaids', prepaids, prepaidTotal)}
      ${pointsDollar > 0 ? `<tr><td style="${rowStyle}color:#888;">Discount Points (${pointsPct}%)</td><td style="${rowStyle}${valStyle}">${fmtCurrency(pointsDollar)}</td></tr>` : ''}
      ${creditsDollar > 0 ? `<tr><td style="${rowStyle}color:#888;">Lender Credits (${creditsPct}%)</td><td style="${rowStyle}${valStyle};color:#2A7A4B;">-${fmtCurrency(creditsDollar)}</td></tr>` : ''}
      <tr><td style="font-size:11px;font-weight:700;padding:8px 0 0;border-top:2px solid #C9A84C;">Total Closing Costs</td><td style="font-size:12px;font-weight:700;color:#C9A84C;padding:8px 0 0;border-top:2px solid #C9A84C;text-align:right;font-family:'IBM Plex Mono',monospace;">${fmtCurrency(netTotal)}</td></tr>
    </tbody>
  </table>`
}

// ─── Main HTML Generator ──────────────────────────────────────────

type ClosingCostEntry = {
  label: string; cc: ClosingCostBreakdown | null
  loanAmount: number; interestRate: number; pointsPercent: number; creditsPercent: number
}

function generatePDFHTML(
  scenario: Record<string, unknown>,
  settings: Record<string, string> | null,
  data: DisplayData,
  closingCosts: ClosingCostEntry[]
): string {
  const borrower = scenario.borrower_name as string || ''
  const address = scenario.property_address as string || ''
  const narrative = scenario.narrative as string || ''
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const mode = data.mode
  const loName = settings?.lo_name || 'Adam Styer'
  const nmls = settings?.nmls || '513013'
  const company = settings?.company || 'Adam Styer | Mortgage Solutions LP'
  const phone = settings?.phone || '(512) 956-6010'
  const email = settings?.email || 'adam@styermortgage.com'

  // Bar chart data
  const paymentBars = data.rows.map(r => ({ label: r.label, value: Math.round(r.totalMonthlyPayment) }))
  const interestBars = data.rows.map(r => ({ label: r.label, value: Math.round(r.totalInterest) }))

  const hasBreakEven = data.breakEvenRows.length > 0
  const hasClosingCosts = closingCosts.some(c => c.cc !== null)

  const sectionTitle = (title: string, sub?: string) => `
    <div style="margin-bottom:14px;margin-top:24px;">
      <div style="font-size:10px;text-transform:uppercase;letter-spacing:0.07em;color:#C9A84C;font-weight:700;">${sub || (mode === 'purchase' ? 'Purchase Analysis' : 'Refinance Analysis')}</div>
      <div style="font-size:16px;font-weight:700;color:#0A1628;margin-top:2px;">${title}</div>
      <div style="height:2px;background:#C9A84C;margin-top:8px;width:40px;"></div>
    </div>`

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${mode === 'purchase' ? 'Purchase' : 'Refinance'} Analysis — ${borrower}</title>
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'IBM Plex Sans', sans-serif; font-size: 12px; color: #1a1a1a; background: #fff; }
    @media print {
      body { padding: 0; }
      @page { margin: 0; size: letter; }
      .no-break { break-inside: avoid; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div style="background:#0A1628;padding:14px 40px;display:flex;justify-content:space-between;align-items:center;">
    <span style="color:#fff;font-size:14px;font-weight:700;">${company}</span>
    <span style="color:#F0D98A;font-size:10px;font-weight:500;">${date}</span>
  </div>
  <div style="height:3px;background:#C9A84C;"></div>
  <div style="background:#0A1628;padding:5px 40px;display:flex;justify-content:center;gap:20px;">
    <span style="color:#F0D98A;font-size:9px;letter-spacing:0.03em;">NMLS #${nmls}</span>
    <span style="color:#F0D98A;font-size:9px;letter-spacing:0.03em;">${phone}</span>
    <span style="color:#F0D98A;font-size:9px;letter-spacing:0.03em;">${email}</span>
    <span style="color:#F0D98A;font-size:9px;letter-spacing:0.03em;">styermortgage.com</span>
  </div>

  <div style="max-width:900px;margin:0 auto;padding:28px 40px 24px;">

    <!-- Hero Title + Summary Stats -->
    ${renderHeroTitleBlock(borrower, address, mode, loName, date, data)}
    ${renderSummaryStatCards(data)}

    <!-- Section 1: Scenario Summary Table -->
    <div class="no-break">
      ${sectionTitle('Scenario Comparison')}
      ${renderSummaryTable(data.rows, mode)}
    </div>

    <!-- Section 2: Key Metrics -->
    <div class="no-break" style="margin-top:4px;">
      ${sectionTitle('Key Metrics', 'Best Option Highlights')}
      ${renderKeyMetricsGrid(data)}
    </div>

    <!-- Section 3: Break-Even Analysis -->
    ${hasBreakEven ? `
    <div class="no-break" style="margin-top:4px;">
      ${sectionTitle('Break-Even Analysis', 'Cost Recovery')}
      ${renderBreakEvenTable(data.breakEvenRows)}
    </div>` : ''}

    <!-- Section 4: Monthly Payment Chart -->
    <div class="no-break" style="margin-top:4px;">
      ${sectionTitle('Monthly Payment by Scenario', 'Chart')}
      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:16px 12px;">
        ${renderSVGBarChart(paymentBars, fmtCurrency)}
      </div>
    </div>

    <!-- Section 5: Total Interest Chart -->
    <div class="no-break" style="margin-top:4px;">
      ${sectionTitle('Total Interest Paid by Scenario', 'Chart')}
      <div style="border:1px solid #e5e5e5;border-radius:8px;padding:16px 12px;">
        ${renderSVGBarChart(interestBars, fmtK)}
      </div>
    </div>

    <!-- Section 6: AI Analysis -->
    ${narrative ? `
    <div class="no-break" style="margin-top:4px;">
      ${sectionTitle("Here's how I'd think about it", 'AI Analysis')}
      <div style="background:#F2F0EB;border:1px solid #ddd;border-radius:8px;padding:20px;">
        ${renderNarrativeHTML(narrative)}
      </div>
    </div>` : ''}

    <!-- Section 7: Closing Costs Detail -->
    ${hasClosingCosts ? `
    <div style="margin-top:4px;">
      ${sectionTitle('Closing Costs Detail', 'Appendix')}
      <div style="display:grid;grid-template-columns:repeat(${Math.min(closingCosts.filter(c => c.cc).length, 3)},1fr);gap:16px;">
        ${closingCosts.filter(c => c.cc).map(entry => `
        <div class="no-break" style="border:1px solid #ddd;border-radius:8px;padding:14px;">
          <div style="font-size:11px;font-weight:700;color:#0A1628;margin-bottom:10px;padding-bottom:8px;border-bottom:2px solid #C9A84C;">${entry.label}</div>
          ${renderClosingCostsHTML(entry.cc!, entry.loanAmount, entry.interestRate, entry.pointsPercent, entry.creditsPercent)}
        </div>`).join('')}
      </div>
    </div>` : ''}

  </div>

  <!-- Footer -->
  <div style="background:#0A1628;padding:16px 40px;margin-top:24px;">
    <div style="text-align:center;padding:10px;border:1px solid #C9A84C;border-radius:6px;margin-bottom:12px;">
      <div style="color:#fff;font-size:12px;font-weight:600;">Questions? Let's talk.</div>
      <div style="color:#F0D98A;font-size:10px;margin-top:4px;">${loName} · ${phone} · ${email} · styermortgage.com</div>
    </div>
    <div style="text-align:center;font-size:8px;color:#8A8A8A;line-height:1.6;">
      This analysis is for informational purposes only and does not constitute a loan commitment or financial advice.
      Consult with your loan officer for personalized guidance. This analysis was generated with AI assistance and reviewed by ${loName}.
      Equal Housing Lender | ${company} | NMLS #${nmls}
    </div>
  </div>

</body>
</html>`
}
