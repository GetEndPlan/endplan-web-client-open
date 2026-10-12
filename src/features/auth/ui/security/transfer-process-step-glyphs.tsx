import { useId } from 'react'
import { cn } from '@/shared/lib/cn'

const GLYPH_SIZE = 'h-6 w-6'
const GLYPH_BOX = `inline-flex ${GLYPH_SIZE} shrink-0 items-center justify-center select-none`

function safeSvgId(prefix: string, reactId: string): string {
  return `${prefix}-${reactId.replace(/:/g, '')}`
}

/** Blue rounded square + white circular arrows (screenshot-style). */
export function TransferProcessSyncGlyph({ className }: { className?: string }) {
  const reactId = useId()
  const gradId = safeSvgId('tpSyncGrad', reactId)
  return (
    <span className={cn(GLYPH_BOX, className)} aria-hidden>
      <svg viewBox="0 0 40 40" className={GLYPH_SIZE} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={gradId} x1="20" y1="2" x2="20" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6BA8FA" />
            <stop offset="0.45" stopColor="#4F8FF7" />
            <stop offset="1" stopColor="#2563D4" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="38" height="38" rx="10" fill={`url(#${gradId})`} />
        <rect x="1" y="1" width="38" height="38" rx="10" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        <g transform="translate(8,8)" stroke="white" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" fill="none" />
          <path d="M21 3v5h-5" fill="none" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" fill="none" />
          <path d="M8 16H3v5" fill="none" />
        </g>
      </svg>
    </span>
  )
}

/** White envelope, blue “E” on flap, soft drop shadow (screenshot-style). */
export function TransferProcessMailGlyph({ className }: { className?: string }) {
  const reactId = useId()
  const filterId = safeSvgId('tpMailShadow', reactId)
  return (
    <span className={cn(GLYPH_BOX, className)} aria-hidden>
      <svg viewBox="0 0 44 44" className={GLYPH_SIZE} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id={filterId} x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.4" floodColor="#0f172a" floodOpacity="0.18" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          <rect x="7" y="17" width="30" height="17" rx="2.5" fill="white" stroke="#E2E8F0" strokeWidth="1.15" />
          <path d="M7 17 L22 28.5 L37 17" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1.15" strokeLinejoin="round" />
        </g>
        <text
          x="22"
          y="20.5"
          textAnchor="middle"
          fill="#1D4ED8"
          fontSize="10.5"
          fontWeight="800"
          fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
        >
          E
        </text>
      </svg>
    </span>
  )
}

/** Gold lock body + silver shackle (screenshot-style). */
export function TransferProcessLockGlyph({ className }: { className?: string }) {
  const reactId = useId()
  const bodyGrad = safeSvgId('tpLockBody', reactId)
  const filterId = safeSvgId('tpLockShadow', reactId)
  return (
    <span className={cn(GLYPH_BOX, className)} aria-hidden>
      <svg viewBox="0 0 40 40" className={GLYPH_SIZE} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={bodyGrad} x1="11" y1="20" x2="29" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE68A" />
            <stop offset="0.5" stopColor="#FBBF24" />
            <stop offset="1" stopColor="#D97706" />
          </linearGradient>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#0f172a" floodOpacity="0.16" />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          <path
            d="M13 18 V14a7 7 0 0 1 14 0v4"
            stroke="#C5CCD6"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="9" y="18" width="22" height="14" rx="2.5" fill={`url(#${bodyGrad})`} stroke="#B45309" strokeWidth="1.1" />
        </g>
      </svg>
    </span>
  )
}
