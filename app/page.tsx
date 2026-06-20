import AutoOpenAuthModal from '@/components/ui/AutoOpenAuthModal'

interface Props {
  searchParams: Promise<{ modal?: string }>
}

export default async function HomePage({ searchParams }: Props) {
  const { modal } = await searchParams

  return (
    <div className="page-container py-10">
      {modal === 'auth' && <AutoOpenAuthModal />}

      <p style={{ color: 'var(--color-text-dim)' }}> Home page</p>
    </div>
  )
}
