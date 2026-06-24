'use client'

import Link from 'next/link'
import { TablerIcon } from '@tabler/icons-react'

interface Props {
  href: string
  icon: TablerIcon
  label: string
  isActive: boolean
  isBattle: boolean
  badge?: number
}

export default function NavItem({ href, icon: Icon, label, isActive, isBattle, badge }: Props) {
  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const battleActive = window.sessionStorage.getItem('pokarena:battle-active') === '1'

    if (battleActive && href !== '/battle') {
      event.preventDefault()
      window.alert('Battle is in progress. End the battle before leaving this page.')
    }
  }

  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className="nav-icon"
      data-battle={isBattle}
      data-active={isActive}
      onClick={handleClick}
    >
      <Icon
        size={isBattle ? 60 : 54}
        stroke={isActive || isBattle ? 2.5 : 2}
      />
      <span className="tip">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="nav-badge animate-pulsate">{badge}</span>
      )}
    </Link>
  )
}
