interface Props {
  size?:      number
  className?: string
  clipId?:    string
}

export default function PokeballSvg({
  size    = 36,
  className = '',
  clipId  = 'pokeball-clip',
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 40 40'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx='20' cy='20' r='18' />
        </clipPath>
      </defs>

      <circle cx='20' cy='20' r='19.5' fill='rgba(255,208,0,0.12)' />

      <g clipPath={`url(#${clipId})`}>
        <rect x='0' y='0'  width='40' height='20' fill='#E82222' />
        <ellipse
          cx='13' cy='11' rx='6' ry='4'
          fill='rgba(255,255,255,0.22)'
          transform='rotate(-20 13 11)'
        />
        <rect x='0' y='20' width='40' height='20' fill='#F0F0F0' />
        <rect x='0' y='17' width='40' height='6'  fill='#111827' />
        <circle cx='20' cy='20' r='7.5' fill='#111827' />
        <circle cx='20' cy='20' r='5.5' fill='#FFFFFF' />
        <circle cx='18' cy='18' r='2.2' fill='rgba(255,255,255,0.65)' />
      </g>

      <circle
        cx='20' cy='20' r='18'
        fill='none'
        stroke='rgba(255,208,0,0.45)'
        strokeWidth='1.5'
      />
    </svg>
  )
}
