'use client'

import { useState, useEffect } from 'react'
import { Plus, Circle, Trash2, AlertTriangle, Loader2, Bot } from 'lucide-react'

interface TodoItem {
  id: string
  text: string
  is_complete: boolean
  is_urgent: boolean
  created_at: string
}

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
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch('/api/todos')
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setTodos(data) })
      .finally(() => setLoading(false))
  }, [])

  async function addTodo(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setAdding(true)
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim(), is_urgent: isUrgent }),
      })
      const item = await res.json()
      setTodos(t => [item, ...t])
      setInput('')
      setIsUrgent(false)
    } finally {
      setAdding(false)
    }
  }

  async function toggleComplete(todo: TodoItem) {
    const updated = { is_complete: !todo.is_complete, completed_at: !todo.is_complete ? new Date().toISOString() : null }
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
    const updated = { is_urgent: !todo.is_urgent }
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

  return (
    <div className="bg-card border border-zinc-700 rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">To-Do</span>
          {todos.length > 0 && (
            <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              {todos.length}
            </span>
          )}
          {agentItems.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              <Bot className="w-3 h-3 text-[#C9A84C]" />{agentItems.length} from agents
            </span>
          )}
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={addTodo} className="flex gap-2 mb-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add task..."
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-yellow-600 transition-colors"
        />
        <button
          type="button"
          onClick={() => setIsUrgent(u => !u)}
          title="Mark as urgent"
          className={`px-2 rounded border transition-colors ${isUrgent ? 'bg-amber-900/40 border-amber-600 text-amber-400' : 'bg-zinc-800 border-zinc-700 text-zinc-600 hover:text-zinc-400'}`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
        </button>
        <button
          type="submit"
          disabled={adding || !input.trim()}
          className="bg-zinc-800 border border-zinc-700 hover:border-yellow-600 text-zinc-300 hover:text-yellow-400 px-2 rounded transition-colors disabled:opacity-50"
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>

      {loading && (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-8 bg-zinc-800 rounded animate-pulse" />)}
        </div>
      )}

      {!loading && todos.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 py-6">
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
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Agent Actions</span>
            </div>
            {agentItems.map(todo => {
              const parsed = parseAgentItem(todo.text)!
              const colorClass = DOMAIN_COLORS[parsed.domain] ?? 'bg-zinc-800/60 text-zinc-400 border-zinc-600/50'
              return (
                <div key={todo.id} className="flex items-start gap-2 group rounded px-2 py-2 hover:bg-zinc-800/50 transition-colors border border-input rounded-md">
                  <button onClick={() => toggleComplete(todo)} className="text-zinc-500 hover:text-emerald-500 flex-shrink-0 transition-colors mt-0.5">
                    <Circle className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border ${colorClass}`}>
                        {parsed.domain}
                      </span>
                    </div>
                    <span className="text-xs font-mono text-zinc-200 leading-relaxed">{parsed.body}</span>
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
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">My Tasks</span>
          </div>
        )}
        {urgent.map(todo => (
          <div key={todo.id} className="flex items-center gap-2 group bg-amber-900/10 border border-amber-800/30 rounded px-2 py-1.5">
            <button onClick={() => toggleComplete(todo)} className="text-zinc-500 hover:text-emerald-500 flex-shrink-0 transition-colors">
              <Circle className="w-3.5 h-3.5" />
            </button>
            <span className="flex-1 text-sm font-mono text-zinc-200 truncate">{todo.text}</span>
            <button onClick={() => toggleUrgent(todo)} title="Remove urgent flag" className="text-amber-500 opacity-70 hover:opacity-100 flex-shrink-0">
              <AlertTriangle className="w-3 h-3" />
            </button>
            <button onClick={() => deleteTodo(todo.id)} className="text-zinc-700 hover:text-red-400 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-all">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
        {normal.filter(t => !parseAgentItem(t.text)).map(todo => (
          <div key={todo.id} className="flex items-center gap-2 group rounded px-2 py-1.5 hover:bg-zinc-800 transition-colors">
            <button onClick={() => toggleComplete(todo)} className="text-zinc-500 hover:text-emerald-500 flex-shrink-0 transition-colors">
              <Circle className="w-3.5 h-3.5" />
            </button>
            <span className="flex-1 text-sm font-mono text-zinc-200 truncate">{todo.text}</span>
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
