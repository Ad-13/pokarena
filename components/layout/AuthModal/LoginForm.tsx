'use client'

import { useState, useEffect, useActionState } from 'react'
import { login } from '@/actions/auth'
import { Field, PasswordInput, SubmitBtn, ErrorMsg } from './FormField'

interface Props {
  onSuccess: () => void
}

export default function LoginForm({ onSuccess }: Props) {
  const [showPw, setShowPw] = useState(false)
  const [state, action, pending] = useActionState(login, null)

  useEffect(() => {
    if (state?.data) onSuccess()
  }, [state, onSuccess])

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Email">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="trainer@pokarena.com"
          className="input-field"
        />
      </Field>

      <Field label="Password">
        <PasswordInput name="password" show={showPw} onToggle={() => setShowPw((v) => !v)} />
      </Field>

      {state?.error && <ErrorMsg>{state.error}</ErrorMsg>}

      <SubmitBtn pending={pending}>Sign In</SubmitBtn>
    </form>
  )
}
