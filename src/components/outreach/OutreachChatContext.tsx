'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type SelectedContact = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
  stage: string | null
  contact_type: string | null
}

type OutreachChatState = {
  selectedContacts: SelectedContact[]
  setSelectedContacts: (contacts: SelectedContact[]) => void
  clearSelected: () => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  openWithContacts: (contacts: SelectedContact[]) => void
}

const OutreachChatCtx = createContext<OutreachChatState | null>(null)

export function OutreachChatProvider({ children }: { children: ReactNode }) {
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const clearSelected = useCallback(() => setSelectedContacts([]), [])

  const openWithContacts = useCallback((contacts: SelectedContact[]) => {
    setSelectedContacts(contacts)
    setIsOpen(true)
  }, [])

  return (
    <OutreachChatCtx.Provider
      value={{
        selectedContacts,
        setSelectedContacts,
        clearSelected,
        isOpen,
        setIsOpen,
        openWithContacts,
      }}
    >
      {children}
    </OutreachChatCtx.Provider>
  )
}

export function useOutreachChat() {
  const ctx = useContext(OutreachChatCtx)
  if (!ctx) throw new Error('useOutreachChat must be used within OutreachChatProvider')
  return ctx
}
