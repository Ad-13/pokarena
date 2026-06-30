'use client'

import { usePathname, useRouter } from 'next/navigation'
import { LogIn, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { logout } from '@/actions/auth'
import BattleGuardModal from '@/components/ui/BattleGuardModal'
import PokeballSvg from '@/components/ui/PokeballSvg'
import NavItem from './NavItem'
import { IconHome, IconShield, IconSword, IconTrophy } from '@tabler/icons-react'

const NAV_ITEMS = [
  { href: '/', icon: IconHome, label: 'Home' },
  { href: '/roster', icon: IconShield, label: 'My Roster' },
  { href: '/battle', icon: IconSword, label: 'Battle' },
  { href: '/leaderboard', icon: IconTrophy, label: 'Leaderboard' },
] as const

interface Props {
  rosterCount: number
}

export default function BottomNav({ rosterCount }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { session, openModal } = useAuth()
  const [battleGuardOpen, setBattleGuardOpen] = useState(false)

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pokarena:battle-guard', { detail: { open: battleGuardOpen } }))
  }, [battleGuardOpen])

  async function handleLogout() {
    if (window.sessionStorage.getItem('pokarena:battle-active') === '1') {
      setBattleGuardOpen(true)
      return
    }

    await logout()
    router.refresh()
  }

  return (
    <nav
      aria-label="Main navigation"
      className="bg-nav
           backdrop-filter backdrop-blur-[20px]
           border border-nav-bd
           py-6 pt-3 pb-5
           fixed bottom-0 left-0 right-0 z-30"
    >
      {/* user and guest */}
      <div className="nav-tabs left-6">
        {session ? (
          <>
            {/* avatar */}
            <div
              className="relative shrink-0 w-7 h-7 rounded-full
                         flex items-center justify-center font-display font-bold "
              style={{
                background: 'rgba(80,144,255,0.18)',
                border: '1.5px solid rgba(80,144,255,0.4)',
                color: 'var(--color-blue)',
              }}
            >
              {session.name.charAt(0).toUpperCase()}

              {/* online */}
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full
                           border-2 animate-pulsate"
                style={{
                  background: 'var(--color-success)',
                  borderColor: 'rgba(10,20,38,0.92)',
                }}
                aria-label="Online"
              />
            </div>

            <span
              className=" font-semibold max-w-40 truncate"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {session.name}
            </span>
          </>
        ) : (
          <>
            <PokeballSvg size={22} clipId="nav-ball" className="opacity-50" />
            <span style={{ color: 'var(--color-text-dim)' }}>Guest</span>
          </>
        )}
      </div>

      {/* Sign in / Sign out */}
      <div className="nav-tabs right-6">
        {session ? (
          <button
            onClick={handleLogout}
            className="btn-ghost flex items-center gap-1.5  p-0"
            aria-label="Sign out"
          >
            <LogOut size={14} />
            Sign out
          </button>
        ) : (
          <button
            onClick={() => openModal('login')}
            className="btn-ghost flex items-center gap-1.5  p-0"
            style={{ color: 'var(--color-accent)' }}
            aria-label="Sign in"
          >
            <LogIn size={14} />
            Sign in
          </button>
        )}
      </div>

      {/* nav */}
      <div className="max-w-lg mx-auto flex items-center justify-center gap-3">
        {NAV_ITEMS.map(({ href, icon, label }) => (
          <NavItem
            key={href}
            href={href}
            icon={icon}
            label={label}
            isActive={href === '/' ? pathname === '/' : pathname.startsWith(href)}
            isBattle={href === '/battle'}
            badge={href === '/roster' ? rosterCount : undefined}
            onNavigateBlocked={() => setBattleGuardOpen(true)}
          />
        ))}
      </div>

      <BattleGuardModal
        open={battleGuardOpen}
        onClose={() => setBattleGuardOpen(false)}
      />
    </nav>
  )
}
