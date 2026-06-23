import { query } from '@/lib/db'
import type { RosterItem } from '@/types'

export const MAX_ROSTER_SIZE = 6

interface RosterRow {
  pokemon_id: number
  pokemon_name: string
  sprite_url: string
  added_at: string
}

export async function getRosterByUserId(userId: string): Promise<RosterItem[]> {
  const rows = await query<RosterRow>`
    SELECT pokemon_id, pokemon_name, sprite_url, added_at
    FROM roster_items
    WHERE user_id = ${userId}
    ORDER BY added_at DESC
    LIMIT ${MAX_ROSTER_SIZE}
  `

  return rows.map((row) => ({
    pokemonId: row.pokemon_id,
    pokemonName: row.pokemon_name,
    spriteUrl: row.sprite_url,
    addedAt: row.added_at,
  }))
}

export async function getRosterPokemonIdsByUserId(userId: string): Promise<Set<number>> {
  const rows = await query<{ pokemon_id: number }>`
    SELECT pokemon_id
    FROM roster_items
    WHERE user_id = ${userId}
  `

  return new Set(rows.map((row) => row.pokemon_id))
}

export async function getRosterCountByUserId(userId: string): Promise<number> {
  const [row] = await query<{ count: string }>`
    SELECT COUNT(*)::text AS count
    FROM roster_items
    WHERE user_id = ${userId}
  `

  return Number(row?.count ?? 0)
}

export async function isPokemonInRoster(userId: string, pokemonId: number): Promise<boolean> {
  const rows = await query<{ pokemon_id: number }>`
    SELECT pokemon_id
    FROM roster_items
    WHERE user_id = ${userId}
      AND pokemon_id = ${pokemonId}
    LIMIT 1
  `

  return rows.length > 0
}
