import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Check, Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/cn'

type PasswordInputProps = {
  label?: string
  error?: string | null
  success?: boolean
  successLabel?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, success = false, successLabel, className, ...props }, ref) {
    const [showPassword, setShowPassword] = useState(false)
    const showSuccess = success && !error

    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block typo-label">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'ep-input-field pr-10',
              showSuccess && 'pr-16 border-emerald-400 focus:border-emerald-500 focus:ring-emerald-500 dark:border-emerald-500',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-500',
              className
            )}
            {...props}
          />
          {showSuccess ? (
            <span
              className="pointer-events-none absolute right-10 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400"
              aria-label={successLabel}
              role={successLabel ? 'img' : undefined}
            >
              <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-ep-body/60 hover:text-ep-body hover:bg-ep-surface-panel focus:outline-none focus:ring-2 focus:ring-ep-primary focus:ring-offset-1 dark:text-white/60 dark:hover:text-white dark:hover:bg-white/10 dark:focus:ring-ep-primary-accent dark:focus:ring-offset-ep-surface"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {error && <p className="typo-body-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)
