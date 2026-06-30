import { formatLeaderboardDate, getMedal, getInitial } from '@/helpers/leaderboard'
import type { LeaderboardEntry } from '@/actions/leaderboard'

interface Props {
  entries: LeaderboardEntry[]
  currentUserId: string | null
}

export default function LeaderboardTable({ entries, currentUserId }: Props) {
  return (
    <div className="lb-table-wrap">
      <table className="lb-table">
        <thead>
          <tr>
            <th className="lb-th-rank">#</th>
            <th>Trainer</th>
            <th>Score</th>
            <th className="lb-th-date">Date</th>
            <th className="lb-th-medal" aria-label="Medal" />
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const rank = index + 1
            const isCurrentUser = currentUserId !== null && entry.user_id === currentUserId

            return (
              <tr key={entry.id} className={isCurrentUser ? 'lb-row lb-row-me' : 'lb-row'}>
                <td className={rank <= 3 ? 'lb-rank lb-rank-top' : 'lb-rank'}>{rank}</td>
                <td>
                  <div className="lb-player">
                    <span className="lb-avatar">{getInitial(entry.username)}</span>
                    <span className="lb-username">
                      {entry.username}
                      {isCurrentUser && <span className="lb-you-tag">You</span>}
                    </span>
                  </div>
                </td>
                <td className="lb-score">{entry.score.toLocaleString()}</td>
                <td className="lb-date">{formatLeaderboardDate(entry.date)}</td>
                <td className="lb-medal">{getMedal(rank)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
