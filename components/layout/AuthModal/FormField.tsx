import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface FieldProps {
  label: string
  children: React.ReactNode
}

export function Field({ label, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

interface PasswordInputProps {
  name: string
  show: boolean
  onToggle: () => void
}

export function PasswordInput({ name, show, onToggle }: PasswordInputProps) {
  return (
    <div className="relative">
      <input
        name={name}
        type={show ? 'text' : 'password'}
        required
        autoComplete={name === 'password' ? 'current-password' : 'new-password'}
        placeholder="At least 6 characters"
        className="input-field pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-3 flex items-center"
        style={{ color: 'var(--color-text-dim)' }}
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

interface SubmitBtnProps {
  pending: boolean
  children: React.ReactNode
}

export function SubmitBtn({ pending, children }: SubmitBtnProps) {
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full justify-center mt-1">
      {pending && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

export function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-sm px-3 py-2"
      style={{
        color: 'var(--color-error)',
        background: 'var(--color-error-soft)',
        border: '1px solid rgba(255,107,107,0.25)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      {children}
    </p>
  )
}
