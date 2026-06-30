'use client'

import { useCallback, useRef, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
}

export default function CyberCard({ children, className = '' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width - 0.5
    const y = (event.clientY - rect.top) / rect.height - 0.5

    el.style.setProperty('--rx', `${-y * 35}deg`)
    el.style.setProperty('--ry', `${x * 35}deg`)
  }, [])

  const handleLeave = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    el.style.setProperty('--rx', '0deg')
    el.style.setProperty('--ry', '0deg')
  }, [])

  return (
    <div
      ref={containerRef}
      className={`cyber-card-container ${className}`.trim()}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="cyber-card-face">
        <div className="cyber-card-glare" aria-hidden />
        <div className="cyber-card-scan-line" aria-hidden />
        <div className="cyber-card-cyber-lines" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="cyber-card-glows" aria-hidden>
          <div className="glow-1" />
          <div className="glow-2" />
          <div className="glow-3" />
        </div>
        <div className="cyber-card-particles" aria-hidden>
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={index} />
          ))}
        </div>
        <div className="cyber-card-content">{children}</div>
      </div>
    </div>
  )
}
