'use client'

import type { DisplayData } from '@/lib/scenarios/displayData'
import type { ShareBranding } from '@/app/api/share/[token]/route'
import { BG, TEXT, GOLD, fmtCurrency } from './constants'
import ShareHero from './ShareHero'
import OptionCardsGrid from './OptionCardsGrid'
import PaymentComparisonChart from './PaymentComparisonChart'
import NarrativeCard from './NarrativeCard'
import BreakEvenVisual from './BreakEvenVisual'
import DetailAccordion from './DetailAccordion'
import ShareCTA from './ShareCTA'
import ShareFooter from './ShareFooter'

interface SharedScenario {
  scenario_type: string
  borrower_name: string | null
  property_address: string | null
  property_value: number | null
  narrative: string | null
  created_at: string
}

interface SharePageLayoutProps {
  data: SharedScenario
  displayData: DisplayData
  branding?: ShareBranding
}

const DEFAULT_BRANDING: ShareBranding = {
  loName: 'Adam Styer',
  company: 'Adam Styer | Mortgage Solutions LP',
  nmls: '513013',
  phone: '(512) 956-6010',
  email: 'adam@styermortgage.com',
  logoUrl: null,
  brandColor: '#C9A84C',
  calendlyUrl: 'https://calendly.com/adamstyer/15minutes',
  applicationUrl: 'https://mslp.my1003app.com/513013/register',
}

function getHeroStat(displayData: DisplayData): { label: string; value: string; sublabel?: string } {
  if (displayData.mode === 'purchase') {
    const payments = displayData.rows.map(r => r.totalMonthlyPayment).filter(p => p > 0)
    const lowestPayment = payments.length ? Math.min(...payments) : 0
    if (lowestPayment > 0) {
      return {
        label: 'Starting At',
        value: `${fmtCurrency(lowestPayment)}/mo`,
        sublabel: `across ${displayData.rows.length} scenarios`,
      }
    }
    return { label: 'Loan Analysis Ready', value: 'See details below' }
  } else {
    const savings = displayData.keyMetrics.monthlySavings
    if (savings > 0) {
      return {
        label: 'Monthly Savings',
        value: `${fmtCurrency(savings)}/mo`,
        sublabel: `${fmtCurrency(savings * 12)}/yr \u00B7 ${fmtCurrency(savings * 60)} over 5 years`,
      }
    }
    const payments = displayData.rows.map(r => r.totalMonthlyPayment).filter(p => p > 0)
    const lowestPayment = payments.length ? Math.min(...payments) : 0
    if (lowestPayment > 0) {
      return { label: 'New Monthly Payment', value: `${fmtCurrency(lowestPayment)}/mo` }
    }
    return { label: 'Refinance Analysis Ready', value: 'See details below' }
  }
}

export default function SharePageLayout({ data, displayData, branding }: SharePageLayoutProps) {
  const b = branding || DEFAULT_BRANDING
  const mode = displayData.mode
  const heroStat = getHeroStat(displayData)
  const hasNarrative = !!data.narrative?.trim()
  const hasBreakEven = displayData.breakEvenRows.length > 0
  const hasMultipleOptions = displayData.rows.length > 1
  const dateStr = data.created_at
    ? new Date(data.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : ''

  return (
    <div
      className="min-h-screen share-page"
      style={{ background: BG, color: TEXT, fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      {/* Print-only branded header */}
      <div className="print-header" style={{ display: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `2px solid ${GOLD}` }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0A1628' }}>{b.company}</div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
              NMLS #{b.nmls}{b.phone ? ` · ${b.phone}` : ''}{b.email ? ` · ${b.email}` : ''}
            </div>
          </div>
          <div style={{ fontSize: 10, color: '#888', textAlign: 'right' }}>
            <div>Prepared by {b.loName}</div>
            <div>{dateStr}</div>
          </div>
        </div>
      </div>

      {/* 1. Hero */}
      <ShareHero
        borrowerName={data.borrower_name}
        mode={mode}
        propertyAddress={data.property_address}
        heroStat={heroStat}
        createdAt={data.created_at}
        loName={b.loName}
        company={b.company}
      />

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-5 py-8 sm:py-10 space-y-8">

        {/* 2. Option Cards */}
        <section>
          <OptionCardsGrid
            rows={displayData.rows}
            mode={mode}
          />
        </section>

        {/* 3. Payment Comparison Chart */}
        {hasMultipleOptions && (
          <section className="no-break">
            <PaymentComparisonChart
              rows={displayData.rows}
            />
          </section>
        )}

        {/* 4. AI Narrative */}
        {hasNarrative && (
          <section className="no-break">
            <NarrativeCard text={data.narrative!} />
          </section>
        )}

        {/* 5. Break-Even Visual */}
        {hasBreakEven && (
          <section className="no-break">
            <BreakEvenVisual breakEvenRows={displayData.breakEvenRows} />
          </section>
        )}

        {/* 6. Collapsible Deep Dive */}
        <section className="print:hidden">
          <DetailAccordion displayData={displayData} />
        </section>

        {/* 7. CTA */}
        <section className="print:hidden">
          <ShareCTA
            calendlyUrl={b.calendlyUrl}
            applicationUrl={b.applicationUrl}
            loName={b.loName}
            company={b.company}
            nmls={b.nmls}
          />
        </section>

        {/* 8. Footer */}
        <ShareFooter
          company={b.company}
          nmls={b.nmls}
          loName={b.loName}
          phone={b.phone}
          email={b.email}
        />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .share-page {
            background: white !important;
            color: #1a1a1a !important;
            font-size: 11px;
          }
          .share-page * {
            color-adjust: exact;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print-header {
            display: block !important;
            padding: 0 40px;
          }
          .no-break {
            break-inside: avoid;
          }
          @page {
            margin: 0.5in 0.6in;
            size: letter;
          }
          /* Override dark theme for print */
          .share-page [style*="background: #141414"],
          .share-page [style*="background: #0a0a0a"],
          .share-page [style*="background: rgba(20,20,20"] {
            background: #f9f8f6 !important;
          }
          .share-page [style*="color: #F0EDE8"],
          .share-page [style*="color: #f0ede8"] {
            color: #1a1a1a !important;
          }
          .share-page [style*="color: #888"] {
            color: #666 !important;
          }
          .share-page [style*="border-color: #262626"],
          .share-page [style*="border: 1px solid #262626"] {
            border-color: #ddd !important;
          }
        }
      `}</style>
    </div>
  )
}
