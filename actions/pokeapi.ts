import {
  type PokemonApiResponse,
  type PokemonCardData,
  type PokemonDetailData,
  type PokemonListResponse,
  type PokemonType,
} from '@/types'

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2'

function toTitleCase(value: string): string {
  return value
    .split('-')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ')
}

function toPokemonImageUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

function formatStatName(name: string): string {
  switch (name) {
    case 'hp':
      return 'HP'
    case 'special-attack':
      return 'Sp. Atk'
    case 'special-defense':
      return 'Sp. Def'
    default:
      return toTitleCase(name)
  }
}

function mapPokemonToDetailData(pokemon: PokemonApiResponse): PokemonDetailData {
  return {
    id: pokemon.id,
    name: pokemon.name,
    imageUrl: pokemon.sprites.other?.official_artwork?.front_default ?? toPokemonImageUrl(pokemon.id),
    height: pokemon.height / 10,
    weight: pokemon.weight / 10,
    types: pokemon.types.map(({ type }) => type.name),
    abilities: pokemon.abilities.map(({ ability }) => toTitleCase(ability.name)),
    stats: pokemon.stats.map(({ stat, base_stat }) => ({
      name: formatStatName(stat.name),
      value: base_stat,
    })),
  }
}

export function formatPokemonName(name: string): string {
  return toTitleCase(name)
}

export function formatPokemonType(type: PokemonType): string {
  return toTitleCase(type)
}

export async function getPokemonByIdOrName(idOrName: string | number): Promise<PokemonDetailData | null> {
  const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${idOrName}`, {
    next: { revalidate: 60 * 60 },
  })

  if (!response.ok) {
    return null
  }

  const pokemon = (await response.json()) as PokemonApiResponse
  return mapPokemonToDetailData(pokemon)
}

export async function getPokemonList(limit = 24): Promise<PokemonCardData[]> {
  const listResponse = await fetch(`${POKEAPI_BASE_URL}/pokemon?limit=${limit}`, {
    next: { revalidate: 60 * 60 },
  })

  if (!listResponse.ok) {
    return []
  }

  const listData = (await listResponse.json()) as PokemonListResponse
  const pokemonCards = await Promise.all(
    listData.results.map(async ({ name }) => getPokemonByIdOrName(name))
  )

  return pokemonCards.filter((pokemon): pokemon is PokemonDetailData => pokemon !== null).map((pokemon) => ({
    id: pokemon.id,
    name: pokemon.name,
    imageUrl: pokemon.imageUrl,
    types: pokemon.types,
  }))
}
