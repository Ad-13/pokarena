'use client'

import { AlertTriangle } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  message?: string
}

export default function BattleGuardModal({
  open,
  onClose,
  title = 'Battle in Progress',
  message = 'End the battle before leaving this page.',
}: Props) {
  if (!open) return null

  return createPortal(
    <div className="battle-modal-backdrop" role="dialog" aria-modal="true" aria-label={title || 'Battle notice'}>
      <div className="battle-modal battle-confirm-modal">
        <div className="battle-warning-icon">
          <AlertTriangle size={28} />
        </div>
        {title ? <h2>{title}</h2> : null}
        <p>{message}</p>
        <div className="battle-modal-actions">
          <button className="btn-primary" type="button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
