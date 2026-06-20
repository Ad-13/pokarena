'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function AutoOpenAuthModal() {
  const { openModal } = useAuth()

  useEffect(() => {
    openModal('login')
  }, [openModal])

  return null
}
