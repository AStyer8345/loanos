'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  Mail, CheckCircle, Loader2,
  Eye, EyeOff, Save, Zap, Globe, Share2, User, Bot, RotateCcw, Send, Megaphone,
  Ban, Trash2, Plus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useOrg } from '@/hooks/useOrg'

// ── Types ─────────────────────────────────────────────────────────────────────

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

// Per-org Publer wiring — lives in social_settings (not user_settings) because multiple
// team members on the same org must share the same Publer workspace and account IDs.
// Shape mirrors PublerConfig in src/app/api/social/publish/route.ts.
interface PublerSettings {
  workspace_id: string
  api_key: string
  facebook_account_id: string
  instagram_account_id: string
  linkedin_account_id: string
  google_account_id: string
}

type SectionKey = 'integrations' | 'website' | 'social' | 'identity' | 'ai' | 'outreach' | 'publer'

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
      <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder ?? '••••••••••••'}
          className="w-full bg-muted border border-input rounded px-3 py-2 text-sm text-foreground pr-9 focus:outline-none focus:border-amber-500 transition-colors font-mono placeholder-muted-foreground"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground/80 transition-colors"
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
      <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">{label}</label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-muted border border-input rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-amber-500 transition-colors"
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
    <div className="bg-card border border-input border-l-[3px] border-l-amber-500 rounded-r-lg p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-muted border border-input flex items-center justify-center">
            <Icon size={17} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        {updatedAt && (
          <span className="text-xs text-muted-foreground font-mono mt-0.5">
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
  const { userId, loading: orgLoading, role: myRole, organizationId } = useOrg()

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
  const [publer, setPubler] = useState<PublerSettings>({
    workspace_id: '', api_key: '',
    facebook_account_id: '', instagram_account_id: '', linkedin_account_id: '', google_account_id: '',
  })

  // ── Per-section metadata ──
  const [timestamps, setTimestamps] = useState<Record<SectionKey, string | null>>({
    integrations: null, website: null, social: null, identity: null, ai: null, outreach: null, publer: null,
  })
  const [saving, setSaving] = useState<Record<SectionKey, boolean>>({
    integrations: false, website: false, social: false, identity: false, ai: false, outreach: false, publer: false,
  })

  // ── AI prompt state ──
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiIsCustom, setAiIsCustom] = useState(false)

  // ── Outreach prompt state ──
  const [outreachPrompt, setOutreachPrompt] = useState('')
  const [outreachIsCustom, setOutreachIsCustom] = useState(false)

  // ── Hold List (drip suppressions) ──
  interface Suppression { id: string; email: string; scope: string; reason: string | null; added_at: string }
  const [suppressions, setSuppressions] = useState<Suppression[]>([])
  const [suppressionsLoading, setSuppressionsLoading] = useState(true)
  const [newHoldEmail, setNewHoldEmail] = useState('')
  const [newHoldReason, setNewHoldReason] = useState('')
  const [holdAdding, setHoldAdding] = useState(false)
  const [holdError, setHoldError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/drip/suppressions')
      .then(r => r.ok ? r.json() : { suppressions: [] })
      .then(d => setSuppressions(d.suppressions ?? []))
      .catch(() => {})
      .finally(() => setSuppressionsLoading(false))
  }, [])

  async function addHoldEntry(e: React.FormEvent) {
    e.preventDefault()
    setHoldError(null)
    setHoldAdding(true)
    try {
      const res = await fetch('/api/drip/suppressions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newHoldEmail, reason: newHoldReason || undefined }),
      })
      if (!res.ok) {
        const d = await res.json()
        setHoldError(d.error ?? 'Failed to add')
        return
      }
      const row = await res.json() as Suppression
      setSuppressions(prev => [row, ...prev])
      setNewHoldEmail('')
      setNewHoldReason('')
    } catch {
      setHoldError('Network error')
    } finally {
      setHoldAdding(false)
    }
  }

  async function removeHoldEntry(id: string) {
    await fetch(`/api/drip/suppressions/${id}`, { method: 'DELETE' })
    setSuppressions(prev => prev.filter(s => s.id !== id))
  }

  // ── Org members ──
  const [members, setMembers] = useState<Array<{id: string, full_name: string | null, email: string | null, role: string, created_at: string}>>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const canManageMembers = myRole === 'owner' || myRole === 'admin'

  // ── Load all settings ──
  useEffect(() => {
    if (orgLoading || !userId) return
    supabase
      .from('user_settings')
      .select('key, value, updated_at')
      .eq('user_id', userId)
      .then(({ data }) => {
        for (const row of data ?? []) {
          const key = row.key as SectionKey
          if (key === 'integrations') setIntegrations(row.value as unknown as Integrations)
          if (key === 'website')      setWebsite(row.value as unknown as WebsiteSettings)
          if (key === 'social')       setSocial(row.value as unknown as SocialSettings)
          if (key === 'identity')     setIdentity(row.value as unknown as IdentitySettings)
          setTimestamps(prev => ({ ...prev, [key]: row.updated_at }))
        }
      })
    // Load AI system prompt
    fetch('/api/settings/system-prompt')
      .then(r => r.json())
      .then(d => {
        setAiPrompt(d.content ?? '')
        setAiIsCustom(d.isCustom ?? false)
        if (d.updatedAt) setTimestamps(prev => ({ ...prev, ai: d.updatedAt }))
      })
      .catch(() => {})
    // Load outreach prompt
    fetch('/api/settings/outreach-prompt')
      .then(r => r.json())
      .then(d => {
        setOutreachPrompt(d.content ?? '')
        setOutreachIsCustom(d.isCustom ?? false)
        if (d.updatedAt) setTimestamps(prev => ({ ...prev, outreach: d.updatedAt }))
      })
      .catch(() => {})
    // Load publer_config (org-scoped, not user-scoped — that's why it's a separate fetch,
    // not a user_settings row). The API route lives at /api/social/settings and reads from
    // social_settings table.
    fetch('/api/social/settings?key=publer_config')
      .then(r => r.json())
      .then(d => {
        if (!d?.value) return
        try {
          const parsed = JSON.parse(d.value) as {
            workspace_id?: string
            api_key?: string
            accounts?: Record<string, { id?: string }>
          }
          setPubler({
            workspace_id: parsed.workspace_id || '',
            api_key: parsed.api_key || '',
            facebook_account_id: parsed.accounts?.facebook?.id || '',
            instagram_account_id: parsed.accounts?.instagram?.id || '',
            linkedin_account_id: parsed.accounts?.linkedin?.id || '',
            google_account_id: parsed.accounts?.google?.id || '',
          })
          if (d.updatedAt) setTimestamps(prev => ({ ...prev, publer: d.updatedAt }))
        } catch {
          // Corrupt row — leave form blank so user can fix by re-saving
        }
      })
      .catch(() => {})
  }, [supabase, userId, orgLoading])

  // ── Save AI prompt ──
  async function saveAiPrompt() {
    setSaving(prev => ({ ...prev, ai: true }))
    try {
      const res = await fetch('/api/settings/system-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: aiPrompt }),
      })
      if (res.ok) {
        setAiIsCustom(true)
        setTimestamps(prev => ({ ...prev, ai: new Date().toISOString() }))
        setFlashMsg('✓ AI prompt saved.')
      } else {
        setFlashMsg('✗ Failed to save prompt.')
      }
    } catch {
      setFlashMsg('✗ Failed to save prompt.')
    } finally {
      setSaving(prev => ({ ...prev, ai: false }))
    }
  }

  // ── Reset AI prompt to default ──
  async function resetAiPrompt() {
    if (!confirm('Reset to the default system prompt? Your custom prompt will be deleted.')) return
    try {
      await fetch('/api/settings/system-prompt', { method: 'DELETE' })
      const res = await fetch('/api/settings/system-prompt')
      const d = await res.json()
      setAiPrompt(d.content ?? '')
      setAiIsCustom(false)
      setTimestamps(prev => ({ ...prev, ai: null }))
      setFlashMsg('✓ Reset to default prompt.')
    } catch {
      setFlashMsg('✗ Reset failed.')
    }
  }

  // ── Save outreach prompt ──
  async function saveOutreachPrompt() {
    setSaving(prev => ({ ...prev, outreach: true }))
    try {
      const res = await fetch('/api/settings/outreach-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: outreachPrompt }),
      })
      if (res.ok) {
        setOutreachIsCustom(true)
        setTimestamps(prev => ({ ...prev, outreach: new Date().toISOString() }))
        setFlashMsg('✓ Outreach prompt saved.')
      } else {
        setFlashMsg('✗ Failed to save outreach prompt.')
      }
    } catch {
      setFlashMsg('✗ Failed to save outreach prompt.')
    } finally {
      setSaving(prev => ({ ...prev, outreach: false }))
    }
  }

  // ── Reset outreach prompt to default ──
  async function resetOutreachPrompt() {
    if (!confirm('Reset to the default outreach prompt? Your custom prompt will be deleted.')) return
    try {
      await fetch('/api/settings/outreach-prompt', { method: 'DELETE' })
      const res = await fetch('/api/settings/outreach-prompt')
      const d = await res.json()
      setOutreachPrompt(d.content ?? '')
      setOutreachIsCustom(false)
      setTimestamps(prev => ({ ...prev, outreach: null }))
      setFlashMsg('✓ Reset to default outreach prompt.')
    } catch {
      setFlashMsg('✗ Reset failed.')
    }
  }

  // ── Save section ──
  async function saveSection(key: SectionKey, value: object) {
    if (!userId) return
    setSaving(prev => ({ ...prev, [key]: true }))
    const now = new Date().toISOString()
    await supabase
      .from('user_settings')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert({ user_id: userId, key, value: value as any, updated_at: now }, { onConflict: 'user_id,key' })
    setSaving(prev => ({ ...prev, [key]: false }))
    setTimestamps(prev => ({ ...prev, [key]: now }))
  }

  // ── Save Publer (org-scoped, writes to social_settings via API) ──
  async function savePubler() {
    setSaving(prev => ({ ...prev, publer: true }))
    try {
      // Reassemble into the exact PublerConfig shape the publish route expects.
      // Drop empty account IDs so the config stays clean and loadPublerConfig's null check works.
      const accounts: Record<string, { id: string; network: string }> = {}
      if (publer.facebook_account_id.trim())
        accounts.facebook = { id: publer.facebook_account_id.trim(), network: 'facebook' }
      if (publer.instagram_account_id.trim())
        accounts.instagram = { id: publer.instagram_account_id.trim(), network: 'instagram' }
      if (publer.linkedin_account_id.trim())
        accounts.linkedin = { id: publer.linkedin_account_id.trim(), network: 'linkedin' }
      if (publer.google_account_id.trim())
        accounts.google = { id: publer.google_account_id.trim(), network: 'google' }

      const payload = {
        workspace_id: publer.workspace_id.trim(),
        api_key: publer.api_key.trim(),
        accounts,
      }

      const res = await fetch('/api/social/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'publer_config', value: JSON.stringify(payload) }),
      })
      if (res.ok) {
        setTimestamps(prev => ({ ...prev, publer: new Date().toISOString() }))
        setFlashMsg('✓ Publer config saved.')
      } else {
        const d = await res.json().catch(() => ({ error: 'Unknown error' }))
        setFlashMsg(`✗ Failed to save Publer config: ${d.error}`)
      }
    } catch (err) {
      console.error('[savePubler] error', err)
      setFlashMsg('✗ Network error saving Publer config.')
    } finally {
      setSaving(prev => ({ ...prev, publer: false }))
    }
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
    try {
      const res = await fetch('/api/org/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      })
      if (!res.ok) {
        const data = await res.json()
        setFlashMsg(`✗ Failed to update role: ${data.error || 'Unknown error'}`)
        return
      }
      setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m))
      setFlashMsg('✓ Role updated successfully.')
    } catch (err) {
      console.error('[handleRoleChange] network error', err)
      setFlashMsg('✗ Network error — check console.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-lg font-mono font-bold text-foreground uppercase tracking-wider mb-1">Settings</h1>
        <p className="text-sm font-mono text-muted-foreground">Manage integrations, credentials, and account preferences.</p>
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

      {/* ── PUBLER (SOCIAL PUBLISHING) ── */}
      <SectionCard
        icon={Megaphone}
        title="Social Publishing (Publer)"
        subtitle="Per-org Publer wiring. Required before you can publish or schedule social drafts from the dashboard."
        updatedAt={timestamps.publer}
        saving={saving.publer}
        onSave={savePubler}
      >
        <SecretField
          label="Publer API Key"
          value={publer.api_key}
          onChange={v => setPubler(p => ({ ...p, api_key: v }))}
          placeholder="Bearer token from Publer → Settings → API"
        />
        <TextField
          label="Publer Workspace ID"
          value={publer.workspace_id}
          onChange={v => setPubler(p => ({ ...p, workspace_id: v }))}
          placeholder="24-char workspace ID"
        />
        <p className="text-[11px] font-mono text-muted-foreground -mt-1">
          Account IDs — leave blank for any platform you don&apos;t use. Find them in Publer under Accounts → click the gear icon.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Facebook Account ID"
            value={publer.facebook_account_id}
            onChange={v => setPubler(p => ({ ...p, facebook_account_id: v }))}
            placeholder="24-char ID"
          />
          <TextField
            label="Instagram Account ID"
            value={publer.instagram_account_id}
            onChange={v => setPubler(p => ({ ...p, instagram_account_id: v }))}
            placeholder="24-char ID"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="LinkedIn Account ID"
            value={publer.linkedin_account_id}
            onChange={v => setPubler(p => ({ ...p, linkedin_account_id: v }))}
            placeholder="24-char ID"
          />
          <TextField
            label="Google (GBP) Account ID"
            value={publer.google_account_id}
            onChange={v => setPubler(p => ({ ...p, google_account_id: v }))}
            placeholder="24-char ID"
          />
        </div>
      </SectionCard>

      {/* ── AI SYSTEM PROMPT ── */}
      <SectionCard
        icon={Bot}
        title="AI System Prompt"
        subtitle="Controls how LoanOS AI behaves on every loan and contact record. Edit to customize its persona, priorities, and communication style."
        updatedAt={timestamps.ai}
        saving={saving.ai}
        onSave={saveAiPrompt}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              {aiIsCustom ? 'Custom prompt active' : 'Using default prompt'}
            </span>
            {aiIsCustom && (
              <button
                onClick={resetAiPrompt}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground/80 transition-colors"
              >
                <RotateCcw size={11} /> Reset to default
              </button>
            )}
          </div>
          <textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            rows={16}
            className="w-full bg-muted border border-input rounded px-3 py-2.5 text-xs font-mono text-foreground resize-y focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
            placeholder="You are LoanOS AI…"
            spellCheck={false}
          />
          <p className="mt-2 text-[11px] font-mono text-muted-foreground">
            The loan or contact record data is always appended automatically — you don&apos;t need to include it here.
          </p>
        </div>
      </SectionCard>

      {/* ── OUTREACH BOT PROMPT ── */}
      <SectionCard
        icon={Send}
        title="Outreach Bot Prompt"
        subtitle="Controls how the Outreach Bot drafts emails and texts. It always receives your live pipeline — active loans, contact counts, and selected contacts — as context."
        updatedAt={timestamps.outreach}
        saving={saving.outreach}
        onSave={saveOutreachPrompt}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-muted-foreground">
              {outreachIsCustom ? 'Custom prompt active' : 'Using default prompt'}
            </span>
            {outreachIsCustom && (
              <button
                onClick={resetOutreachPrompt}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground/80 transition-colors"
              >
                <RotateCcw size={11} /> Reset to default
              </button>
            )}
          </div>
          <textarea
            value={outreachPrompt}
            onChange={e => setOutreachPrompt(e.target.value)}
            rows={12}
            className="w-full bg-muted border border-input rounded px-3 py-2.5 text-xs font-mono text-foreground resize-y focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
            placeholder="You are Adam Styer&apos;s outreach assistant…"
            spellCheck={false}
          />
          <p className="mt-2 text-[11px] font-mono text-muted-foreground">
            Pipeline data (active loans, contact counts, selected contacts) is always appended automatically.
          </p>
        </div>
      </SectionCard>

      {/* ── DRIP HOLD LIST ── */}
      <div className="bg-card border border-input border-l-[3px] border-l-amber-500 rounded-r-lg p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-md bg-muted border border-input flex items-center justify-center">
            <Ban size={17} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-semibold text-foreground">Drip Hold List</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Emails on this list are skipped by all drip sends. Unsubscribe links add entries automatically.</p>
          </div>
        </div>

        {/* Add form */}
        <form onSubmit={addHoldEntry} className="flex gap-2 items-end mb-5">
          <div className="flex-1">
            <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={newHoldEmail}
              onChange={e => setNewHoldEmail(e.target.value)}
              placeholder="contact@example.com"
              required
              className="w-full bg-muted border border-input rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Reason (optional)</label>
            <input
              type="text"
              value={newHoldReason}
              onChange={e => setNewHoldReason(e.target.value)}
              placeholder="e.g. client request"
              className="w-full bg-muted border border-input rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={holdAdding || !newHoldEmail.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded text-xs font-mono font-medium bg-amber-500 text-zinc-900 hover:bg-amber-400 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {holdAdding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
            Add
          </button>
        </form>
        {holdError && <p className="text-red-400 text-xs font-mono mb-3">{holdError}</p>}

        {/* Suppressions list */}
        {suppressionsLoading ? (
          <p className="text-xs text-muted-foreground font-mono">Loading…</p>
        ) : suppressions.length === 0 ? (
          <p className="text-xs text-muted-foreground font-mono">No emails on hold.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {suppressions.map(s => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 bg-muted border border-input rounded">
                <div className="min-w-0">
                  <span className="text-sm text-foreground font-mono truncate">{s.email}</span>
                  {s.reason && <span className="text-xs text-muted-foreground font-mono ml-2">— {s.reason}</span>}
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className="text-[11px] text-muted-foreground font-mono">{fmtTime(s.added_at)}</span>
                  <button
                    onClick={() => removeHoldEntry(s.id)}
                    className="text-muted-foreground hover:text-red-400 transition-colors"
                    title="Remove from hold list"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── ORGANIZATION MEMBERS ── */}
      <div className="bg-card border border-input border-l-[3px] border-l-amber-500 rounded-r-lg p-6">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-sm font-mono font-semibold text-foreground uppercase tracking-wider">Organization Members</h2>
          <span className="text-xs text-muted-foreground font-mono lowercase">{myRole}</span>
        </div>

        {/* Members list */}
        <div className="mb-6 flex flex-col gap-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2 bg-muted border border-input rounded">
              <div>
                <span className="text-sm text-foreground font-mono">{m.full_name || m.email}</span>
                {m.full_name && <span className="text-xs text-muted-foreground font-mono ml-2">{m.email}</span>}
              </div>
              {canManageMembers && m.role !== 'owner' ? (
                <select
                  value={m.role}
                  onChange={e => handleRoleChange(m.id, e.target.value)}
                  className="bg-card border border-input text-foreground/80 px-2 py-1 rounded text-xs font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="admin">admin</option>
                  <option value="member">member</option>
                </select>
              ) : (
                <span className={`text-xs font-mono px-2 py-1 border rounded ${m.role === 'owner' ? 'text-amber-400 border-amber-500/40' : 'text-muted-foreground border-input'}`}>{m.role}</span>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-xs text-muted-foreground font-mono">No members loaded.</p>
          )}
        </div>

        {/* Invite form — only for owner/admin */}
        {canManageMembers && (
          <form onSubmit={handleInvite} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Invite by Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="janie@example.com"
                required
                className="w-full bg-muted border border-input rounded px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">Role</label>
              <select
                value={inviteRole}
                onChange={e => setInviteRole(e.target.value)}
                className="bg-muted border border-input text-foreground px-3 py-2 rounded text-sm font-mono focus:outline-none focus:border-amber-500"
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

      {/* ── EMAIL DRAFTS ── */}
      <div className="bg-card border border-input border-l-[3px] border-l-amber-500 rounded-r-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-md bg-muted border border-input flex items-center justify-center">
            <Mail size={17} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-mono font-semibold text-foreground">Email Drafts</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Automations (contract received, pre-approval, final CD, etc.) generate drafts here — not sent automatically.
              Review in the Drafts inbox, then open in Outlook or copy the HTML and send from your own inbox.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#4ADE80]/10 text-[#4ADE80] border border-[#4ADE80]/40">
            <CheckCircle size={11} /> Active
          </span>
          <a
            href="/dashboard/drafts"
            className="text-xs text-amber-400 hover:text-amber-300 font-mono underline underline-offset-2"
          >
            Open Drafts inbox →
          </a>
        </div>
      </div>
    </div>
  )
}
