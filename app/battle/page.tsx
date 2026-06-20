import { getSession } from '@/actions/auth'
import AuthRequired from '@/components/ui/AuthRequired'

export default async function BattlePage() {
  const session = await getSession()

  if (!session) return <AuthRequired message='Sign in to enter the Battle Arena' />

  return (
    <div className='page-container py-10'>
      <p style={{ color: 'var(--color-text-dim)' }}>
        Battle page
      </p>
    </div>
  )
}
