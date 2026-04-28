'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { DEFAULT_FEATURES, type OrgFeatures } from '@/lib/features/types'

interface OrgContext {
  organizationId: string | null
  role: 'owner' | 'admin' | 'member' | null
  userId: string | null
  features: OrgFeatures
  loading: boolean
}

const Ctx = createContext<OrgContext>({
  organizationId: null,
  role: null,
  userId: null,
  features: DEFAULT_FEATURES,
  loading: true,
})

export function OrgProvider({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<OrgContext>({
    organizationId: null,
    role: null,
    userId: null,
    features: DEFAULT_FEATURES,
    loading: true,
  })

  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setCtx({
            organizationId: data.organizationId,
            role: data.role,
            userId: data.userId,
            features: data.features ?? DEFAULT_FEATURES,
            loading: false,
          })
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
