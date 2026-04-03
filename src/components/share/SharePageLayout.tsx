'use client'

import type { DisplayData } from '@/lib/scenarios/displayData'
import { BG, TEXT, fmtCurrency } from './constants'
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

export default function SharePageLayout({ data, displayData }: SharePageLayoutProps) {
  const mode = displayData.mode
  const heroStat = getHeroStat(displayData)
  const hasNarrative = !!data.narrative?.trim()
  const hasBreakEven = displayData.breakEvenRows.length > 0
  const hasMultipleOptions = displayData.rows.length > 1

  return (
    <div
      className="min-h-screen share-page"
      style={{ background: BG, color: TEXT, fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      {/* 1. Hero */}
      <ShareHero
        borrowerName={data.borrower_name}
        mode={mode}
        propertyAddress={data.property_address}
        heroStat={heroStat}
        createdAt={data.created_at}
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
          <section>
            <PaymentComparisonChart
              rows={displayData.rows}
            />
          </section>
        )}

        {/* 4. AI Narrative */}
        {hasNarrative && (
          <section>
            <NarrativeCard text={data.narrative!} />
          </section>
        )}

        {/* 5. Break-Even Visual */}
        {hasBreakEven && (
          <section>
            <BreakEvenVisual breakEvenRows={displayData.breakEvenRows} />
          </section>
        )}

        {/* 6. Collapsible Deep Dive */}
        <section className="print:hidden">
          <DetailAccordion displayData={displayData} />
        </section>

        {/* 7. CTA */}
        <section className="print:hidden">
          <ShareCTA />
        </section>

        {/* 8. Footer */}
        <ShareFooter />
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .share-page {
            background: white !important;
            color: #1a1a1a !important;
          }
          .share-page * {
            color-adjust: exact;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}
