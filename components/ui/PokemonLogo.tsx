import Link from 'next/link'
import PokeballSvg from './PokeballSvg'

interface Props {
  href?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function PokemonLogo({ href = '/', size = 'md', className = '' }: Props) {
  const content = (
    <>
      <span className="pokemon-logo-ball">
        <PokeballSvg size={size === 'lg' ? 48 : size === 'sm' ? 28 : 36} className="pokeball-idle" clipId={`pokemon-logo-${size}`} />
      </span>
      <span className="pokemon-logo-text" aria-label="PokArena">
        <span>Poke</span>
        <em>Arena</em>
      </span>
    </>
  )

  if (!href) {
    return <span className={`pokemon-logo ${size} ${className}`}>{content}</span>
  }

  return (
    <Link href={href} className={`pokemon-logo ${size} ${className}`} aria-label="PokArena home">
      {content}
    </Link>
  )
}
