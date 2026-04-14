'use client'

import type { DisplayData } from '@/lib/scenarios/displayData'
import type { ShareBranding } from '@/app/api/share/[token]/route'
import { BG, TEXT, GOLD, MUTED, fmtCurrency } from './constants'
import ShareHero from './ShareHero'
import OptionCardsGrid from './OptionCardsGrid'
import PaymentComparisonChart from './PaymentComparisonChart'
import NarrativeCard from './NarrativeCard'
import BreakEvenVisual from './BreakEvenVisual'
import DetailAccordion from './DetailAccordion'
import ShareCTA from './ShareCTA'
import ShareFooter from './ShareFooter'
import ShareEquityChart from './ShareEquityChart'
import CashToCloseBreakdown from './CashToCloseBreakdown'
import LOSidebarCard from './LOSidebarCard'
import ShareVideoEmbed from './ShareVideoEmbed'
import ScenarioComparisonTable from './ScenarioComparisonTable'
import SocialProofBlock from './SocialProofBlock'

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

// Neutral fallback used ONLY if the API route somehow returns no branding block.
// Personal identifiers (name, NMLS, phone, email, links) MUST stay empty so a
// misconfigured tenant never renders Adam's license info on their share page.
const DEFAULT_BRANDING: ShareBranding = {
  loName: 'Your Loan Officer',
  company: '',
  nmls: '',
  phone: '',
  email: '',
  logoUrl: null,
  brandColor: '#C9A84C',
  calendlyUrl: null,
  applicationUrl: null,
  videoUrl: null,
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
        sublabel: `${fmtCurrency(savings * 12)}/yr · ${fmtCurrency(savings * 60)} over 5 years`,
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

/** Section intro component for visual rhythm */
function SectionIntro({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-0.5">
        <div style={{ width: 16, height: 1, background: GOLD }} />
        <p
          className="text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{ color: GOLD }}
        >
          {title}
        </p>
      </div>
      {subtitle && (
        <p className="text-xs ml-7" style={{ color: MUTED }}>{subtitle}</p>
      )}
    </div>
  )
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

      {/* 1. Hero — full width */}
      <ShareHero
        borrowerName={data.borrower_name}
        mode={mode}
        propertyAddress={data.property_address}
        heroStat={heroStat}
        createdAt={data.created_at}
        loName={b.loName}
        company={b.company}
      />

      {/* 2. Two-column layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">

          {/* ═══ LEFT COLUMN: Main content ═══ */}
          <div className="space-y-8 min-w-0">

            {/* Video Walkthrough — renders only when LO has set scenario_video_url */}
            {b.videoUrl && <ShareVideoEmbed videoUrl={b.videoUrl} />}

            {/* Option Cards */}
            <section>
              <SectionIntro
                title="Your Options"
                subtitle={
                  displayData.rows.length > 1
                    ? `${displayData.rows.length} scenarios side by side`
                    : undefined
                }
              />
              <OptionCardsGrid rows={displayData.rows} mode={mode} />
            </section>

            {/* Comparison Table — visible only for multi-scenario, always expanded */}
            {hasMultipleOptions && (
              <section>
                <ScenarioComparisonTable displayData={displayData} />
              </section>
            )}

            {/* Cash to Close / Fee Breakdown */}
            <section className="no-break">
              <SectionIntro
                title={mode === 'purchase' ? 'Cash to Close' : 'Closing Costs'}
                subtitle="See how your upfront costs break down."
              />
              <CashToCloseBreakdown rows={displayData.rows} mode={mode} />
            </section>

            {/* AI Narrative */}
            {hasNarrative && (
              <section className="no-break">
                <NarrativeCard text={data.narrative!} />
              </section>
            )}

            {/* Social Proof — market context, print:hidden */}
            <section className="no-break print:hidden">
              <SocialProofBlock displayData={displayData} />
            </section>

            {/* Break-Even Visual */}
            {hasBreakEven && (
              <section className="no-break">
                <BreakEvenVisual breakEvenRows={displayData.breakEvenRows} />
              </section>
            )}

            {/* Collapsible Deep Dive */}
            <section className="print:hidden">
              <SectionIntro
                title="Detailed Comparison"
                subtitle="Expand for full numbers."
              />
              <DetailAccordion displayData={displayData} />
            </section>

          </div>

          {/* ═══ RIGHT COLUMN: Sidebar ═══ */}
          <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">

            {/* LO Branding Card — sidebar only on desktop; mobile uses ShareCTA at bottom */}
            <div className="hidden lg:block print:hidden">
              <LOSidebarCard
                loName={b.loName}
                company={b.company}
                nmls={b.nmls}
                phone={b.phone}
                email={b.email}
                calendlyUrl={b.calendlyUrl}
                applicationUrl={b.applicationUrl}
              />
            </div>

            {/* Payment Comparison Chart */}
            {hasMultipleOptions && (
              <section className="no-break">
                <PaymentComparisonChart rows={displayData.rows} />
              </section>
            )}

            {/* Equity Build Curve — purchase only */}
            {mode === 'purchase' && (
              <section className="no-break">
                <ShareEquityChart rows={displayData.rows} />
              </section>
            )}

          </div>
        </div>

        {/* ═══ FULL WIDTH BOTTOM ═══ */}
        <div className="mt-10 space-y-8">

          {/* CTA — full width, only on mobile since sidebar has buttons */}
          <section className="print:hidden lg:hidden">
            <ShareCTA
              calendlyUrl={b.calendlyUrl}
              applicationUrl={b.applicationUrl}
              loName={b.loName}
              company={b.company}
              nmls={b.nmls}
            />
          </section>

          {/* Footer */}
          <ShareFooter
            company={b.company}
            nmls={b.nmls}
            loName={b.loName}
            phone={b.phone}
            email={b.email}
          />
        </div>
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
          /* Force single column for print */
          .share-page .grid {
            grid-template-columns: 1fr !important;
          }
          /* Override dark theme for print */
          .share-page [style*="background: #141414"],
          .share-page [style*="background: #0a0a0a"],
          .share-page [style*="background: rgba(20,20,20"],
          .share-page [style*="background: linear-gradient"] {
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
