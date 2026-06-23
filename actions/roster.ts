'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/actions/auth'
import { query } from '@/lib/db'
import { getRosterCountByUserId, MAX_ROSTER_SIZE } from '@/lib/roster'

export async function addPokemonToRoster(formData: FormData): Promise<void> {
  const session = await getSession()
  if (!session) {
    redirect('/?modal=auth')
  }

  const pokemonId = Number(formData.get('pokemonId'))
  const pokemonName = String(formData.get('pokemonName') ?? '').trim().toLowerCase()
  const spriteUrl = String(formData.get('spriteUrl') ?? '').trim()

  if (!Number.isFinite(pokemonId) || pokemonId <= 0 || !pokemonName) {
    return
  }

  const rosterCount = await getRosterCountByUserId(session.id)
  if (rosterCount >= MAX_ROSTER_SIZE) {
    return
  }

  await query`
    INSERT INTO roster_items (user_id, pokemon_id, pokemon_name, sprite_url)
    VALUES (${session.id}, ${pokemonId}, ${pokemonName}, ${spriteUrl})
    ON CONFLICT (user_id, pokemon_id) DO NOTHING
  `

  revalidatePath('/')
  revalidatePath('/roster')
  revalidatePath(`/pokemon/${pokemonId}`)
}

export async function removePokemonFromRoster(formData: FormData): Promise<void> {
  const session = await getSession()
  if (!session) {
    redirect('/?modal=auth')
  }

  const pokemonId = Number(formData.get('pokemonId'))
  if (!Number.isFinite(pokemonId) || pokemonId <= 0) {
    return
  }

  await query`
    DELETE FROM roster_items
    WHERE user_id = ${session.id}
      AND pokemon_id = ${pokemonId}
  `

  revalidatePath('/')
  revalidatePath('/roster')
  revalidatePath(`/pokemon/${pokemonId}`)
}
