interface Props {
  params: Promise<{ id: string }>
}

export default async function PokemonDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <div className='page-container py-10'>
      <p style={{ color: 'var(--color-text-dim)' }}>
        Pokemon #{id} detail
      </p>
    </div>
  )
}
