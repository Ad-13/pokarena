import type { Metadata } from 'next'
import { getSession } from '@/actions/auth'
import { AuthModalProvider } from '@/contexts/AuthContext'
import BottomNav from '@/components/layout/BottomNav'
import { getRosterCountByUserId } from '@/lib/roster'
import './globals.css'

export const metadata: Metadata = {
  title: 'PokArena',
  description: 'Build your team. Become the Champion.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  const rosterCount = session ? await getRosterCountByUserId(session.id) : 0

  return (
    <html lang="en">
      <body className="flex flex-col min-h-svh">
        <AuthModalProvider session={session}>
          <main className="flex-1 relative z-10">{children}</main>
          <BottomNav rosterCount={rosterCount} />
        </AuthModalProvider>
      </body>
    </html>
  )
}
