import Link from 'next/link'
import Image from 'next/image'
import type { CSSProperties, ReactNode } from 'react'
import { addPokemonToRoster } from '@/actions/roster'
import { formatPokemonName, formatPokemonType } from '@/lib/pokeapi'
import { getCardToneClass } from '@/lib/card-tone'
import type { PokemonCardData } from '@/types'
import CyberCard from '@/components/ui/CyberCard'

interface Props {
  pokemon: PokemonCardData
  index: number
  isLoggedIn: boolean
  isInRoster: boolean
  isRosterFull: boolean
}

function RosterAction({
  isLoggedIn,
  isInRoster,
  isRosterFull,
  pokemon,
}: Pick<Props, 'isLoggedIn' | 'isInRoster' | 'isRosterFull' | 'pokemon'>): ReactNode {
  if (isLoggedIn) {
    if (isInRoster) {
      return (
        <button type="button" className="add-btn" disabled>
          In Roster
        </button>
      )
    }

    if (isRosterFull) {
      return (
        <button type="button" className="add-btn" disabled>
          Roster Full
        </button>
      )
    }

    return (
      <form action={addPokemonToRoster}>
        <input type="hidden" name="pokemonId" value={pokemon.id} />
        <input type="hidden" name="pokemonName" value={pokemon.name} />
        <input type="hidden" name="spriteUrl" value={pokemon.imageUrl} />
        <button type="submit" className="add-btn">
          Add to Roster
        </button>
      </form>
    )
  }

  return (
    <Link href="/?modal=auth" className="add-btn">
      Sign in to add
    </Link>
  )
}

export default function PokemonBrowseCard({
  pokemon,
  index,
  isLoggedIn,
  isInRoster,
  isRosterFull,
}: Props) {
  const primaryType = pokemon.types[0] ?? 'normal'
  const cardTone = getCardToneClass(primaryType)

  return (
    <article
      className={`browse-card stagger-item ${cardTone}`}
      style={{ '--index': index } as CSSProperties}
    >
      <CyberCard className={cardTone}>
        <Link href={`/pokemon/${pokemon.id}`} className="browse-card-link">
          <span className="id-tag">#{pokemon.id.toString().padStart(3, '0')}</span>
          <div className={`sprite s-${primaryType}`}>
            <Image
              src={pokemon.imageUrl}
              alt={formatPokemonName(pokemon.name)}
              width={84}
              height={84}
              className="poke-img"
            />
          </div>
          <h3 className="cyber-card-title">{formatPokemonName(pokemon.name)}</h3>
          <div className="badges">
            {pokemon.types.map((type) => (
              <span key={`${pokemon.id}-${type}`} className={`badge b-${type}`}>
                {formatPokemonType(type)}
              </span>
            ))}
          </div>
        </Link>

        <div className="browse-card-actions">
          <RosterAction
            isLoggedIn={isLoggedIn}
            isInRoster={isInRoster}
            isRosterFull={isRosterFull}
            pokemon={pokemon}
          />
        </div>
      </CyberCard>
    </article>
  )
}
