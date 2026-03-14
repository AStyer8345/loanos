'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Pencil, X, ArrowRight, ArrowLeft } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

type ContentType = 'blog' | 'video' | 'social' | 'email' | 'guide'
type Column = 'ideas' | 'wip' | 'pub'

interface ContentItem {
  id: string
  title: string
  type: ContentType
  notes: string
  date: string
}

interface BoardState {
  ideas: ContentItem[]
  wip: ContentItem[]
  pub: ContentItem[]
}

const BLANK_BOARD: BoardState = { ideas: [], wip: [], pub: [] }

// ── Constants ─────────────────────────────────────────────────────────────────

const TYPE_STYLES: Record<ContentType, string> = {
  blog:   'bg-blue-900/40 text-blue-300',
  video:  'bg-orange-900/40 text-orange-300',
  social: 'bg-purple-900/40 text-purple-300',
  email:  'bg-emerald-900/40 text-emerald-300',
  guide:  'bg-yellow-900/40 text-yellow-300',
}

const TYPE_LABELS: Record<ContentType, string> = {
  blog: 'Blog', video: 'Video', social: 'Social', email: 'Email', guide: 'Guide',
}

const COL_META: Record<Column, { label: string; sub: string }> = {
  ideas: { label: 'Ideas',       sub: 'Topics to create' },
  wip:   { label: 'In Progress', sub: 'Being worked on'  },
  pub:   { label: 'Published',   sub: 'Live / sent'      },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Supabase ──────────────────────────────────────────────────────────────────

function useSupabase() {
  return useMemo(() => createClient(), [])
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  targetCol: Column
  initial?: ContentItem | null
  onSave: (item: ContentItem) => void
  onClose: () => void
}

function ItemModal({ targetCol, initial, onSave, onClose }: ModalProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [type, setType]   = useState<ContentType>(initial?.type ?? 'blog')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  function handleSave() {
    if (!title.trim()) return
    onSave({
      id:    initial?.id ?? uid(),
      title: title.trim(),
      type,
      notes: notes.trim(),
      date:  new Date().toISOString(),
    })
  }

  const colLabel = COL_META[targetCol].label
  const isEdit   = !!initial

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-sm font-semibold text-zinc-100 font-mono">
              {isEdit ? 'Edit Item' : `Add to ${colLabel}`}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">{isEdit ? '' : COL_META[targetCol].sub}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">Title / Topic</label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="e.g. How to read a Closing Disclosure"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as ContentType)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-yellow-500 transition-colors"
            >
              <option value="blog">Blog Post</option>
              <option value="video">Video</option>
              <option value="social">Social Series</option>
              <option value="email">Email / Newsletter</option>
              <option value="guide">Guide / Lead Magnet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1.5 uppercase tracking-wider">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Outline, links, ideas, next steps…"
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="px-4 py-2 text-xs font-mono text-zinc-900 bg-yellow-500 hover:bg-yellow-400 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isEdit ? 'Save' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Card ──────────────────────────────────────────────────────────────────────

interface CardProps {
  item: ContentItem
  col: Column
  onEdit: () => void
  onDelete: () => void
  onMoveLeft: (() => void) | null
  onMoveRight: (() => void) | null
}

function ContentCard({ item, onEdit, onDelete, onMoveLeft, onMoveRight }: CardProps) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm text-zinc-100 leading-snug flex-1">{item.title}</p>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {onMoveLeft && (
            <button onClick={onMoveLeft} title="Move left" className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors">
              <ArrowLeft size={12} />
            </button>
          )}
          {onMoveRight && (
            <button onClick={onMoveRight} title="Move right" className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors">
              <ArrowRight size={12} />
            </button>
          )}
          <button onClick={onEdit} title="Edit" className="p-1 rounded text-zinc-500 hover:text-zinc-200 transition-colors">
            <Pencil size={12} />
          </button>
          <button onClick={onDelete} title="Delete" className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors">
            <X size={12} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${TYPE_STYLES[item.type]}`}>
          {TYPE_LABELS[item.type]}
        </span>
        <span className="text-xs text-zinc-600 font-mono">{fmtDate(item.date)}</span>
      </div>
      {item.notes && (
        <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{item.notes}</p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ContentBoardPage() {
  const supabase = useSupabase()
  const [board, setBoard] = useState<BoardState>(BLANK_BOARD)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Modal state: null = closed, { col, item? } = open
  const [modal, setModal] = useState<{ col: Column; item?: ContentItem; idx?: number } | null>(null)

  const COLS: Column[] = ['ideas', 'wip', 'pub']

  // ── Load ──
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      supabase
        .from('mcc_state')
        .select('value')
        .eq('user_id', user.id)
        .eq('key', 'content_board')
        .single()
        .then(({ data }) => {
          if (data) setBoard(data.value as BoardState)
          setLoading(false)
        })
    })
  }, [supabase])

  // ── Persist ──
  function save(next: BoardState) {
    setBoard(next)
    if (!userId) return
    supabase
      .from('mcc_state')
      .upsert({ user_id: userId, key: 'content_board', value: next }, { onConflict: 'user_id,key' })
  }

  // ── Card actions ──
  function addItem(item: ContentItem, col: Column) {
    const next = { ...board, [col]: [...board[col], item] }
    save(next)
  }

  function updateItem(item: ContentItem, col: Column, idx: number) {
    const updated = [...board[col]]
    updated[idx] = item
    save({ ...board, [col]: updated })
  }

  function deleteItem(col: Column, idx: number) {
    if (!confirm('Delete this item?')) return
    const updated = [...board[col]]
    updated.splice(idx, 1)
    save({ ...board, [col]: updated })
  }

  function moveItem(fromCol: Column, idx: number, toCol: Column) {
    const item = { ...board[fromCol][idx], date: new Date().toISOString() }
    const fromArr = [...board[fromCol]]
    fromArr.splice(idx, 1)
    const toArr = [...board[toCol], item]
    save({ ...board, [fromCol]: fromArr, [toCol]: toArr })
  }

  const totalCount = board.ideas.length + board.wip.length + board.pub.length

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-xs font-mono text-zinc-500">LOADING…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 lg:p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-mono font-bold text-zinc-100">Content Board</h1>
          <p className="text-xs font-mono text-zinc-500 mt-0.5">
            Track ideas through drafting to published
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-zinc-500">{totalCount} items</span>
          <span className="text-xs font-mono text-zinc-600">
            {board.pub.length} published · {board.wip.length} in progress · {board.ideas.length} ideas
          </span>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {COLS.map(col => {
          const items = board[col]
          const prevCol = col === 'wip' ? 'ideas' : col === 'pub' ? 'wip' : null
          const nextCol = col === 'ideas' ? 'wip' : col === 'wip' ? 'pub' : null

          return (
            <div key={col} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {/* Column header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div>
                  <span className="text-xs font-mono font-semibold text-zinc-300 uppercase tracking-wider">
                    {COL_META[col].label}
                  </span>
                  <span className="ml-2 text-xs font-mono text-zinc-600">{items.length}</span>
                </div>
                <span className="text-xs text-zinc-600">{COL_META[col].sub}</span>
              </div>

              {/* Cards */}
              <div className="p-3 space-y-2 min-h-[120px]">
                {items.length === 0 && (
                  <p className="text-xs text-zinc-700 font-mono py-2">Nothing here yet.</p>
                )}
                {[...items].reverse().map((item, ri) => {
                  const idx = items.length - 1 - ri
                  return (
                    <ContentCard
                      key={item.id}
                      item={item}
                      col={col}
                      onEdit={() => setModal({ col, item, idx })}
                      onDelete={() => deleteItem(col, idx)}
                      onMoveLeft={prevCol ? () => moveItem(col, idx, prevCol as Column) : null}
                      onMoveRight={nextCol ? () => moveItem(col, idx, nextCol as Column) : null}
                    />
                  )
                })}
              </div>

              {/* Add button */}
              <div className="px-3 pb-3">
                <button
                  onClick={() => setModal({ col })}
                  className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-zinc-700 hover:border-yellow-500/60 rounded-lg text-xs font-mono text-zinc-600 hover:text-yellow-500 transition-colors"
                >
                  <Plus size={12} />
                  Add {col === 'pub' ? 'published' : col === 'wip' ? 'draft' : 'idea'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {modal && (
        <ItemModal
          targetCol={modal.col}
          initial={modal.item ?? null}
          onSave={item => {
            if (modal.item !== undefined && modal.idx !== undefined) {
              updateItem(item, modal.col, modal.idx)
            } else {
              addItem(item, modal.col)
            }
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
