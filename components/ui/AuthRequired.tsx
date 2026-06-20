'use client'

import { useAuth } from '@/contexts/AuthContext'
import PokeballSvg from './PokeballSvg'

interface Props {
  message?: string
}

export default function AuthRequired({
  message = 'Sign in to continue',
}: Props) {
  const { openModal } = useAuth()

  return (
    <div className='flex flex-col items-center justify-center min-h-[60vh] text-center px-4'>
      <PokeballSvg
        size={64}
        className='pokeball-idle mb-6 opacity-60'
        clipId='auth-required-ball'
      />

      <h2
        className='font-display font-bold text-2xl mb-2'
        style={{ color: 'var(--color-text)' }}
      >
        Trainer login required
      </h2>
      <p
        className='text-sm mb-8 max-w-xs'
        style={{ color: 'var(--color-text-muted)' }}
      >
        {message}
      </p>

      <div className='flex gap-3'>
        <button onClick={() => openModal('login')} className='btn-primary'>
          Sign In
        </button>
        <button onClick={() => openModal('register')} className='btn-secondary'>
          Create Account
        </button>
      </div>
    </div>
  )
}
