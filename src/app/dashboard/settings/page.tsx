'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Mail, CheckCircle, XCircle, RefreshCw, Loader2, Unplug,
  Eye, EyeOff, Save, Zap, Globe, Share2, User,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'

// ── Types ─────────────────────────────────────────────────────────────────────

type OutlookStatus = {
  connected: boolean
  email: string | null
  expires_at: string | null
  token_valid: boolean
}

interface Integrations {
  anthropic_api_key: string
  mailchimp_api_key: string
  mailchimp_server_prefix: string
  mailchimp_borrower_list_id: string
  mailchimp_realtor_list_id: string
}

interface WebsiteSettings {
  website_base_url: string
  dispatch_webhook_url: string
  dispatch_secret: string
}

interface SocialSettings {
  linkedin_access_token: string
  facebook_page_access_token: string
  facebook_page_id: string
}

interface IdentitySettings {
  lo_full_name: string
  company_name: string
  nmls_number: string
  email_address: string
  phone_number: string
}

type SectionKey = 'integrations' | 'website' | 'social' | 'identity'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })
}

function useSupabase() {
  return useMemo(() => createClient(), [])
}

// ── Masked input ──────────────────────────────────────────────────────────────

function SecretField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div>
      <label className="block text-xs font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••••••'}
          className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-200 pr-9 focus:outline-none focus:border-amber-500 transition-colors font-mono placeholder-zinc-500"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {visible ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  )
}

function TextField({
  label, value, onChange, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-amber-500 transition-colors"
      />
    </div>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon, title, subtitle, updatedAt, saving, onSave, children,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  updatedAt: string | null
  saving: boolean
  onSave: () => void
  children: React.ReactNode
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-700 border-l-[3px] border-l-amber-500 rounded-r-lg p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-zinc-800 border border-zinc-600 flex items-center justify-center">
            <Icon size={17} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-semibold text-zinc-100">{title}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>
          </div>
        </div>
        {updatedAt && (
          <span className="text-xs text-zinc-500 font-mono mt-0.5">
            Saved {fmtTime(updatedAt)}
          </span>
        )}
      </div>

      <div className="space-y-4">{children}</div>

      <div className="mt-5 flex items-center justify-end">
        <button
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-amber-500 text-zinc-900 hover:bg-amber-400 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const supabase = useSupabase()
  const searchParams = useSearchParams()
  const { userId, loading: orgLoading, role: myRole, organizationId } = useOrg()

  // ── Outlook ──
  const [status, setStatus] = useState<OutlookStatus | null>(null)
  const [outlookLoading, setOutlookLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [flashMsg, setFlashMsg] = useState<string | null>(null)

  // ── Section values ──
  const [integrations, setIntegrations] = useState<Integrations>({
    anthropic_api_key: '', mailchimp_api_key: '', mailchimp_server_prefix: '',
    mailchimp_borrower_list_id: '', mailchimp_realtor_list_id: '',
  })
  const [website, setWebsite] = useState<WebsiteSettings>({
    website_base_url: '', dispatch_webhook_url: '', dispatch_secret: '',
  })
  const [social, setSocial] = useState<SocialSettings>({
    linkedin_access_token: '', facebook_page_access_token: '', facebook_page_id: '',
  })
  const [identity, setIdentity] = useState<IdentitySettings>({
    lo_full_name: '', company_name: '', nmls_number: '', email_address: '', phone_number: '',
  })

  // ── Per-section metadata ──
  const [timestamps, setTimestamps] = useState<Record<SectionKey, string | null>>({
    integrations: null, website: null, social: null, identity: null,
  })
  const [saving, setSaving] = useState<Record<SectionKey, boolean>>({
    integrations: false, website: false, social: false, identity: false,
  })

  // ── Org members ──
  const [members, setMembers] = useState<Array<{id: string, full_name: string | null, email: string | null, role: string, created_at: string}>>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const canManageMembers = myRole === 'owner' || myRole === 'admin'

  // ── OAuth flash ──
  useEffect(() => {
    const outlook = searchParams.get('outlook')
    if (outlook === 'connected') setFlashMsg('Outlook connected successfully.')
    if (outlook === 'error')     setFlashMsg('Outlook connection failed. Try again.')
  }, [searchParams])

  // ── Load Outlook status ──
  const fetchOutlookStatus = useCallback(async () => {
    setOutlookLoading(true)
    try {
      const res = await fetch('/api/outlook-status')
      setStatus(res.ok ? await res.json() : { connected: false, email: null, expires_at: null, token_valid: false })
    } catch {
      setStatus({ connected: false, email: null, expires_at: null, token_valid: false })
    } finally {
      setOutlookLoading(false)
    }
  }, [])

  // ── Load all settings ──
  useEffect(() => {
    fetchOutlookStatus()
    if (orgLoading || !userId) return
    supabase
      .from('user_settings')
      .select('key, value, updated_at')
      .eq('user_id', userId)
      .then(({ data }) => {
        for (const row of data ?? []) {
          const key = row.key as SectionKey
          if (key === 'integrations') setIntegrations(row.value as Integrations)
          if (key === 'website')      setWebsite(row.value as WebsiteSettings)
          if (key === 'social')       setSocial(row.value as SocialSettings)
          if (key === 'identity')     setIdentity(row.value as IdentitySettings)
          setTimestamps(prev => ({ ...prev, [key]: row.updated_at }))
        }
      })
  }, [fetchOutlookStatus, supabase, userId, orgLoading])

  // ── Save section ──
  async function saveSection(key: SectionKey, value: object) {
    if (!userId) return
    setSaving(prev => ({ ...prev, [key]: true }))
    const now = new Date().toISOString()
    await supabase
      .from('user_settings')
      .upsert({ user_id: userId, key, value, updated_at: now }, { onConflict: 'user_id,key' })
    setSaving(prev => ({ ...prev, [key]: false }))
    setTimestamps(prev => ({ ...prev, [key]: now }))
  }

  // ── Test connections ──
  async function testAnthropic() {
    if (!integrations.anthropic_api_key) return
    const res = await fetch('/api/settings/test-anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: integrations.anthropic_api_key }),
    })
    const data = await res.json()
    setFlashMsg(data.ok ? '✓ Anthropic key is valid.' : `✗ Anthropic: ${data.error}`)
  }

  async function testMailchimp() {
    if (!integrations.mailchimp_api_key || !integrations.mailchimp_server_prefix) return
    const res = await fetch('/api/settings/test-mailchimp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: integrations.mailchimp_api_key, server_prefix: integrations.mailchimp_server_prefix }),
    })
    const data = await res.json()
    setFlashMsg(data.ok ? '✓ Mailchimp key is valid.' : `✗ Mailchimp: ${data.error}`)
  }

  // ── Outlook handlers ──
  async function handleSync() {
    setSyncing(true); setSyncResult(null)
    try {
      const res = await fetch('/api/outlook-sync', { method: 'POST', headers: { 'x-sync-secret': '' } })
      const data = await res.json()
      if (data.ok) {
        const { inserted, skipped, unmatched } = data.stats
        setSyncResult(`Sync complete — ${inserted} new, ${skipped} duplicates, ${unmatched} unmatched.`)
      } else {
        setSyncResult(`Sync failed: ${data.error}`)
      }
    } catch {
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

  const expiryLabel = status?.expires_at ? new Date(status.expires_at).toLocaleString() : null

  // ── Load org members ──
  useEffect(() => {
    fetch('/api/org/members')
      .then(r => r.ok ? r.json() : [])
      .then(setMembers)
      .catch(() => {})
  }, [organizationId])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError(null)
    setInviteSuccess(false)
    const res = await fetch('/api/org/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    if (res.ok) {
      setInviteSuccess(true)
      setInviteEmail('')
      fetch('/api/org/members').then(r => r.json()).then(setMembers).catch(() => {})
    } else {
      const d = await res.json()
      setInviteError(d.error || 'Failed to invite')
    }
    setInviting(false)
  }

  async function handleRoleChange(userId: string, newRole: string) {
    await fetch('/api/org/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: newRole }),
    })
    setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m))
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-wider mb-1">Settings</h1>
        <p className="text-sm font-mono text-zinc-500">Manage integrations, credentials, and account preferences.</p>
      </div>

      {/* Flash message */}
      {flashMsg && (
        <div
          onClick={() => setFlashMsg(null)}
          className={`px-4 py-3 rounded text-sm font-mono border cursor-pointer ${
            flashMsg.startsWith('✗') || flashMsg.includes('failed') || flashMsg.includes('error')
              ? 'bg-red-900/20 border-red-800 text-red-400'
              : 'bg-[#4ADE80]/10 border-[#4ADE80]/40 text-[#4ADE80]'
          }`}
        >
          {flashMsg}
        </div>
      )}

      {/* ── IDENTITY ── */}
      <SectionCard
        icon={User}
        title="Identity"
        subtitle="Your name, company, and contact details — used across emails and automations."
        updatedAt={timestamps.identity}
        saving={saving.identity}
        onSave={() => saveSection('identity', identity)}
      >
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Full Name" value={identity.lo_full_name} onChange={v => setIdentity(p => ({ ...p, lo_full_name: v }))} placeholder="Adam Styer" />
          <TextField label="NMLS #" value={identity.nmls_number} onChange={v => setIdentity(p => ({ ...p, nmls_number: v }))} placeholder="513013" />
        </div>
        <TextField label="Company Name" value={identity.company_name} onChange={v => setIdentity(p => ({ ...p, company_name: v }))} placeholder="Adam Styer | Mortgage Solutions LP" />
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Email Address" value={identity.email_address} onChange={v => setIdentity(p => ({ ...p, email_address: v }))} placeholder="adam@styermortgage.com" />
          <TextField label="Phone Number" value={identity.phone_number} onChange={v => setIdentity(p => ({ ...p, phone_number: v }))} placeholder="(512) 000-0000" />
        </div>
      </SectionCard>

      {/* ── INTEGRATIONS ── */}
      <SectionCard
        icon={Zap}
        title="Integrations"
        subtitle="API keys for Claude and Mailchimp."
        updatedAt={timestamps.integrations}
        saving={saving.integrations}
        onSave={() => saveSection('integrations', integrations)}
      >
        <div>
          <SecretField label="Anthropic API Key" value={integrations.anthropic_api_key} onChange={v => setIntegrations(p => ({ ...p, anthropic_api_key: v }))} placeholder="sk-ant-…" />
          <button onClick={testAnthropic} className="mt-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono transition-colors">
            Test connection →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <SecretField label="Mailchimp API Key" value={integrations.mailchimp_api_key} onChange={v => setIntegrations(p => ({ ...p, mailchimp_api_key: v }))} placeholder="…-us21" />
            <button onClick={testMailchimp} className="mt-1.5 text-xs text-amber-400 hover:text-amber-300 font-mono transition-colors">
              Test connection →
            </button>
          </div>
          <TextField label="Server Prefix" value={integrations.mailchimp_server_prefix} onChange={v => setIntegrations(p => ({ ...p, mailchimp_server_prefix: v }))} placeholder="us21" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField label="Borrower List ID" value={integrations.mailchimp_borrower_list_id} onChange={v => setIntegrations(p => ({ ...p, mailchimp_borrower_list_id: v }))} placeholder="abc123…" />
          <TextField label="Realtor List ID" value={integrations.mailchimp_realtor_list_id} onChange={v => setIntegrations(p => ({ ...p, mailchimp_realtor_list_id: v }))} placeholder="def456…" />
        </div>
      </SectionCard>

      {/* ── WEBSITE ── */}
      <SectionCard
        icon={Globe}
        title="Website"
        subtitle="Base URL and dispatch webhook for publishing rate updates and newsletters."
        updatedAt={timestamps.website}
        saving={saving.website}
        onSave={() => saveSection('website', website)}
      >
        <TextField label="Website Base URL" value={website.website_base_url} onChange={v => setWebsite(p => ({ ...p, website_base_url: v }))} placeholder="https://styermortgage.com" />
        <TextField label="Dispatch Webhook URL" value={website.dispatch_webhook_url} onChange={v => setWebsite(p => ({ ...p, dispatch_webhook_url: v }))} placeholder="https://…/.netlify/functions/dispatch" />
        <SecretField label="Dispatch Secret" value={website.dispatch_secret} onChange={v => setWebsite(p => ({ ...p, dispatch_secret: v }))} placeholder="Bearer token sent with dispatch calls" />
      </SectionCard>

      {/* ── SOCIAL ── */}
      <SectionCard
        icon={Share2}
        title="Social Media"
        subtitle="Access tokens for LinkedIn and Facebook posting."
        updatedAt={timestamps.social}
        saving={saving.social}
        onSave={() => saveSection('social', social)}
      >
        <SecretField label="LinkedIn Access Token" value={social.linkedin_access_token} onChange={v => setSocial(p => ({ ...p, linkedin_access_token: v }))} />
        <SecretField label="Facebook Page Access Token" value={social.facebook_page_access_token} onChange={v => setSocial(p => ({ ...p, facebook_page_access_token: v }))} />
        <TextField label="Facebook Page ID" value={social.facebook_page_id} onChange={v => setSocial(p => ({ ...p, facebook_page_id: v }))} placeholder="123456789" />
      </SectionCard>

      {/* ── ORGANIZATION MEMBERS ── */}
      <div className="bg-zinc-900 border border-zinc-700 border-l-[3px] border-l-amber-500 rounded-r-lg p-6">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-sm font-mono font-semibold text-zinc-100 uppercase tracking-wider">Organization Members</h2>
          <span className="text-xs text-zinc-500 font-mono lowercase">{myRole}</span>
        </div>

        {/* Members list */}
        <div className="mb-6 flex flex-col gap-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-zinc-800 border border-zinc-700 rounded">
              <div>
                <span className="text-sm text-zinc-200 font-mono">{m.full_name || m.email}</span>
                {m.full_name && <span className="text-xs text-zinc-500 font-mono ml-2">{m.email}</span>}
              </div>
              {canManageMembers && m.role !== 'owner' ? (
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                  className="bg-zinc-900 border border-zinc-600 text-zinc-300 px-2 py-1 rounded text-xs font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                </select>
              ) : (
                <span className={`text-xs font-mono px-2 py-1 border rounded ${m.role === 'owner' ? 'text-amber-400 border-amber-500/40' : 'text-zinc-500 border-zinc-700'}`}>{m.role}</span>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-xs text-zinc-500 font-mono">No members loaded.</p>
          )}
        </div>

        {/* Invite form — only for owner/admin */}
        {canManageMembers && (
          <form onSubmit={handleInvite} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">Invite by Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="janie@example.com"
                required
                className="w-full bg-zinc-800 border border-zinc-600 rounded px-3 py-2 text-sm text-zinc-200 font-mono focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="bg-zinc-800 border border-zinc-600 text-zinc-200 px-3 py-2 rounded text-sm font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="member">member</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="inline-flex items-center px-3 py-2 rounded text-xs font-mono font-medium bg-amber-500 text-zinc-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {inviting ? 'Inviting\u2026' : 'Send Invite'}
            </button>
          </form>
        )}

        {inviteError && <p className="text-red-400 text-xs font-mono mt-2">{inviteError}</p>}
        {inviteSuccess && <p className="text-[#4ADE80] text-xs font-mono mt-2">Invite sent successfully.</p>}
      </div>

      {/* ── OUTLOOK ── */}
      <div className="bg-zinc-900 border border-zinc-700 border-l-[3px] border-l-amber-500 rounded-r-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-zinc-800 border border-zinc-600 flex items-center justify-center">
              <Mail size={17} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-mono font-semibold text-zinc-100">Outlook / Microsoft 365</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Auto-log emails to matching contact activity timelines.</p>
            </div>
          </div>
          {!outlookLoading && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              status?.connected
                ? 'bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/40'
                : 'bg-zinc-800 text-zinc-500 border border-zinc-600'
            }`}>
              {status?.connected ? <><CheckCircle size={11} /> Connected</> : <><XCircle size={11} /> Not connected</>}
            </span>
          )}
        </div>

        {outlookLoading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500 font-mono"><Loader2 size={14} className="animate-spin" /> Loading status…</div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-zinc-500 uppercase tracking-wide mb-0.5 font-mono">Account</div>
                <div className="text-zinc-300 font-mono">{status.email}</div>
              </div>
              {expiryLabel && (
                <div>
                  <div className="text-zinc-500 uppercase tracking-wide mb-0.5 font-mono">Token expires</div>
                  <div className="text-zinc-300">{expiryLabel}</div>
                </div>
              )}
            </div>
            {syncResult && (
              <div className="text-xs px-3 py-2 rounded bg-zinc-800 border border-zinc-600 text-zinc-400 font-mono">{syncResult}</div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <button onClick={handleSync} disabled={syncing} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium bg-amber-500 text-zinc-900 hover:bg-amber-400 disabled:opacity-50 transition-colors">
                {syncing ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
              <button onClick={handleDisconnect} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-medium border border-zinc-600 text-zinc-400 hover:bg-zinc-800 transition-colors">
                <Unplug size={12} /> Disconnect
              </button>
            </div>
            <p className="text-xs text-zinc-500 font-mono">Emails are synced automatically every 15 minutes via n8n.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400 font-mono">Connect your Outlook account to automatically log emails to contact timelines.</p>
            <a href="/api/outlook-auth" className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-medium bg-amber-500 text-zinc-900 hover:bg-amber-400 transition-colors">
              <Mail size={14} /> Connect Outlook
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
