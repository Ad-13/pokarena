import AutoOpenAuthModal from '@/components/ui/AutoOpenAuthModal'
import PokemonBrowser from '@/components/home/PokemonBrowser'
import PokeballSvg from '@/components/ui/PokeballSvg'
import { getSession } from '@/actions/auth'
import { getPokemonList } from '@/actions/pokeapi'
import { getRosterPokemonIdsByUserId } from '@/actions/roster'

interface Props {
  searchParams: Promise<{ modal?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { modal } = await searchParams
  const session = await getSession()
  const pokemonList = await getPokemonList()
  const rosterIds = session ? await getRosterPokemonIdsByUserId(session.id) : new Set<number>()

  return (
    <div className="page-container py-10">
      {modal === 'auth' && <AutoOpenAuthModal />}

      <section className="hero animate-slide-up">
        <div>
          <div className="hero-logo">
            <PokeballSvg className="logo-ball" clipId="hero-logo-ball" size={40} />
            <span className="txt">
              Pok<em>Arena</em>
            </span>
          </div>
          <p className="hero-eyebrow">Pokemon Battle Arena</p>
          <h1>
            Build your team.
            <br />
            Become the <em>Champion</em>.
          </h1>
          <p>Pick your fighters, study their stats, and assemble a roster ready for battle.</p>
        </div>

        <div className="mascot-wrap" aria-hidden>
          <div className="m-ring" />
          <div className="m-ring2" />
          <div className="m-glow" />
          <div className="sp sp1" />
          <div className="sp sp2" />
          <div className="sp sp3" />
          <svg className="m-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <ellipse className="m-ear-l" cx="62" cy="66" rx="18" ry="30" fill="#6FD9C9" />
            <ellipse className="m-ear-r" cx="138" cy="66" rx="18" ry="30" fill="#6FD9C9" />
            <ellipse cx="62" cy="70" rx="9" ry="18" fill="#FF8FAB" opacity=".5" />
            <ellipse cx="138" cy="70" rx="9" ry="18" fill="#FF8FAB" opacity=".5" />
            <path d="M100 24 L118 62 L82 62 Z" fill="#FFD000" />
            <ellipse cx="100" cy="122" rx="68" ry="62" fill="#6FD9C9" />
            <ellipse cx="100" cy="148" rx="40" ry="30" fill="rgba(255,255,255,.13)" />
            <g className="m-eye">
              <circle cx="78" cy="108" r="12" fill="#0C1A2E" />
              <circle cx="122" cy="108" r="12" fill="#0C1A2E" />
              <circle cx="82" cy="104" r="4" fill="#fff" />
              <circle cx="126" cy="104" r="4" fill="#fff" />
            </g>
            <ellipse cx="60" cy="130" rx="10" ry="6" fill="#FFB6C5" opacity=".65" />
            <ellipse cx="140" cy="130" rx="10" ry="6" fill="#FFB6C5" opacity=".65" />
            <path d="M86 144 Q100 157 114 144" stroke="#0C1A2E" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          </svg>
          <div className="m-badge">Ready to battle!</div>
        </div>
      </section>

      <PokemonBrowser
        pokemonList={pokemonList}
        isLoggedIn={Boolean(session)}
        rosterIds={[...rosterIds]}
      />
    </div>
  )
}
