'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Mail, CheckCircle, XCircle, RefreshCw, Loader2, Unplug } from 'lucide-react'

type OutlookStatus = {
  connected: boolean
  email: string | null
  expires_at: string | null
  token_valid: boolean
}

export default function SettingsPage() {
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<OutlookStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [flashMsg, setFlashMsg] = useState<string | null>(null)

  // Handle OAuth return flash message
  useEffect(() => {
    const outlook = searchParams.get('outlook')
    if (outlook === 'connected') setFlashMsg('Outlook connected successfully.')
    if (outlook === 'error') setFlashMsg('Outlook connection failed. Try again.')
  }, [searchParams])

  const fetchStatus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/outlook-status')
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      } else {
        setStatus({ connected: false, email: null, expires_at: null, token_valid: false })
      }
    } catch {
      setStatus({ connected: false, email: null, expires_at: null, token_valid: false })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/.netlify/functions/outlook-sync', {
        method: 'POST',
        headers: { 'x-sync-secret': '' }, // secret not needed for manual trigger from browser
      })
      const data = await res.json()
      if (data.ok) {
        const { inserted, skipped, unmatched } = data.stats
        setSyncResult(`Sync complete — ${inserted} new, ${skipped} duplicates, ${unmatched} unmatched.`)
      } else {
        setSyncResult(`Sync failed: ${data.error}`)
      }
    } catch (err) {
      setSyncResult('Sync error — check console.')
    } finally {
      setSyncing(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect Outlook? Existing activity log entries will be preserved.')) return
    const res = await fetch('/api/outlook-disconnect', { method: 'POST' })
    if (res.ok) {
      setStatus({ connected: false, email: null, expires_at: null, token_valid: false })
      setFlashMsg('Outlook disconnected.')
    }
  }

  const expiryLabel = status?.expires_at
    ? new Date(status.expires_at).toLocaleString()
    : null

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-xl font-semibold text-slate-900 mb-1">Settings</h1>
      <p className="text-sm text-slate-500 mb-8">Manage integrations and account preferences.</p>

      {/* Flash message */}
      {flashMsg && (
        <div
          className={`mb-6 px-4 py-3 rounded-md text-sm border ${
            flashMsg.includes('failed') || flashMsg.includes('error')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          {flashMsg}
        </div>
      )}

      {/* Outlook Integration Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center">
              <Mail size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Outlook / Microsoft 365</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Auto-log emails to matching contact activity timelines.
              </p>
            </div>
          </div>

          {/* Connection badge */}
          {!loading && (
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                status?.connected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}
            >
              {status?.connected ? (
                <><CheckCircle size={11} /> Connected</>
              ) : (
                <><XCircle size={11} /> Not connected</>
              )}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" />
            Loading status...
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-slate-400 uppercase tracking-wide mb-0.5">Account</div>
                <div className="text-slate-700 font-mono">{status.email}</div>
              </div>
              {expiryLabel && (
                <div>
                  <div className="text-slate-400 uppercase tracking-wide mb-0.5">Token expires</div>
                  <div className="text-slate-700">{expiryLabel}</div>
                </div>
              )}
            </div>

            {syncResult && (
              <div className="text-xs px-3 py-2 rounded bg-slate-50 border border-slate-200 text-slate-600">
                {syncResult}
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                {syncing ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <RefreshCw size={12} />
                )}
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>

              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <Unplug size={12} />
                Disconnect
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Emails are synced automatically every 15 minutes via n8n.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Connect your Outlook account to automatically log emails to contact timelines.
              Sync runs every 15 minutes — inbox and sent items.
            </p>
            <a
              href="/.netlify/functions/outlook-auth"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
            >
              <Mail size={14} />
              Connect Outlook
            </a>
            <p className="text-xs text-slate-400">
              See <code className="bg-slate-100 px-1 rounded">docs/outlook-azure-setup.md</code> for
              Azure app registration steps.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
