'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { SessionUser } from '@/types'
import AuthModal from '@/components/layout/AuthModal'

type ModalTab = 'login' | 'register'

interface AuthContextValue {
  session: SessionUser | null
  openModal: (tab?: ModalTab) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface Props {
  session: SessionUser | null
  children: React.ReactNode
}

export function AuthModalProvider({ session, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [tab, setTab] = useState<ModalTab>('login')

  const openModal = useCallback((t: ModalTab = 'login') => {
    setTab(t)
    setIsOpen(true)
  }, [])

  return (
    <AuthContext.Provider value={{ session, openModal }}>
      {children}
      {isOpen && <AuthModal initialTab={tab} onClose={() => setIsOpen(false)} />}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthModalProvider>')
  return ctx
}
