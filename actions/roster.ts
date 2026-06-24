'use server'

import { revalidatePath } from 'next/cache'
import { query } from '@/lib/db'
import { getSession } from './auth'
import type { ActionResult } from '@/types'

export interface RosterItem {
  id: string
  user_id: string
  pokemon_id: number
  pokemon_name: string
  sprite_url: string
  added_at: string
}

interface PokeApiPokemon {
  id: number
  name: string
  sprites: {
    front_default: string | null
    other?: {
      'official-artwork'?: {
        front_default: string | null
      }
    }
  }
}

function formatPokemonName(name: string) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

async function fetchPokemon(pokemonId: number): Promise<PokeApiPokemon | null> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`, {
    next: { revalidate: 60 * 60 * 24 },
  })

  if (!res.ok) return null

  return res.json()
}

export async function getRoster(userId: string) {
  return query<RosterItem>`
    SELECT id, user_id, pokemon_id, pokemon_name, sprite_url, added_at
    FROM roster_items
    WHERE user_id = ${userId}
    ORDER BY added_at ASC
    LIMIT 6
  `
}

export async function addToRoster(
  _prevState: ActionResult<RosterItem> | null,
  formData: FormData
): Promise<ActionResult<RosterItem>> {
  const session = await getSession()

  if (!session) {
    return { error: 'You must sign in first.' }
  }

  const pokemonId = Number(formData.get('pokemonId'))

  if (!Number.isInteger(pokemonId) || pokemonId <= 0) {
    return { error: 'Invalid Pokémon.' }
  }

  const rosterCount = await query<{ count: string }>`
    SELECT COUNT(*)::text AS count
    FROM roster_items
    WHERE user_id = ${session.id}
  `

  if (Number(rosterCount[0].count) >= 6) {
    return { error: 'Your roster is full. Remove a Pokémon before adding another one.' }
  }

  const alreadyAdded = await query<{ id: string }>`
    SELECT id
    FROM roster_items
    WHERE user_id = ${session.id} AND pokemon_id = ${pokemonId}
    LIMIT 1
  `

  if (alreadyAdded.length > 0) {
    return { error: 'This Pokémon is already in your roster.' }
  }

  const pokemon = await fetchPokemon(pokemonId)

  if (!pokemon) {
    return { error: 'Could not find this Pokémon.' }
  }

  const spriteUrl =
    pokemon.sprites.other?.['official-artwork']?.front_default ??
    pokemon.sprites.front_default ??
    ''

  const [item] = await query<RosterItem>`
    INSERT INTO roster_items (user_id, pokemon_id, pokemon_name, sprite_url)
    VALUES (${session.id}, ${pokemon.id}, ${formatPokemonName(pokemon.name)}, ${spriteUrl})
    RETURNING id, user_id, pokemon_id, pokemon_name, sprite_url, added_at
  `

  revalidatePath('/')
  revalidatePath('/roster')
  revalidatePath('/battle')

  return { data: item }
}

export async function addPokemonToRoster(formData: FormData) {
  await addToRoster(null, formData)
}

export async function removeFromRoster(formData: FormData) {
  const session = await getSession()
  if (!session) return

  const id = String(formData.get('id') ?? '')

  if (!id) return

  await query`
    DELETE FROM roster_items
    WHERE id = ${id} AND user_id = ${session.id}
  `

  revalidatePath('/roster')
  revalidatePath('/battle')
}
