'use client'

import { useState, useEffect } from 'react'
import { Plus, Circle, Trash2, AlertTriangle, Loader2, Bot, CalendarClock } from 'lucide-react'

interface TodoItem {
  id: string
  text: string
  is_complete: boolean
  is_urgent: boolean
  created_at: string
  due_at: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'completed' | 'dismissed'
}

type TaskFilter = 'open' | 'overdue' | 'today' | 'upcoming'

// Parses "[DOMAIN] YYYY-MM-DD — action text" format written by agents
function parseAgentItem(text: string): { domain: string; body: string } | null {
  const m = text.match(/^\[([A-Z-]+)\]\s+\d{4}-\d{2}-\d{2}\s+—\s+(.+)$/)
  if (!m) return null
  return { domain: m[1], body: m[2] }
}

const DOMAIN_COLORS: Record<string, string> = {
  'SOCIAL':     'bg-blue-900/40 text-blue-300 border-blue-700/50',
  'CRM':        'bg-purple-900/40 text-purple-300 border-purple-700/50',
  'LEAD-GEN':   'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  'SEO':        'bg-orange-900/40 text-orange-300 border-orange-700/50',
  'ENTERPRISE': 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
}

export default function TodoList() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [input, setInput] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [dueAt, setDueAt] = useState('')
  const [filter, setFilter] = useState<TaskFilter>('open')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/todos?filter=${filter}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTodos(data) })
      .finally(() => setLoading(false))
  }, [filter])

  async function addTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: input.trim(), priority: isUrgent ? 'urgent' : 'medium', due_at: dueAt || null }),
      })
      const item = await res.json()
      if (!res.ok) throw new Error(item.error || 'Could not create task')
      setTodos(t => [item, ...t])
      setInput('')
      setIsUrgent(false)
      setDueAt('')
    } finally {
      setAdding(false)
    }
  }

  async function toggleComplete(todo: TodoItem) {
    const updated = { status: 'completed' }
    await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    setTodos(t => t.filter(item => item.id !== todo.id))
  }

  async function deleteTodo(id: string) {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' })
    setTodos(t => t.filter(item => item.id !== id))
  }

  async function toggleUrgent(todo: TodoItem) {
    const updated = { is_urgent: !todo.is_urgent, priority: !todo.is_urgent ? 'urgent' : 'medium' }
    await fetch(`/api/todos/${todo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    setTodos(t => t.map(item => item.id === todo.id ? { ...item, is_urgent: !item.is_urgent } : item))
  }

  const urgent = todos.filter(t => t.is_urgent)
  const normal = todos.filter(t => !t.is_urgent)

  const agentItems = todos.filter(t => parseAgentItem(t.text))
  const manualItems = todos.filter(t => !parseAgentItem(t.text))

  function dueLabel(dueAt: string | null) {
    if (!dueAt) return null
    const due = new Date(dueAt)
    const overdue = due.getTime() < Date.now()
    return { overdue, text: `${overdue ? 'Overdue · ' : ''}${due.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` }
  }

  return (
    <div className="bg-card border border-input rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">To-Do</span>
          {todos.length > 0 && (
            <span className="text-xs font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              {todos.length}
            </span>
          )}
          {agentItems.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-mono bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
              <Bot className="w-3 h-3 text-[#C9A84C]" />{agentItems.length} from agents
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1 mb-3 overflow-x-auto" aria-label="Task filters">
        {(['open', 'overdue', 'today', 'upcoming'] as TaskFilter[]).map(value => (
          <button key={value} type="button" onClick={() => setFilter(value)}
            className={`rounded px-2 py-1 text-[10px] font-mono uppercase ${filter === value ? 'bg-[#C9A84C]/15 text-[#C9A84C]' : 'text-muted-foreground hover:bg-muted'}`}>
            {value}
          </button>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={addTodo} className="grid grid-cols-[1fr_auto_auto] gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add task..."
          className="flex-1 bg-muted border border-input rounded px-3 py-1.5 text-sm font-mono text-foreground placeholder-zinc-600 focus:outline-none focus:border-yellow-600 transition-colors"
        />
        <button
          type="button"
          onClick={() => setIsUrgent(u => !u)}
          title="Mark as urgent"
          className={`px-2 rounded border transition-colors ${isUrgent ? 'bg-amber-900/40 border-amber-600 text-amber-400' : 'bg-muted border-input text-muted-foreground hover:text-muted-foreground'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </button>
        <button
          type="submit"
          disabled={adding || !input.trim()}
          className="bg-muted border border-input hover:border-yellow-600 text-foreground/80 hover:text-yellow-400 px-2 rounded transition-colors disabled:opacity-50"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
        <label className="col-span-3 flex items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" />
          <span>Due</span>
          <input type="datetime-local" value={dueAt} onChange={e => setDueAt(e.target.value)}
            className="min-w-0 flex-1 bg-muted border border-input rounded px-2 py-1 text-xs text-foreground [color-scheme:dark]" />
        </label>
      </form>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}
        </div>
      )}

      {!loading && todos.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-6">
          <div className="font-mono text-sm">No open tasks</div>
          <div className="font-mono text-xs mt-1 text-zinc-700">Add tasks above to track your day</div>
        </div>
      )}

      <div className="space-y-1 flex-1 overflow-y-auto">
        {/* Agent action items */}
        {agentItems.length > 0 && (
          <>
            <div className="flex items-center gap-1.5 pt-1 pb-0.5">
              <Bot className="w-3 h-3 text-[#C9A84C]" />
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Agent Actions</span>
            </div>
            {agentItems.map(todo => {
              const parsed = parseAgentItem(todo.text)!
              const colorClass = DOMAIN_COLORS[parsed.domain] ?? 'bg-muted/60 text-muted-foreground border-input/50'
              return (
                <div key={todo.id} className="flex items-start gap-2 group rounded px-2 py-2 hover:bg-muted/50 transition-colors border border-input rounded-md">
                  <button onClick={() => toggleComplete(todo)} className="text-muted-foreground hover:text-emerald-500 flex-shrink-0 transition-colors mt-0.5">
                    <Circle className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded border ${colorClass}`}>
                        {parsed.domain}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-foreground leading-relaxed">{parsed.body}</span>
                  </div>
                  <button onClick={() => deleteTodo(todo.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all mt-0.5">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </>
        )}

        {/* Manual todos — urgent first */}
        {(urgent.length > 0 || manualItems.length > 0) && agentItems.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 pb-0.5">
            <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">My Tasks</span>
          </div>
        )}
        {urgent.map(todo => (
          <div key={todo.id} className="flex items-center gap-2 group bg-amber-900/10 border border-amber-800/30 rounded px-2 py-1.5">
            <button onClick={() => toggleComplete(todo)} className="text-muted-foreground hover:text-emerald-500 flex-shrink-0 transition-colors">
              <Circle className="w-3.5 h-3.5" />
            </button>
            <span className="flex-1 min-w-0 text-sm font-mono text-foreground">
              <span className="block truncate">{todo.text}</span>
              {dueLabel(todo.due_at) && <span className={`block text-[10px] mt-0.5 ${dueLabel(todo.due_at)!.overdue ? 'text-red-400' : 'text-muted-foreground'}`}>{dueLabel(todo.due_at)!.text}</span>}
            </span>
            <button onClick={() => toggleUrgent(todo)} title="Remove urgent flag" className="text-amber-500 opacity-70 hover:opacity-100 flex-shrink-0">
              <AlertTriangle className="w-3 h-3" />
            </button>
            <button onClick={() => deleteTodo(todo.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {normal.filter(t => !parseAgentItem(t.text)).map(todo => (
          <div key={todo.id} className="flex items-center gap-2 group rounded px-2 py-1.5 hover:bg-muted transition-colors">
            <button onClick={() => toggleComplete(todo)} className="text-muted-foreground hover:text-emerald-500 flex-shrink-0 transition-colors">
              <Circle className="w-3.5 h-3.5" />
            </button>
            <span className="flex-1 min-w-0 text-sm font-mono text-foreground">
              <span className="block truncate">{todo.text}</span>
              {dueLabel(todo.due_at) && <span className={`block text-[10px] mt-0.5 ${dueLabel(todo.due_at)!.overdue ? 'text-red-400' : 'text-muted-foreground'}`}>{dueLabel(todo.due_at)!.text}</span>}
            </span>
            <button onClick={() => toggleUrgent(todo)} title="Flag urgent" className="text-zinc-700 hover:text-amber-500 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all">
              <AlertTriangle className="w-3 h-3" />
            </button>
            <button onClick={() => deleteTodo(todo.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
