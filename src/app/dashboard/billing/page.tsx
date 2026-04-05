import Link from 'next/link'
import { Check, Lock, ArrowLeft } from 'lucide-react'
import { getOrganization } from '@/lib/getOrganization'
import { createServiceClient } from '@/lib/supabase/service'
import { normalizePlan, PROFESSIONAL_FEATURES } from '@/lib/billing/entitlements'

// Human-readable copy for every feature key in PROFESSIONAL_FEATURES.
// Keep in sync with src/lib/billing/entitlements.ts.
const FEATURE_COPY: Record<string, { title: string; blurb: string }> = {
  customBranding:      { title: 'Custom branding',         blurb: 'Your logo, colors, and NMLS on every borrower-facing page.' },
  customDomain:        { title: 'Custom domain',           blurb: 'Host share pages and portals on your own domain.' },
  customEmailReplyTo:  { title: 'Custom reply-to',         blurb: 'System emails reply to your inbox, not LoanOS.' },
  advancedReporting:   { title: 'Advanced reporting',      blurb: 'Pipeline analytics, funnel metrics, and performance dashboards.' },
  dripCampaigns:       { title: 'Drip campaigns',          blurb: 'Automated multi-step email sequences for leads and past clients.' },
  automationBuilder:   { title: 'Automation builder',      blurb: 'Trigger-based workflows across email, SMS, and tasks.' },
  chatAgent:           { title: 'AI chat agent',           blurb: 'Claude-powered assistant that answers borrower questions 24/7.' },
  dailyBriefing:       { title: 'Daily briefing',          blurb: 'AM summary of pipeline, market rates, and outreach queue.' },
  socialPublishing:    { title: 'Social publishing',       blurb: 'One-click publish to Facebook, Instagram, LinkedIn, and GBP.' },
  sharePageWrites:     { title: 'Scenario share pages',    blurb: 'Public comparison links you can send to borrowers and realtors.' },
  scenarioSave:        { title: 'Save scenarios',          blurb: 'Persist scenario calculations to a borrower file.' },
  scenarioPdf:         { title: 'Scenario PDFs + email',   blurb: 'Generate branded PDFs and send straight to the borrower.' },
  teamInvites:         { title: 'Team invites',            blurb: 'Add processors, TCs, and assistants to your org.' },
}

export const dynamic = 'force-dynamic'

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { upgrade?: string }
}) {
  const { organizationId } = await getOrganization()
  const svc = createServiceClient()
  const { data: org } = await svc
    .from('organizations')
    .select('name, plan')
    .eq('id', organizationId)
    .single()

  const plan = normalizePlan(org?.plan)
  const isPro = plan === 'professional'
  const upgradeRequested = searchParams.upgrade === 'required'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground/80 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Dashboard
      </Link>

      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-foreground">Billing &amp; Plan</h1>
        <p className="text-sm text-muted-foreground">
          {org?.name ? `${org.name} — ` : ''}
          currently on the{' '}
          <span className="font-mono text-foreground">{plan}</span> plan.
        </p>
      </header>

      {upgradeRequested && !isPro && (
        <div className="border border-amber-500/40 bg-amber-500/10 rounded-md px-4 py-3 flex items-start gap-3">
          <Lock className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="text-sm">
            <div className="font-medium text-amber-200">Professional plan required</div>
            <div className="text-amber-200/80 mt-0.5">
              The page you tried to open is part of the Professional tier. Upgrade below to unlock it.
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {/* Starter */}
        <div className={`rounded-lg border p-5 space-y-4 ${plan === 'starter' ? 'border-foreground/40 bg-muted/40' : 'border-input'}`}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-foreground">Starter</h2>
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">$97<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
            </div>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> Loan pipeline + CRM</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> Scenario calculator</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> Rate update emails</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> Contact management</li>
          </ul>
          {plan === 'starter' && (
            <div className="text-xs font-mono uppercase tracking-wider text-foreground/70 pt-2 border-t border-input">
              Current plan
            </div>
          )}
        </div>

        {/* Professional */}
        <div className={`rounded-lg border p-5 space-y-4 ${isPro ? 'border-foreground/40 bg-muted/40' : 'border-amber-500/40'}`}>
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold text-foreground">Professional</h2>
            <div className="text-right">
              <div className="text-xl font-bold text-foreground">$197<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Everything in Starter, plus:</div>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {PROFESSIONAL_FEATURES.map((key) => {
              const copy = FEATURE_COPY[key]
              if (!copy) return null
              return (
                <li key={key} className="flex gap-2">
                  <Check className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-foreground">{copy.title}</span>
                    <span className="text-muted-foreground"> — {copy.blurb}</span>
                  </div>
                </li>
              )
            })}
          </ul>
          {isPro ? (
            <div className="text-xs font-mono uppercase tracking-wider text-foreground/70 pt-2 border-t border-input">
              Current plan
            </div>
          ) : (
            <a
              href="mailto:adam@thestyerteam.com?subject=LoanOS%20Professional%20Upgrade&body=I'd%20like%20to%20upgrade%20to%20the%20Professional%20plan."
              className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm py-2.5 rounded transition-colors"
            >
              Request upgrade
            </a>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Self-serve billing is coming soon. In the meantime, email{' '}
        <a href="mailto:adam@thestyerteam.com" className="underline hover:text-foreground/80">adam@thestyerteam.com</a>{' '}
        to change plans.
      </p>
    </div>
  )
}
