import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PokArena',
  description: 'Build your team. Become the Champion.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang='en'>
      <body className='flex flex-col min-h-svh'>
        <main className='flex-1 relative z-10'>
          {children}
        </main>
      </body>
    </html>
  )
}
