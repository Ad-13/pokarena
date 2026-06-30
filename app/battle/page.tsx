import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import { getSession } from '@/actions/auth'
import { getLeaderboardEntry } from '@/actions/leaderboard'
import { getRoster } from '@/actions/roster'
import AuthRequired from '@/components/ui/AuthRequired'
import BattleArena from '@/components/battle/BattleArena'
import { getRandomOpponentTeam, rosterToBattleTeam } from '@/helpers/pokemon'

export default async function BattlePage() {
  const session = await getSession()

  if (!session) return <AuthRequired message="Sign in to enter the Battle Arena" />

  const roster = await getRoster(session.id)

  if (roster.length !== 6) {
    return (
      <div className="page-container battle-gate py-10">
        <div className="battle-gate-card">
          <ShieldAlert size={44} />
          <h1>Your roster is not ready</h1>
          <p>
            Battle is 6 vs 6. Choose exactly 6 Pokémon before entering the arena.
          </p>
          <div className="battle-gate-count">{roster.length} / 6 Pokémon selected</div>
          <Link href="/roster" className="btn-primary">
            Complete Roster
          </Link>
        </div>
      </div>
    )
  }

  const [leaderboardEntry, playerTeam, opponentTeam] = await Promise.all([
    getLeaderboardEntry(session.id),
    rosterToBattleTeam(roster),
    getRandomOpponentTeam(6),
  ])

  if (playerTeam.length !== 6 || opponentTeam.length !== 6) {
    return (
      <div className="page-container battle-gate py-10">
        <div className="battle-gate-card">
          <ShieldAlert size={44} />
          <h1>Battle data could not load</h1>
          <p>Please try again in a moment. PokeAPI did not return every Pokémon needed for the match.</p>
          <Link href="/roster" className="btn-secondary">
            Back to Roster
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container py-8 md:py-10">
      <BattleArena
        initialLeaderboard={leaderboardEntry}
        playerTeam={playerTeam}
        opponentTeam={opponentTeam}
      />
    </div>
  )
}
