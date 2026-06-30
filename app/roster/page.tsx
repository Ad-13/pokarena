import Link from 'next/link'
import { PlusCircle, Sword, X } from 'lucide-react'
import { getSession } from '@/actions/auth'
import { getRoster, removeFromRoster } from '@/actions/roster'
import AuthRequired from '@/components/ui/AuthRequired'
import PokemonCard from '@/components/ui/PokemonCard'
import PokemonLogo from '@/components/ui/PokemonLogo'

interface PokeApiPokemon {
  types: Array<{
    type: {
      name: string
    }
  }>
  stats: Array<{
    base_stat: number
    stat: {
      name: string
    }
  }>
}

interface RosterPokemon {
  id: string
  pokemonId: number
  name: string
  spriteUrl: string
  types: string[]
  hp: number
  attack: number
  defense: number
}

async function getPokemonDetails(pokemonId: number): Promise<PokeApiPokemon | null> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`, {
    next: { revalidate: 60 * 60 * 24 },
  })

  if (!res.ok) return null

  return res.json()
}

function getStat(pokemon: PokeApiPokemon, statName: string) {
  return pokemon.stats.find((item) => item.stat.name === statName)?.base_stat ?? 0
}

export default async function RosterPage() {
  const session = await getSession()

  if (!session) {
    return <AuthRequired message="Sign in to manage your Pokémon roster" />
  }

  const roster = await getRoster(session.id)

  const rosterPokemon: RosterPokemon[] = await Promise.all(
    roster.map(async (item) => {
      const details = await getPokemonDetails(item.pokemon_id)

      return {
        id: item.id,
        pokemonId: item.pokemon_id,
        name: item.pokemon_name,
        spriteUrl: item.sprite_url,
        types: details?.types.map((entry) => entry.type.name) ?? ['normal'],
        hp: details ? getStat(details, 'hp') : 0,
        attack: details ? getStat(details, 'attack') : 0,
        defense: details ? getStat(details, 'defense') : 0,
      }
    })
  )

  const filledCount = rosterPokemon.length
  const emptySlots = 6 - filledCount
  const canBattle = filledCount === 6

  return (
    <div className="page-container roster-page py-8 md:py-10">
      <header className="roster-header">
        <div className="roster-brand-row">
          <PokemonLogo size="md" />
        </div>

        <div className="roster-title-copy">
          <p className="roster-kicker">Team Builder</p>
          <h1>My Roster</h1>
          <p>Complete your roster to unlock the arena.</p>
        </div>

        <div className="roster-status-panel" aria-label="Roster status">
          <div className="roster-counter">
            <span>{filledCount} / 6 Pokémon</span>

            <div className="slot-dots" aria-hidden="true">
              {Array.from({ length: 6 }).map((_, index) => (
                <span
                  key={index}
                  className={index < filledCount ? 'slot-dot filled' : 'slot-dot'}
                />
              ))}
            </div>
          </div>

          {canBattle ? (
            <Link href="/battle" className="battle-cta">
              <Sword size={18} />
              Go to Battle
            </Link>
          ) : (
            <button className="battle-cta" disabled>
              <Sword size={18} />
              Go to Battle
            </button>
          )}
        </div>
      </header>

      <section className="roster-grid" aria-label="Selected Pokémon">
        {rosterPokemon.map((pokemon) => (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            action={(
              <form action={removeFromRoster} className="pokemon-card-action-form">
                <input type="hidden" name="id" value={pokemon.id} />
                <button className="pokemon-card-action-btn remove" type="submit" aria-label={`Remove ${pokemon.name}`}>
                  <X size={15} />
                  Remove
                </button>
              </form>
            )}
          />
        ))}

        {Array.from({ length: emptySlots }).map((_, index) => (
          <Link key={index} href="/" className="empty-roster-slot">
            <PlusCircle size={34} />
            Add Pokémon
          </Link>
        ))}
      </section>

      {!canBattle && (
        <p className="roster-hint">
          Choose 6 Pokémon to unlock the Battle Arena.
        </p>
      )}
    </div>
  )
}
