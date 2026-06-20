import { getSession } from '@/actions/auth'
import AuthRequired from '@/components/ui/AuthRequired'

export default async function RosterPage() {
  const session = await getSession()

  if (!session) return <AuthRequired message='Sign in to manage your Pokémon roster' />

  return (
    <div className='page-container py-10'>
      <p style={{ color: 'var(--color-text-dim)' }}>
        Roster page
      </p>
    </div>
  )
}
