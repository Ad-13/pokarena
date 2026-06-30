export const PokemonType = {
  Normal:   'normal',
  Fire:     'fire',
  Water:    'water',
  Grass:    'grass',
  Electric: 'electric',
  Ice:      'ice',
  Fighting: 'fighting',
  Poison:   'poison',
  Ground:   'ground',
  Flying:   'flying',
  Psychic:  'psychic',
  Bug:      'bug',
  Rock:     'rock',
  Ghost:    'ghost',
  Dragon:   'dragon',
  Dark:     'dark',
  Steel:    'steel',
  Fairy:    'fairy',
} as const

export type PokemonType = (typeof PokemonType)[keyof typeof PokemonType]

export interface PokemonListItem {
  name: string
  url: string
}

export interface PokemonListResponse {
  count: number
  next: string | null
  previous: string | null
  results: PokemonListItem[]
}

export interface PokemonApiTypeSlot {
  slot: number
  type: {
    name: PokemonType
    url: string
  }
}

export interface PokemonApiAbilitySlot {
  is_hidden: boolean
  slot: number
  ability: {
    name: string
    url: string
  }
}

export interface PokemonApiStatSlot {
  base_stat: number
  effort: number
  stat: {
    name: string
    url: string
  }
}

export interface PokemonApiSprites {
  front_default: string | null
  other?: {
    official_artwork?: {
      front_default: string | null
    }
  }
}

export interface PokemonApiResponse {
  id: number
  name: string
  height: number
  weight: number
  types: PokemonApiTypeSlot[]
  abilities: PokemonApiAbilitySlot[]
  stats: PokemonApiStatSlot[]
  sprites: PokemonApiSprites
}

export interface PokemonCardData {
  id: number
  name: string
  imageUrl: string
  types: PokemonType[]
}

export interface PokemonDetailData {
  id: number
  name: string
  imageUrl: string
  height: number
  weight: number
  types: PokemonType[]
  abilities: string[]
  stats: Array<{
    name: string
    value: number
  }>
}

export interface RosterItem {
  pokemonId: number
  pokemonName: string
  spriteUrl: string
  addedAt: string
}
