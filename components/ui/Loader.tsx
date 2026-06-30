import { Loader2 } from 'lucide-react'

interface Props {
  className?: string
  size?:      number
}

export default function Loader({ className = '', size = 28 }: Props) {
  return (
    <div className={`flex items-center justify-center py-0.5 ${className}`}>
      <Loader2
        size={size}
        strokeWidth={1.5}
        className='animate-spin'
        style={{ color: 'var(--color-blue)' }}
      />
    </div>
  )
}
