import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

type PasswordStrengthProps = {
  password: string
}

type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong'

type StrengthResult = {
  level: StrengthLevel
  score: number
  color: string
  bgColor: string
}

function calculateStrength(password: string): StrengthResult {
  if (!password) {
    return { level: 'weak', score: 0, color: '', bgColor: '' }
  }

  // Align with policy: 8+ chars, uppercase, special; optional extra length fills the 4th bar
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[^a-zA-Z0-9]/.test(password)) score += 1
  if (password.length >= 12) score += 1

  if (score <= 1) {
    return {
      level: 'weak',
      score: 1,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500',
    }
  }
  if (score === 2) {
    return {
      level: 'fair',
      score: 2,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500',
    }
  }
  if (score === 3) {
    return {
      level: 'good',
      score: 3,
      color: 'text-green-500 dark:text-green-400',
      bgColor: 'bg-green-500',
    }
  }
  return {
    level: 'strong',
    score: 4,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500',
  }
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const { t } = useTranslation()
  const strength = useMemo(() => calculateStrength(password), [password])

  if (!password) return null

  return (
    <div className="mt-2">
      {/* Strength label and bars inline */}
      <div className="flex items-center gap-3">
        <span className="typo-caption text-slate-500 dark:text-slate-400 whitespace-nowrap">
          {t('auth.passwordStrength.label')}
        </span>
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`h-2 flex-1 rounded transition-all duration-300 ${
                level <= strength.score
                  ? strength.bgColor
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
      
      {/* Strength hints */}
      <StrengthHints password={password} />
    </div>
  )
}

type HintItem = { key: string; label: string; met: boolean }

function StrengthHints({ password }: { password: string }) {
  const { t } = useTranslation()
  const items: HintItem[] = [
    { key: 'chars', label: t('auth.passwordStrength.chars'), met: password.length >= 8 },
    { key: 'uppercase', label: t('auth.passwordStrength.uppercase'), met: /[A-Z]/.test(password) },
    { key: 'symbol', label: t('auth.passwordStrength.symbol'), met: /[^a-zA-Z0-9]/.test(password) },
  ]

  if (!password) return null

  return (
    <div className="mt-1.5 space-y-0.5">
      <span className="typo-caption text-slate-500 dark:text-slate-400">
        {t('auth.passwordStrength.hint')}
      </span>
      <ul className="flex flex-wrap gap-x-3 gap-y-0.5 typo-caption">
        {items.map(({ key, label, met }) => (
          <li
            key={key}
            className={met ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}
          >
            {met ? '✓ ' : '○ '}
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
