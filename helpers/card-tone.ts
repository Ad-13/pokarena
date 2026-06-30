import type { PokemonType } from '@/types'

export function getCardToneClass(type: PokemonType): string {
  switch (type) {
    case 'fire':
      return 'tf'
    case 'water':
      return 'tw'
    case 'grass':
      return 'tg'
    case 'electric':
      return 'te'
    case 'ghost':
      return 'tgh'
    case 'flying':
      return 'tfl'
    case 'fighting':
      return 'tfi'
    default:
      return 'tn'
  }
}
