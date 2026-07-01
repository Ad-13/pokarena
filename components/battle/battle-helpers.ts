import type { BattleMove, BattlePokemon } from '@/helpers/pokemon'
import type { BattleLogEntry, BattleOutcome, BattleStatus, SelectMode } from './battle-types'
import { TYPE_EFFECTIVENESS } from './battle-constants'

export function cloneTeam(team: BattlePokemon[]) {
  return team.map((pokemon) => ({
    ...pokemon,
    hp: pokemon.maxHp,
    moves: pokemon.moves.map((move) => ({ ...move })),
  }))
}

export function playPokemonCry(pokemon?: BattlePokemon | null) {
  if (!pokemon?.cryUrl || typeof window === 'undefined') return

  const audio = new Audio(pokemon.cryUrl)
  audio.volume = 0.42
  void audio.play().catch(() => {
    // Browsers may block audio until the user interacts with the page.
  })
}

export function addLog(kind: BattleLogEntry['kind'], text: string): BattleLogEntry {
  return { id: crypto.randomUUID(), kind, text }
}

export function hpPercent(pokemon?: BattlePokemon | null) {
  if (!pokemon) return 0
  return Math.max(0, Math.round((pokemon.hp / pokemon.maxHp) * 100))
}

export function hpColor(percent: number) {
  if (percent > 55) return 'green'
  if (percent > 25) return 'yellow'
  return 'red'
}

export function aliveCount(team: BattlePokemon[]) {
  return team.filter((pokemon) => pokemon.hp > 0).length
}

export function firstAliveIndex(team: BattlePokemon[]) {
  return team.findIndex((pokemon) => pokemon.hp > 0)
}

export function typeMultiplier(moveType: string, defenderTypes: string[]) {
  return defenderTypes.reduce((total, defenderType) => {
    return total * (TYPE_EFFECTIVENESS[moveType]?.[defenderType] ?? 1)
  }, 1)
}

export function calculateDamage(attacker: BattlePokemon, defender: BattlePokemon, move: BattleMove) {
  const hitRoll = Math.random() * 100

  if (hitRoll > move.accuracy) {
    return { damage: 0, multiplier: 1, missed: true }
  }

  const stab = attacker.types.includes(move.type) ? 1.2 : 1
  const multiplier = typeMultiplier(move.type, defender.types)
  const randomFactor = 0.85 + Math.random() * 0.15
  const raw = (((22 * move.power * (attacker.attack / Math.max(1, defender.defense))) / 50) + 2) * stab * multiplier * randomFactor

  return {
    damage: Math.max(1, Math.round(raw)),
    multiplier,
    missed: false,
  }
}

export function effectivenessText(multiplier: number) {
  if (multiplier === 0) return ' It had no effect.'
  if (multiplier >= 2) return ' It was super effective.'
  if (multiplier < 1) return ' It was not very effective.'
  return ''
}

export function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60

  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export function estimateDamage(attacker: BattlePokemon, defender: BattlePokemon, move: BattleMove) {
  const stab = attacker.types.includes(move.type) ? 1.2 : 1
  const multiplier = typeMultiplier(move.type, defender.types)

  return move.power * stab * multiplier * (attacker.attack / Math.max(1, defender.defense))
}

export function chooseOpponentMove(attacker: BattlePokemon, defender: BattlePokemon) {
  const ranked = [...attacker.moves].sort((a, b) => estimateDamage(attacker, defender, b) - estimateDamage(attacker, defender, a))
  const bestTwo = ranked.slice(0, 2)

  return bestTwo[Math.floor(Math.random() * bestTwo.length)] ?? ranked[0]
}

export function playerActsFirst(
  player: BattlePokemon,
  playerMove: BattleMove,
  opponent: BattlePokemon,
  opponentMove: BattleMove
) {
  if (playerMove.priority !== opponentMove.priority) {
    return playerMove.priority > opponentMove.priority
  }

  if (player.speed !== opponent.speed) {
    return player.speed > opponent.speed
  }

  return Math.random() < 0.5
}

export function scoreForWin(playerTeam: BattlePokemon[], totalSeconds: number) {
  const aliveBonus = aliveCount(playerTeam) * 75
  const speedBonus = Math.max(0, 600 - totalSeconds)

  return 250 + aliveBonus + speedBonus
}

export function getBattleModalState(status: BattleStatus, outcome: BattleOutcome, selectMode: SelectMode | null, showForfeitConfirm: boolean, leaderboard: unknown) {
  return {
    modalOpen: !leaderboard || Boolean(selectMode) || showForfeitConfirm || (status === 'finished' && Boolean(outcome)),
    battleInProgress: status === 'player-turn' || status === 'opponent-turn' || Boolean(selectMode === 'switch' || selectMode === 'forced'),
  }
}
