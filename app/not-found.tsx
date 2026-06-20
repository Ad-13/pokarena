import Link from 'next/link'
import PokeballSvg from '@/components/ui/PokeballSvg'

export default function NotFound() {
  return (
    <div className='flex flex-col items-center justify-center min-h-[70vh] text-center px-4'>
      <PokeballSvg size={72} className='pokeball-idle mb-6 opacity-40' clipId='not-found-ball' />
      <h1 className='font-display font-bold text-5xl mb-2' style={{ color: 'var(--color-text)' }}>
        404
      </h1>
      <p className='font-display text-lg mb-1' style={{ color: 'var(--color-text-muted)' }}>
        This Pokémon fled the scene
      </p>
      <p className='text-sm mb-8' style={{ color: 'var(--color-text-dim)' }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href='/' className='btn-primary'>Back to Home</Link>
    </div>
  )
}
