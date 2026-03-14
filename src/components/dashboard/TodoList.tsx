'use client'

import { useState, useEffect } from 'react'
import { Plus, Circle, Trash2, AlertTriangle, Loader2 } from 'lucide-react'

interface TodoItem {
  id: string
  text: string
  is_complete: boolean
  is_urgent: boolean
  created_at: string
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

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">To-Do</span>
          {todos.length > 0 && (
            <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
              {todos.length}
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
        {/* Urgent items first */}
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
        {/* Normal items */}
        {normal.map(todo => (
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
