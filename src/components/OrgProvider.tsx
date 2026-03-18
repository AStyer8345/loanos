'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface OrgContext {
  organizationId: string | null
  role: 'owner' | 'admin' | 'member' | null
  userId: string | null
  loading: boolean
}

const Ctx = createContext<OrgContext>({ organizationId: null, role: null, userId: null, loading: true })

export function OrgProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<OrgContext>({ organizationId: null, role: null, userId: null, loading: true })

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCtx({ organizationId: data.organizationId, role: data.role, userId: data.userId, loading: false })
        } else {
          setCtx(prev => ({ ...prev, loading: false }))
        }
      })
      .catch(() => setCtx(prev => ({ ...prev, loading: false })))
  }, [])

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export function useOrg() {
  return useContext(Ctx)
}
