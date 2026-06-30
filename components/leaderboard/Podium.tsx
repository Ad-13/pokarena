import type { LeaderboardEntry } from '@/actions/leaderboard'
import PodiumSpot from './PodiumSpot'

interface Props {
  topThree: LeaderboardEntry[]
}

export default function Podium({ topThree }: Props) {
  const [first, second, third] = topThree

  return (
    <section className="podium" aria-label="Top 3 trainers">
      <PodiumSpot entry={second} rank={2} />
      <PodiumSpot entry={first} rank={1} />
      <PodiumSpot entry={third} rank={3} />
    </section>
  )
}
