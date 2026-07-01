import type { RosterItem } from '@/actions/roster'

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
  cries?: {
    latest?: string
    legacy?: string
  }
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

export interface BattleMove {
  id: string
  name: string
  type: string
  power: number
  accuracy: number
  priority: number
}

export interface BattlePokemon {
  key: string
  pokemonId: number
  name: string
  spriteUrl: string
  cryUrl: string
  types: string[]
  maxHp: number
  hp: number
  attack: number
  defense: number
  speed: number
  moves: BattleMove[]
}

const MOVE_BY_TYPE: Record<string, BattleMove> = {
  normal: { id: 'tackle', name: 'Tackle', type: 'normal', power: 40, accuracy: 100, priority: 0 },
  fire: { id: 'ember', name: 'Ember', type: 'fire', power: 40, accuracy: 100, priority: 0 },
  water: { id: 'water-gun', name: 'Water Gun', type: 'water', power: 40, accuracy: 100, priority: 0 },
  grass: { id: 'vine-whip', name: 'Vine Whip', type: 'grass', power: 45, accuracy: 100, priority: 0 },
  electric: { id: 'thunder-shock', name: 'Thunder Shock', type: 'electric', power: 40, accuracy: 100, priority: 0 },
  ice: { id: 'ice-shard', name: 'Ice Shard', type: 'ice', power: 40, accuracy: 100, priority: 1 },
  fighting: { id: 'karate-chop', name: 'Karate Chop', type: 'fighting', power: 50, accuracy: 100, priority: 0 },
  poison: { id: 'poison-sting', name: 'Poison Sting', type: 'poison', power: 35, accuracy: 100, priority: 0 },
  ground: { id: 'mud-slap', name: 'Mud-Slap', type: 'ground', power: 40, accuracy: 100, priority: 0 },
  flying: { id: 'wing-attack', name: 'Wing Attack', type: 'flying', power: 60, accuracy: 100, priority: 0 },
  psychic: { id: 'confusion', name: 'Confusion', type: 'psychic', power: 50, accuracy: 100, priority: 0 },
  bug: { id: 'bug-bite', name: 'Bug Bite', type: 'bug', power: 60, accuracy: 100, priority: 0 },
  rock: { id: 'rock-throw', name: 'Rock Throw', type: 'rock', power: 50, accuracy: 90, priority: 0 },
  ghost: { id: 'lick', name: 'Lick', type: 'ghost', power: 40, accuracy: 100, priority: 0 },
  dragon: { id: 'dragon-breath', name: 'Dragon Breath', type: 'dragon', power: 60, accuracy: 100, priority: 0 },
  dark: { id: 'bite', name: 'Bite', type: 'dark', power: 60, accuracy: 100, priority: 0 },
  steel: { id: 'metal-claw', name: 'Metal Claw', type: 'steel', power: 50, accuracy: 95, priority: 0 },
  fairy: { id: 'fairy-wind', name: 'Fairy Wind', type: 'fairy', power: 40, accuracy: 100, priority: 0 },
}

function formatPokemonName(name: string) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getStat(pokemon: PokeApiPokemon, statName: string) {
  return pokemon.stats.find((item) => item.stat.name === statName)?.base_stat ?? 50
}

function buildMoves(types: string[]): BattleMove[] {
  const typeMoves = types.map((type) => MOVE_BY_TYPE[type]).filter(Boolean)
  const fallback = MOVE_BY_TYPE.normal
  const quick = { id: 'quick-attack', name: 'Quick Attack', type: 'normal', power: 40, accuracy: 100, priority: 1 }
  const heavy = { id: 'power-strike', name: 'Power Strike', type: types[0] ?? 'normal', power: 70, accuracy: 85, priority: 0 }
  const moves = [...typeMoves, fallback, quick, heavy]
  const unique = new Map<string, BattleMove>()

  for (const move of moves) {
    unique.set(move.id, move)
  }

  return Array.from(unique.values()).slice(0, 4)
}

export async function fetchPokemonDetails(pokemonId: number): Promise<BattlePokemon | null> {
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`, {
    next: { revalidate: 60 * 60 * 24 },
  })

  if (!res.ok) return null

  const pokemon = (await res.json()) as PokeApiPokemon
  const types = pokemon.types.map((entry) => entry.type.name)
  const spriteUrl =
    pokemon.sprites.other?.['official-artwork']?.front_default ??
    pokemon.sprites.front_default ??
    ''
  const maxHp = Math.max(20, getStat(pokemon, 'hp'))

  return {
    key: crypto.randomUUID(),
    pokemonId: pokemon.id,
    name: formatPokemonName(pokemon.name),
    spriteUrl,
    cryUrl: pokemon.cries?.latest ?? '',
    types,
    maxHp,
    hp: maxHp,
    attack: getStat(pokemon, 'attack'),
    defense: getStat(pokemon, 'defense'),
    speed: getStat(pokemon, 'speed'),
    moves: buildMoves(types),
  }
}

export async function rosterToBattleTeam(roster: RosterItem[]): Promise<BattlePokemon[]> {
  const team = await Promise.all(roster.map((item) => fetchPokemonDetails(item.pokemon_id)))

  return team.filter((pokemon): pokemon is BattlePokemon => Boolean(pokemon))
}

export async function getRandomOpponentTeam(size = 6): Promise<BattlePokemon[]> {
  const ids = new Set<number>()

  while (ids.size < size) {
    ids.add(Math.floor(Math.random() * 151) + 1)
  }

  const team = await Promise.all(Array.from(ids).map((id) => fetchPokemonDetails(id)))

  return team.filter((pokemon): pokemon is BattlePokemon => Boolean(pokemon)).slice(0, size)
}
