'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

type Tab = 'login' | 'register'

interface Props {
  initialTab: Tab
  onClose: () => void
}

export default function AuthModal({ initialTab, onClose }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>(initialTab)

  const handleSuccess = useCallback(() => {
    onClose()
    router.refresh()
  }, [onClose, router])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Authentication"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        background: 'rgba(6,14,31,0.88)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-in w-full max-w-sm relative p-8"
        style={{
          background: 'var(--color-card)',
          border: '1px solid var(--color-border-2)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="btn-ghost absolute top-4 right-4 p-1.5"
        >
          <X size={18} />
        </button>

        {/* Таб-switcher */}
        <div
          className="flex rounded-[--radius-md] p-1 mb-6"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          {(['login', 'register'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2 text-sm font-semibold capitalize transition-all duration-150"
              style={
                tab === t
                  ? {
                      background: 'var(--color-accent)',
                      color: '#1A1000',
                      borderRadius: 'var(--radius-sm)',
                    }
                  : { color: 'var(--color-text-muted)' }
              }
            >
              {t === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {tab === 'login' && <LoginForm onSuccess={handleSuccess} />}
        {tab === 'register' && <RegisterForm onSuccess={handleSuccess} />}

        {/* switcher */}
        <p className="text-center  mt-4" style={{ color: 'var(--color-text-dim)' }}>
          {tab === 'login' ? (
            <>
              No account?{' '}
              <button
                onClick={() => setTab('register')}
                className="underline"
                style={{ color: 'var(--color-accent)' }}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already a trainer?{' '}
              <button
                onClick={() => setTab('login')}
                className="underline"
                style={{ color: 'var(--color-accent)' }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
