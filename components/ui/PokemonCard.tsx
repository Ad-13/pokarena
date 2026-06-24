import type { ReactNode } from 'react'
import PokeballSvg from './PokeballSvg'

export interface PokemonCardData {
  id: string | number
  pokemonId: number
  name: string
  spriteUrl: string
  types: string[]
  hp: number
  attack: number
  defense: number
}

function typeClass(type: string) {
  return `type-${type}`
}

export default function PokemonCard({
  pokemon,
  action,
}: {
  pokemon: PokemonCardData
  action: ReactNode
}) {
  const mainType = pokemon.types[0] ?? 'normal'

  return (
    <article className="pokemon-card-shell">
      {Array.from({ length: 10 }).map((_, index) => (
        <span key={index} className={`pokemon-tracker pokemon-tr-${index + 1}`} aria-hidden="true" />
      ))}

      <div className={`pokemon-card ${typeClass(mainType)}`}>
        <div className="pokemon-card-glare" aria-hidden="true" />
        <div className="pokemon-cyber-lines" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="pokemon-card-particles" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="pokemon-scan-line" aria-hidden="true" />

        <div className="pokemon-card-main">
          <span className="pokemon-id-badge">
            #{String(pokemon.pokemonId).padStart(3, '0')}
          </span>

          <div className="pokemon-stat">
            <span><em>HP</em><strong>{pokemon.hp}</strong></span>
            <span><em>ATK</em><strong>{pokemon.attack}</strong></span>
            <span><em>DEF</em><strong>{pokemon.defense}</strong></span>
          </div>

          <div className={`pokemon-card-img ${typeClass(mainType)}`}>
            {pokemon.spriteUrl ? (
              <img src={pokemon.spriteUrl} alt={pokemon.name} />
            ) : (
              <PokeballSvg size={58} clipId={`fallback-${pokemon.id}`} />
            )}
          </div>

          <h2>{pokemon.name}</h2>
          <span className="pokemon-hover-name">{pokemon.name}</span>

          <div className="pokemon-types">
            {pokemon.types.map((type) => (
              <span key={type} className={`type-badge ${typeClass(type)}`}>
                {type}
              </span>
            ))}
          </div>
        </div>

        <div className="pokemon-card-action">
          {action}
        </div>
      </div>
    </article>
  )
}
