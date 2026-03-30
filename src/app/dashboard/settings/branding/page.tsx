'use client'

import { useEffect, useState } from 'react'
import { Palette, Save, Loader2, ArrowLeft } from 'lucide-react'
import { canAccessFeature } from '@/lib/billing/entitlements'
import Link from 'next/link'

interface BrandingData {
  brandColor: string | null
  logoUrl: string | null
  slug: string | null
  orgName: string
  plan: string
}

export default function BrandingSettingsPage() {
  const [branding, setBranding] = useState<BrandingData | null>(null)
  const [color, setColor] = useState('#C9A84C')
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/org/settings/branding')
      .then(r => r.json())
      .then((data: BrandingData) => {
        setBranding(data)
        setColor(data.brandColor || '#C9A84C')
      })
      .catch(() => setFlash('Failed to load branding settings'))
      .finally(() => setLoading(false))
  }, [])

  const hasAccess = branding ? canAccessFeature('customBranding', branding.plan) : false

  async function handleSave() {
    setSaving(true)
    setFlash(null)
    try {
      const res = await fetch('/api/org/settings/branding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandColor: color }),
      })
      if (res.ok) {
        const data = await res.json()
        setBranding(data)
        setFlash('Branding updated. Refresh to see changes across the app.')
      } else {
        const err = await res.json()
        setFlash(`Error: ${err.error}`)
      }
    } catch {
      setFlash('Failed to save branding')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="flex items-center justify-center py-20">
          <Loader2 size={20} className="animate-spin text-zinc-500" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors mb-4"
        >
          <ArrowLeft size={12} /> Back to Settings
        </Link>
        <h1 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-wider mb-1">
          Branding
        </h1>
        <p className="text-sm font-mono text-zinc-500">
          Customize your organization&apos;s brand color. Changes apply across the entire dashboard.
        </p>
      </div>

      {/* Flash message */}
      {flash && (
        <div
          onClick={() => setFlash(null)}
          className={`px-4 py-3 rounded text-sm font-mono border cursor-pointer ${
            flash.startsWith('Error') || flash.startsWith('Failed')
              ? 'bg-red-900/20 border-red-800 text-red-400'
              : 'bg-[#4ADE80]/10 border-[#4ADE80]/40 text-[#4ADE80]'
          }`}
        >
          {flash}
        </div>
      )}

      {/* Upgrade prompt for Starter plan */}
      {!hasAccess && (
        <div className="bg-zinc-900 border border-amber-500/40 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-md bg-amber-500/10 border border-amber-500/40 flex items-center justify-center">
              <Palette size={17} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-semibold text-zinc-100">Upgrade to Professional</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Custom branding is available on the Professional plan ($99/mo)</p>
            </div>
          </div>
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            Professional plan includes custom brand colors, logo uploads, custom subdomains,
            and branded email reply-to addresses. Your dashboard will reflect your brand identity.
          </p>
        </div>
      )}

      {/* Branding editor */}
      <div className="bg-zinc-900 border border-zinc-700 border-l-[3px] border-l-amber-500 rounded-r-lg p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-zinc-800 border border-zinc-600 flex items-center justify-center">
              <Palette size={17} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-semibold text-zinc-100">Brand Color</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {hasAccess ? 'Set your primary accent color' : 'Preview — upgrade to edit'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Color picker row */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                disabled={!hasAccess}
                className="w-12 h-12 rounded-md border border-zinc-600 cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">
                Hex Color
              </label>
              <input
                type="text"
                value={color}
                onChange={e => {
                  const val = e.target.value
                  if (val.length <= 7) setColor(val)
                }}
                disabled={!hasAccess}
                placeholder="#C9A84C"
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-amber-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Live preview */}
          <div>
            <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase tracking-wider">
              Preview
            </label>
            <div className="bg-zinc-950 border border-zinc-700 rounded-lg overflow-hidden">
              {/* Mock nav bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-mono font-semibold text-zinc-100">
                    {branding?.orgName || 'LoanOS'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-zinc-500">Dashboard</span>
                  <span className="text-xs font-mono text-zinc-500">Contacts</span>
                  <span className="text-xs font-mono text-zinc-500">Loans</span>
                </div>
              </div>
              {/* Mock content */}
              <div className="px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs font-mono text-zinc-400">Accent elements use your brand color</span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1.5 rounded text-xs font-mono font-medium text-zinc-900"
                    style={{ backgroundColor: color }}
                  >
                    Primary Button
                  </button>
                  <button
                    className="px-3 py-1.5 rounded text-xs font-mono font-medium border"
                    style={{ borderColor: color, color: color }}
                  >
                    Secondary
                  </button>
                </div>
                <div
                  className="h-1 rounded-full w-2/3 opacity-80"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        {hasAccess && (
          <div className="mt-5 flex items-center justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-amber-500 text-zinc-900 hover:bg-amber-400 disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              {saving ? 'Saving…' : 'Save Branding'}
            </button>
          </div>
        )}
      </div>

      {/* Current branding info */}
      {branding && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">Current Branding</h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-zinc-500">Organization:</span>
              <span className="text-zinc-300 ml-2">{branding.orgName}</span>
            </div>
            <div>
              <span className="text-zinc-500">Plan:</span>
              <span className="text-zinc-300 ml-2 capitalize">{branding.plan}</span>
            </div>
            <div>
              <span className="text-zinc-500">Slug:</span>
              <span className="text-zinc-300 ml-2">{branding.slug || '—'}</span>
            </div>
            <div>
              <span className="text-zinc-500">Color:</span>
              <span className="text-zinc-300 ml-2">{branding.brandColor || 'Default (#C9A84C)'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
