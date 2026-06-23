import { getSession } from '@/actions/auth'
import { removePokemonFromRoster } from '@/actions/roster'
import AuthRequired from '@/components/ui/AuthRequired'
import PokeballSvg from '@/components/ui/PokeballSvg'
import { formatPokemonName, formatPokemonType, getPokemonByIdOrName } from '@/lib/pokeapi'
import { getRosterByUserId, MAX_ROSTER_SIZE } from '@/lib/roster'
import type { CSSProperties } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default async function RosterPage() {
  const session = await getSession()

  if (!session) return <AuthRequired message='Sign in to manage your Pokémon roster' />

  const roster = await getRosterByUserId(session.id)
  const rosterWithDetails = await Promise.all(
    roster.map(async (item) => {
      const details = await getPokemonByIdOrName(item.pokemonId)
      return {
        ...item,
        types: details?.types ?? [],
        stats: details?.stats ?? [],
      }
    })
  )

  return (
    <div className='page-container py-10'>
      <div className='pg-header animate-slide-up'>
        <Link href='/' className='logo'>
          <PokeballSvg className='logo-ball' clipId='roster-logo-ball' size={36} />
          <span className='logo-text'>
            Pok<em>Arena</em>
          </span>
        </Link>
        <div className='pg-title-block'>
          <h1 className='pg-title'>My Roster</h1>
          <p className='pg-subtitle'>Build your dream team</p>
        </div>
      </div>

      <section className='roster-meta'>
        <div className='slots-counter'>
          {Array.from({ length: MAX_ROSTER_SIZE }).map((_, index) => {
            const filled = index < rosterWithDetails.length
            return <span key={index} className={`slot-dot ${filled ? 'filled' : 'empty'}`} />
          })}
          <span className='roster-count-label'>
            {rosterWithDetails.length} / {MAX_ROSTER_SIZE} Pokemon
          </span>
        </div>
      </section>

      <section className='roster-grid'>
        {rosterWithDetails.map((pokemon, index) => {
          const hp = pokemon.stats.find((stat) => stat.name === 'HP')?.value ?? 0
          const attack = pokemon.stats.find((stat) => stat.name === 'Attack')?.value ?? 0

          return (
            <article key={pokemon.pokemonId} className={`rcard stagger-item ${pokemon.types[0] ?? 'normal'}`} style={{ '--index': index } as CSSProperties}>
              <form action={removePokemonFromRoster}>
                <input type='hidden' name='pokemonId' value={pokemon.pokemonId} />
                <button type='submit' className='remove-btn' aria-label={`Remove ${formatPokemonName(pokemon.pokemonName)} from roster`}>
                  x
                </button>
              </form>

              <div className={`rcard-img ${pokemon.types[0] ?? 'normal'}`}>
                <Image
                  src={pokemon.spriteUrl}
                  alt={formatPokemonName(pokemon.pokemonName)}
                  width={84}
                  height={84}
                />
              </div>
              <h3>{formatPokemonName(pokemon.pokemonName)}</h3>
              <div className='rcard-type'>
                {pokemon.types.map((type) => (
                  <span key={`${pokemon.pokemonId}-${type}`} className={`badge b-${type}`}>
                    {formatPokemonType(type)}
                  </span>
                ))}
              </div>
              <div className='rcard-stat'>
                Lv. {Math.max(1, Math.floor((hp + attack) / 10))}
                <span>
                  HP {hp} - ATK {attack}
                </span>
              </div>
            </article>
          )
        })}

        {Array.from({ length: MAX_ROSTER_SIZE - rosterWithDetails.length }).map((_, index) => (
          <article key={`empty-${index}`} className='empty-slot'>
            <span className='empty-plus-circle'>+</span>
            <span>Add Pokemon</span>
          </article>
        ))}
      </section>
    </div>
  )
}
