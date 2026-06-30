import Link from 'next/link'
import { Trophy } from 'lucide-react'

export default function EmptyLeaderboard() {
  return (
    <div className="lb-empty">
      <Trophy size={56} className="lb-empty-icon" />
      <h2 className="lb-empty-title">No champions yet</h2>
      <p className="lb-empty-text">
        Be the first to claim a spot. Win battles to earn points and top the leaderboard.
      </p>
      <Link href="/battle" className="btn-primary">
        Enter the Arena
      </Link>
    </div>
  )
}
