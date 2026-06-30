import { getInitial } from '@/helpers/leaderboard'
import type { LeaderboardEntry } from '@/actions/leaderboard'

interface Props {
  entry: LeaderboardEntry | undefined
  rank: 1 | 2 | 3
}

export default function PodiumSpot({ entry, rank }: Props) {
  if (!entry) {
    return (
      <div className={`podium-spot podium-${rank} podium-empty`}>
        <div className="podium-avatar">—</div>
        <span className="podium-rank-badge">{rank}</span>
        <div className="podium-name">—</div>
        <div className="podium-block" />
      </div>
    )
  }

  return (
    <div className={`podium-spot podium-${rank}`}>
      <div className="podium-score">{entry.score.toLocaleString()}</div>
      <div className="podium-avatar">{getInitial(entry.username)}</div>
      <span className="podium-rank-badge">{rank}</span>
      <div className="podium-name">{entry.username}</div>
      <div className="podium-block" />
    </div>
  )
}
