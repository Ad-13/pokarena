'use client'

import { useMemo, useState } from 'react'
import { IconSearch, IconSparkles } from '@tabler/icons-react'
import PokemonBrowseCard from '@/components/home/PokemonBrowseCard'
import { formatPokemonName } from '@/lib/pokeapi'
import { MAX_ROSTER_SIZE } from '@/lib/constants'
import type { PokemonCardData, PokemonType } from '@/types'

const TYPE_FILTERS: Array<{ value: PokemonType | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'fire', label: 'Fire' },
  { value: 'water', label: 'Water' },
  { value: 'grass', label: 'Grass' },
  { value: 'electric', label: 'Electric' },
]

interface Props {
  pokemonList: PokemonCardData[]
  isLoggedIn: boolean
  rosterIds: number[]
}

export default function PokemonBrowser({ pokemonList, isLoggedIn, rosterIds }: Props) {
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<PokemonType | 'all'>('all')
  const rosterIdSet = useMemo(() => new Set(rosterIds), [rosterIds])
  const isRosterFull = rosterIds.length >= MAX_ROSTER_SIZE

  const filteredList = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return pokemonList.filter((pokemon) => {
      const displayName = formatPokemonName(pokemon.name).toLowerCase()
      const matchesQuery =
        !normalizedQuery ||
        pokemon.name.toLowerCase().includes(normalizedQuery) ||
        displayName.includes(normalizedQuery)

      const matchesType = typeFilter === 'all' || pokemon.types.includes(typeFilter)

      return matchesQuery && matchesType
    })
  }, [pokemonList, query, typeFilter])

  return (
    <>
      <div className="controls">
        <div className="search-box">
          <IconSearch size={18} />
          <input
            type="search"
            placeholder="Search by name..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search Pokémon by name"
          />
        </div>
        <div className="chips">
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              className={`chip ${typeFilter === value ? 'active' : ''}`}
              onClick={() => setTypeFilter(value)}
              aria-pressed={typeFilter === value}
            >
              {value === 'all' && <IconSparkles size={14} />}
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid" aria-label="Pokemon list">
        {filteredList.length === 0 ? (
          <p className="grid-empty">No Pokémon match your search.</p>
        ) : (
          filteredList.map((pokemon, index) => (
            <PokemonBrowseCard
              key={pokemon.id}
              pokemon={pokemon}
              index={index}
              isLoggedIn={isLoggedIn}
              isInRoster={rosterIdSet.has(pokemon.id)}
              isRosterFull={isRosterFull}
            />
          ))
        )}
      </section>
    </>
  )
}
