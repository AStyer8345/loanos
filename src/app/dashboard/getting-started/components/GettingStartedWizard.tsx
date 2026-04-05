'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, Circle, ChevronRight, Copy, Check,
  Upload, Zap, LayoutDashboard, Link2,
} from 'lucide-react'

interface WizardProps {
  initialStep: number
  setupAriveDone: boolean
  setupImportDone: boolean
  setupAutomationsDone: boolean
  orgName: string
  orgSlug: string
  userName: string
  plan: string
  contactCount: number
}

interface StepState {
  arive: boolean
  import: boolean
  automations: boolean
}

const AUTOMATIONS = [
  { label: 'Pre-Approval Email', desc: 'Sends when Arive status hits "Pre-Approved"' },
  { label: 'Final CD Email', desc: 'Sends when Arive status hits "CD Issued"' },
  { label: 'Referral Intro Email', desc: 'Available from the loan detail page' },
  { label: 'Web Lead Automation', desc: 'Fires when a new lead submits your website form' },
  { label: 'Daily Briefing', desc: 'Sent every morning with your pipeline summary' },
]

export default function GettingStartedWizard({
  initialStep,
  setupAriveDone,
  setupImportDone,
  setupAutomationsDone,
  orgName,
  orgSlug,
  userName,
  plan,
  contactCount: initialContactCount,
}: WizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [done, setDone] = useState<StepState>({
    arive: setupAriveDone,
    import: setupImportDone,
    automations: setupAutomationsDone,
  })
  const [copied, setCopied] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; duplicates: number; errors: number } | null>(null)
  const [contactCount, setContactCount] = useState(initialContactCount)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Tenant-specific Arive webhook URL. Points at LoanOS's multi-tenant ingress
  // (/api/webhooks/los/arive/[org_slug]) which routes by slug + signed secret
  // to the correct org. Never hardcode Adam's personal n8n URL here.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const webhookUrl = orgSlug && appUrl
    ? `${appUrl}/api/webhooks/los/arive/${orgSlug}`
    : ''

  async function markStep(step: 'arive' | 'import' | 'automations' | 'complete') {
    setSaving(true)
    try {
      await fetch('/api/onboarding/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ step }),
      })
      if (step !== 'complete') {
        setDone(prev => ({ ...prev, [step]: true }))
      }
    } catch {
      // continue regardless
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete() {
    await markStep('complete')
    router.push('/dashboard')
    router.refresh()
  }

  function copyWebhook() {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    setImportResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/contacts/csv-import', { method: 'POST', body: form })
      const data = await res.json() as { imported: number; duplicates: number; errors: number }
      setImportResult(data)
      setContactCount(prev => prev + (data.imported ?? 0))
    } catch {
      setImportResult({ imported: 0, duplicates: 0, errors: 1 })
    } finally {
      setImporting(false)
    }
  }

  const steps = [
    { key: 'welcome', label: 'Welcome' },
    { key: 'arive', label: 'Connect LOS' },
    { key: 'import', label: 'Import Contacts' },
    { key: 'automations', label: 'Automations' },
    { key: 'done', label: "You're Ready" },
  ]

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start py-12 px-4">
      {/* Step progress bar */}
      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center gap-0">
          {steps.map((s, i) => {
            const isCompleted = i < currentStep
            const isCurrent = i === currentStep
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative w-full flex items-center">
                  {i > 0 && (
                    <div className={`h-px flex-1 ${isCompleted || isCurrent ? 'bg-blue-500' : 'bg-gray-700'}`} />
                  )}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold
                    ${isCompleted ? 'bg-blue-600 text-white' : isCurrent ? 'bg-blue-500 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-950' : 'bg-gray-800 text-gray-500'}`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`h-px flex-1 ${isCompleted ? 'bg-blue-500' : 'bg-gray-700'}`} />
                  )}
                </div>
                <span className={`text-xs mt-1 ${isCurrent ? 'text-blue-400 font-medium' : isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Step panels */}
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">

        {/* ── Step 0: Welcome ───────────────────────────────────────────── */}
        {currentStep === 0 && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Welcome to LoanOS, {userName}!</h1>
                <p className="text-sm text-gray-400">{orgName} — {plan === 'professional' ? 'Professional' : 'Starter'} Plan</p>
              </div>
            </div>

            <p className="text-gray-300 mb-6">
              Let&apos;s get you set up in under 10 minutes. We&apos;ll walk through connecting your LOS,
              importing your contacts, and reviewing your active automations.
            </p>

            <div className="grid grid-cols-1 gap-3 mb-8">
              {[
                { icon: Link2, label: 'Connect Arive', desc: 'Link your webhook so loans sync automatically' },
                { icon: Upload, label: 'Import Contacts', desc: 'Bring in existing borrowers and realtors' },
                { icon: Zap, label: 'Review Automations', desc: 'See what runs automatically on your behalf' },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4 p-4 bg-gray-800 rounded-xl">
                  <div className="w-9 h-9 rounded-lg bg-blue-900/40 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setCurrentStep(1)}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Get Started <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 1: Connect LOS ───────────────────────────────────────── */}
        {currentStep === 1 && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <Link2 className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Connect Your LOS</h2>
                <p className="text-sm text-gray-400">Paste your webhook URL into Arive</p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Your Webhook URL</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm text-blue-300 bg-gray-900 rounded-lg px-3 py-2 font-mono truncate">
                  {webhookUrl}
                </code>
                <button
                  onClick={copyWebhook}
                  className="shrink-0 p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                  title="Copy URL"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-300" />}
                </button>
              </div>
            </div>

            <div className="mb-8">
              <p className="text-sm font-medium text-gray-300 mb-3">Setup instructions:</p>
              <ol className="space-y-2 text-sm text-gray-400">
                <li className="flex gap-2"><span className="text-blue-400 font-semibold shrink-0">1.</span> Log into Arive and go to <strong className="text-gray-300">Settings</strong></li>
                <li className="flex gap-2"><span className="text-blue-400 font-semibold shrink-0">2.</span> Navigate to <strong className="text-gray-300">Integrations → Webhooks</strong></li>
                <li className="flex gap-2"><span className="text-blue-400 font-semibold shrink-0">3.</span> Paste the webhook URL above and save</li>
                <li className="flex gap-2"><span className="text-blue-400 font-semibold shrink-0">4.</span> New loans will sync to LoanOS automatically</li>
              </ol>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await markStep('arive')
                  setCurrentStep(2)
                }}
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {done.arive ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                {done.arive ? 'Done — Next' : "I've added the webhook"} <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={async () => {
                  await markStep('arive')
                  setCurrentStep(2)
                }}
                disabled={saving}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-400 text-sm rounded-xl transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Import Contacts ───────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Import Your Contacts</h2>
                <p className="text-sm text-gray-400">Upload a CSV to bring in existing borrowers and realtors</p>
              </div>
            </div>

            {importResult ? (
              <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-sm font-semibold text-green-300">Import complete</p>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{importResult.imported}</p>
                    <p className="text-xs text-gray-400">Imported</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-yellow-400">{importResult.duplicates}</p>
                    <p className="text-xs text-gray-400">Duplicates skipped</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-400">{contactCount}</p>
                    <p className="text-xs text-gray-400">Total contacts</p>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-700 hover:border-blue-600 rounded-xl p-8 mb-6 text-center cursor-pointer transition-colors group"
              >
                <Upload className="w-8 h-8 text-gray-600 group-hover:text-blue-400 mx-auto mb-3 transition-colors" />
                <p className="text-sm font-medium text-gray-300 mb-1">
                  {importing ? 'Importing...' : 'Click to upload a CSV file'}
                </p>
                <p className="text-xs text-gray-500">Supports first_name, last_name, email, phone, type, company, nmls columns</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  await markStep('import')
                  setCurrentStep(3)
                }}
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {importResult ? 'Next' : "I'll add contacts manually"} <ChevronRight className="w-4 h-4" />
              </button>
              {!importResult && (
                <button
                  onClick={async () => {
                    await markStep('import')
                    setCurrentStep(3)
                  }}
                  disabled={saving}
                  className="px-4 py-3 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-400 text-sm rounded-xl transition-colors"
                >
                  Skip
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Review Automations ────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Your Active Automations</h2>
                <p className="text-sm text-gray-400">These run automatically — no action required</p>
              </div>
            </div>

            <div className="space-y-2 mb-8">
              {AUTOMATIONS.map(a => (
                <div key={a.label} className="flex items-start gap-3 p-4 bg-gray-800 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-white">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={async () => {
                await markStep('automations')
                setCurrentStep(4)
              }}
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Looks good <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── Step 4: Done ──────────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-600/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">You&apos;re all set!</h2>
            <p className="text-gray-400 mb-8">
              {contactCount > 0
                ? `You have ${contactCount} contacts and ${AUTOMATIONS.length} automations active.`
                : `Your automations are active and ready to go.`}
              {' '}Welcome to LoanOS.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-white">{contactCount}</p>
                <p className="text-xs text-gray-400 mt-1">Contacts</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4">
                <p className="text-2xl font-bold text-green-400">{AUTOMATIONS.length}</p>
                <p className="text-xs text-gray-400 mt-1">Automations active</p>
              </div>
            </div>

            <button
              onClick={handleComplete}
              disabled={saving}
              className="w-full py-3 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Go to Dashboard
            </button>
          </div>
        )}
      </div>

      {/* Skip entire setup */}
      {currentStep < 4 && (
        <button
          onClick={handleComplete}
          className="mt-6 text-sm text-gray-600 hover:text-gray-400 transition-colors"
        >
          Skip setup for now
        </button>
      )}
    </div>
  )
}
