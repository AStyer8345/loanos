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

export type ActiveRecord = {
  id: string
  type: 'contact' | 'loan'
  name: string
}

type ChatState = {
  selectedContacts: SelectedContact[]
  setSelectedContacts: (contacts: SelectedContact[]) => void
  clearSelected: () => void
  activeRecord: ActiveRecord | null
  setActiveRecord: (record: ActiveRecord | null) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  openWithContacts: (contacts: SelectedContact[]) => void
}

const ChatCtx = createContext<ChatState | null>(null)

export function OutreachChatProvider({ children }: { children: ReactNode }) {
  const [selectedContacts, setSelectedContacts] = useState<SelectedContact[]>([])
  const [activeRecord, setActiveRecord] = useState<ActiveRecord | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  const clearSelected = useCallback(() => setSelectedContacts([]), [])

  const openWithContacts = useCallback((contacts: SelectedContact[]) => {
    setSelectedContacts(contacts)
    setIsOpen(true)
  }, [])

  return (
    <ChatCtx.Provider
      value={{
        selectedContacts,
        setSelectedContacts,
        clearSelected,
        activeRecord,
        setActiveRecord,
        isOpen,
        setIsOpen,
        openWithContacts,
      }}
    >
      {children}
    </ChatCtx.Provider>
  )
}

export function useOutreachChat() {
  const ctx = useContext(ChatCtx)
  if (!ctx) throw new Error('useOutreachChat must be used within OutreachChatProvider')
  return ctx
}
