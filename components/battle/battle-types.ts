import type { BattleMove, BattlePokemon } from '@/helpers/pokemon'

export type { BattleMove, BattlePokemon }

export type BattleStatus = 'setup' | 'player-turn' | 'opponent-turn' | 'finished'
export type BattleOutcome = 'win' | 'loss' | 'forfeit' | null
export type LogKind = 'system' | 'attack' | 'damage'
export type SelectMode = 'starter' | 'switch' | 'forced'

export interface BattleLogEntry {
  id: string
  kind: LogKind
  text: string
}

export interface BattleProps {
  initialLeaderboard: import('@/actions/leaderboard').LeaderboardEntry | null
  playerTeam: BattlePokemon[]
  opponentTeam: BattlePokemon[]
}
