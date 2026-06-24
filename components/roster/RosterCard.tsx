import Link from 'next/link'
import Image from 'next/image'
import type { CSSProperties } from 'react'
import { removePokemonFromRoster } from '@/actions/roster'
import CyberCard from '@/components/ui/CyberCard'
import { getCardToneClass } from '@/lib/card-tone'
import { formatPokemonName, formatPokemonType } from '@/lib/pokeapi'
import type { PokemonType } from '@/types'

interface Props {
  pokemonId: number
  pokemonName: string
  spriteUrl: string
  types: PokemonType[]
  hp: number
  attack: number
  index: number
}

export default function RosterCard({
  pokemonId,
  pokemonName,
  spriteUrl,
  types,
  hp,
  attack,
  index,
}: Props) {
  const primaryType = types[0] ?? 'normal'
  const cardTone = getCardToneClass(primaryType)
  const level = Math.max(1, Math.floor((hp + attack) / 10))

  return (
    <article
      className={`browse-card roster-card stagger-item ${cardTone}`}
      style={{ '--index': index } as CSSProperties}
    >
      <CyberCard className={cardTone}>
        <form action={removePokemonFromRoster} className="roster-remove-form">
          <input type="hidden" name="pokemonId" value={pokemonId} />
          <button
            type="submit"
            className="remove-btn"
            aria-label={`Remove ${formatPokemonName(pokemonName)} from roster`}
          >
            ×
          </button>
        </form>

        <Link href={`/pokemon/${pokemonId}`} className="browse-card-link">
          <div className={`sprite s-${primaryType}`}>
            <Image
              src={spriteUrl}
              alt={formatPokemonName(pokemonName)}
              width={84}
              height={84}
              className="poke-img"
            />
          </div>
          <h3 className="cyber-card-title">{formatPokemonName(pokemonName)}</h3>
          <div className="badges rcard-type">
            {types.map((type) => (
              <span key={`${pokemonId}-${type}`} className={`badge b-${type}`}>
                {formatPokemonType(type)}
              </span>
            ))}
          </div>
        </Link>

        <div className="rcard-stat">
          Lv. {level}
          <span>
            HP {hp} · ATK {attack}
          </span>
        </div>
      </CyberCard>
    </article>
  )
}
