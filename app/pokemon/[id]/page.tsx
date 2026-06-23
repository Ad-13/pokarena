import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { CSSProperties } from 'react'
import { getSession } from '@/actions/auth'
import { addPokemonToRoster, removePokemonFromRoster } from '@/actions/roster'
import PokeballSvg from '@/components/ui/PokeballSvg'
import { formatPokemonName, formatPokemonType, getPokemonByIdOrName } from '@/lib/pokeapi'
import { isPokemonInRoster } from '@/lib/roster'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PokemonDetailPage({ params }: Props) {
  const { id } = await params
  const pokemon = await getPokemonByIdOrName(id)

  if (!pokemon) notFound()

  const session = await getSession()
  const inRoster = session ? await isPokemonInRoster(session.id, pokemon.id) : false
  const primaryType = pokemon.types[0] ?? 'normal'

  return (
    <div className='page-container py-10'>
      <div className='pg-header animate-slide-up'>
        <Link href='/' className='back-btn'>
          Back
        </Link>
        <Link href='/' className='logo'>
          <PokeballSvg className='logo-ball' clipId='detail-logo-ball' size={36} />
          <span className='logo-text'>
            Pok<em>Arena</em>
          </span>
        </Link>
        <div className='pg-title-block'>
          <h1 className='pg-title'>{formatPokemonName(pokemon.name)}</h1>
          <p className='pg-subtitle'>
            {formatPokemonType(primaryType)} Type · #{pokemon.id.toString().padStart(3, '0')}
          </p>
        </div>
      </div>

      <section className='detail-layout'>
        <div className='detail-left'>
          <div className={`poke-hero-wrap ${primaryType}`}>
            <Image
              src={pokemon.imageUrl}
              alt={formatPokemonName(pokemon.name)}
              width={220}
              height={220}
              className='poke-hero-img'
            />
          </div>
          <div className='type-chips'>
            {pokemon.types.map((type) => (
              <span key={`${pokemon.id}-${type}`} className={`type-chip-lg b-${type}`}>
                {formatPokemonType(type)}
              </span>
            ))}
          </div>
        </div>

        <div className='detail-right'>
          <div>
            <div className='detail-number'>#{pokemon.id.toString().padStart(3, '0')}</div>
            <div className='detail-name'>{formatPokemonName(pokemon.name)}</div>
            <div className='info-grid'>
              <article className='info-card'>
                <span className='info-label'>Height</span>
                <span className='info-value'>{pokemon.height} m</span>
              </article>
              <article className='info-card'>
                <span className='info-label'>Weight</span>
                <span className='info-value'>{pokemon.weight} kg</span>
              </article>
            </div>
          </div>

          <section>
            <h2 className='section-title'>Abilities</h2>
            <div className='ability-list'>
              {pokemon.abilities.map((ability) => (
                <span key={ability} className='ability-tag'>
                  {ability}
                </span>
              ))}
            </div>
          </section>

          <section>
            <h2 className='section-title'>Base Stats</h2>
            <div className='stats-list'>
              {pokemon.stats.map((stat) => (
                <div key={stat.name} className='stat-row'>
                  <span className='stat-name'>{stat.name.toUpperCase()}</span>
                  <span className='stat-num'>{stat.value}</span>
                  <div className='stat-track'>
                    <span className='stat-fill' style={{ '--w': `${Math.min((stat.value / 200) * 100, 100)}%` } as CSSProperties} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {session ? (
            inRoster ? (
              <form action={removePokemonFromRoster}>
                <input type='hidden' name='pokemonId' value={pokemon.id} />
                <button type='submit' className='add-roster-btn remove-roster-btn'>
                  Remove from Roster
                </button>
              </form>
            ) : (
              <form action={addPokemonToRoster}>
                <input type='hidden' name='pokemonId' value={pokemon.id} />
                <input type='hidden' name='pokemonName' value={pokemon.name} />
                <input type='hidden' name='spriteUrl' value={pokemon.imageUrl} />
                <button type='submit' className='add-roster-btn'>
                  Add to Roster
                </button>
              </form>
            )
          ) : (
            <Link href='/?modal=auth' className='add-roster-btn'>
              Sign in to add
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
