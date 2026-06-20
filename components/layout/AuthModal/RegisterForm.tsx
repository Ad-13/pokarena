'use client'

import { useState, useEffect, useActionState } from 'react'
import { register } from '@/actions/auth'
import { Field, PasswordInput, SubmitBtn, ErrorMsg } from './FormField'

interface Props {
  onSuccess: () => void
}

export default function RegisterForm({ onSuccess }: Props) {
  const [showPw, setShowPw] = useState(false)
  const [state, action, pending] = useActionState(register, null)

  useEffect(() => {
    if (state?.data) onSuccess()
  }, [state, onSuccess])

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Trainer name">
        <input
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="AshKetchum"
          className="input-field"
        />
      </Field>

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

      <SubmitBtn pending={pending}>Create Account</SubmitBtn>
    </form>
  )
}
