'use client'

import { useState, useEffect, useCallback } from 'react'
import StatusBar from '@/components/automations/StatusBar'
import AutomationGroup from '@/components/automations/AutomationGroup'
import type { AutomationRegistryRow } from '@/lib/automations/types'
import { AUTOMATION_GROUPS } from '@/lib/automations/groups'

const GOLD = '#C9A84C'
const MONO = "'IBM Plex Mono', 'Courier New', monospace"

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-t border-input/50 animate-pulse">
      <div className="w-2 h-2 rounded-full bg-zinc-800" />
      <div className="h-3 w-48 bg-zinc-800 rounded" />
      <div className="ml-auto h-3 w-16 bg-zinc-800 rounded" />
    </div>
  )
}

function SkeletonGroup() {
  return (
    <div className="border border-input" style={{ borderLeft: `3px solid ${GOLD}` }}>
      <div className="px-4 py-2.5 flex items-center justify-between animate-pulse">
        <div className="h-3 w-32 bg-zinc-800 rounded" />
        <div className="h-3 w-4 bg-zinc-800 rounded" />
      </div>
      <SkeletonRow />
      <SkeletonRow />
      <SkeletonRow />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <SkeletonGroup />
      <SkeletonGroup />
      <SkeletonGroup />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<AutomationRegistryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchAutomations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/automations/registry')
      if (!res.ok) throw new Error(`Failed to fetch automations: ${res.status}`)
      const data = await res.json() as { automations: AutomationRegistryRow[] }
      setAutomations(data.automations ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchAutomations()
  }, [fetchAutomations])

  function handleToggle(id: string) {
    setExpandedId(prev => (prev === id ? null : id))
  }

  async function handleUpdate(id: string, updates: Partial<AutomationRegistryRow>) {
    setSavingId(id)
    try {
      const res = await fetch(`/api/automations/registry/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error(`Save failed: ${res.status}`)
      const updated = await res.json() as AutomationRegistryRow
      setAutomations(prev =>
        prev.map(a => (a.id === id ? { ...a, ...updated } : a))
      )
    } catch (err) {
      console.error('Failed to save automation:', err)
    } finally {
      setSavingId(null)
    }
  }

  async function handleBulkAction(action: 'pause_all' | 'resume_all') {
    setBulkLoading(true)
    try {
      const res = await fetch('/api/automations/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error(`Bulk action failed: ${res.status}`)
      await fetchAutomations()
    } catch (err) {
      console.error('Bulk action error:', err)
    } finally {
      setBulkLoading(false)
    }
  }

  // Group and sort automations by AUTOMATION_GROUPS order
  const grouped = AUTOMATION_GROUPS.map(group => ({
    groupName: group.key,
    automations: automations
      .filter(a => a.group_name === group.key)
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter(g => g.automations.length > 0)

  // Also catch any automations not in a known group
  const knownGroups = new Set(AUTOMATION_GROUPS.map(g => g.key))
  const ungrouped = automations.filter(a => !knownGroups.has(a.group_name))
  if (ungrouped.length > 0) {
    const extraGroups = new Map<string, AutomationRegistryRow[]>()
    for (const a of ungrouped) {
      const list = extraGroups.get(a.group_name) ?? []
      list.push(a)
      extraGroups.set(a.group_name, list)
    }
    extraGroups.forEach((list, key) => {
      grouped.push({ groupName: key, automations: list })
    })
  }

  return (
    <div className="min-h-screen bg-[var(--bg)]" style={{ fontFamily: MONO }}>
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="mb-6">
          <h1
            className="text-sm font-bold tracking-widest"
            style={{ color: GOLD, letterSpacing: '0.2em' }}
          >
            AUTOMATION COMMAND CENTER
          </h1>
          <p className="text-zinc-600 text-xs mt-1" style={{ fontFamily: MONO }}>
            {automations.length > 0
              ? `${automations.length} automations across ${grouped.length} groups`
              : loading
              ? 'loading...'
              : 'no automations found'}
          </p>
        </div>

        {/* Status bar */}
        {!loading && !error && (
          <div className="mb-4">
            <StatusBar
              automations={automations}
              onBulkAction={handleBulkAction}
              loading={bulkLoading}
            />
          </div>
        )}

        {/* Loading state */}
        {loading && <LoadingSkeleton />}

        {/* Error state */}
        {!loading && error && (
          <div className="border border-input px-4 py-6 text-center">
            <p className="text-red-400 text-xs mb-3" style={{ fontFamily: MONO }}>
              {error}
            </p>
            <button
              onClick={() => void fetchAutomations()}
              className="px-4 py-1.5 text-xs border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
              style={{ fontFamily: MONO }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Automation groups */}
        {!loading && !error && (
          <div className="flex flex-col gap-3">
            {grouped.length === 0 ? (
              <div className="border border-input px-4 py-8 text-center">
                <p className="text-zinc-600 text-xs" style={{ fontFamily: MONO }}>
                  no automations registered
                </p>
              </div>
            ) : (
              grouped.map(({ groupName, automations: groupAutomations }) => (
                <AutomationGroup
                  key={groupName}
                  groupName={groupName}
                  automations={groupAutomations}
                  expandedId={expandedId}
                  onToggle={handleToggle}
                  onUpdate={handleUpdate}
                  savingId={savingId}
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
