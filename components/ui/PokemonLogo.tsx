'use client'

import Link from 'next/link'
import { type MouseEvent } from 'react'
import PokeballSvg from './PokeballSvg'

interface Props {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  preventNavigation?: boolean
  onNavigateBlocked?: () => void
}

export default function PokemonLogo({ href = '/', size = 'md', className = '', preventNavigation = false, onNavigateBlocked }: Props) {
  function handleClick(event: MouseEvent<HTMLAnchorElement | HTMLSpanElement>) {
    if (!preventNavigation) return

    const battleActive = typeof window !== 'undefined' && window.sessionStorage.getItem('pokarena:battle-active') === '1'

    if (battleActive) {
      event.preventDefault()
      onNavigateBlocked?.()
    }
  }

  const content = (
    <>
      <span className="pokemon-logo-ball">
        <PokeballSvg size={size === 'lg' ? 48 : size === 'sm' ? 28 : 36} className="pokeball-idle" clipId={`pokemon-logo-${size}`} />
      </span>
      <span className="pokemon-logo-text" aria-label="PokArena">
        <span>Pok</span>
        <em>Arena</em>
      </span>
    </>
  )

  if (!href) {
    return (
      <span className={`pokemon-logo ${size} ${className}`} onClick={handleClick}>
        {content}
      </span>
    )
  }

  if (preventNavigation) {
    return (
      <span className={`pokemon-logo ${size} ${className}`} aria-label="PokArena home" onClick={handleClick}>
        {content}
      </span>
    )
  }

  return (
    <Link href={href} className={`pokemon-logo ${size} ${className}`} aria-label="PokArena home">
      {content}
    </Link>
  )
}
