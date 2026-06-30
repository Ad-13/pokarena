import { Trophy } from 'lucide-react'
import { getTopLeaderboard } from '@/actions/leaderboard'
import { getSession } from '@/actions/auth'
import PokemonLogo from '@/components/ui/PokemonLogo'
import Podium from '@/components/leaderboard/Podium'
import LeaderboardTable from '@/components/leaderboard/LeaderboardTable'
import EmptyLeaderboard from '@/components/leaderboard/EmptyLeaderboard'

export default async function LeaderboardPage() {
  const [entries, session] = await Promise.all([getTopLeaderboard(), getSession()])

  const currentUserId = session?.id ?? null
  const topThree = entries.slice(0, 3)
  const hasEntries = entries.length > 0

  return (
    <div className="page-container leaderboard-page py-8 md:py-10">
      <header className="lb-header">
        <div className="lb-brand-row">
          <PokemonLogo size="md" />
        </div>

        <div className="lb-title-copy">
          <p className="lb-kicker">
            <Trophy size={13} />
            Hall of Fame
          </p>
          <h1>Leaderboard</h1>
          <p>The greatest trainers, ranked by battle score.</p>
        </div>
      </header>

      {hasEntries ? (
        <>
          <Podium topThree={topThree} />
          <LeaderboardTable entries={entries} currentUserId={currentUserId} />
        </>
      ) : (
        <EmptyLeaderboard />
      )}
    </div>
  )
}
