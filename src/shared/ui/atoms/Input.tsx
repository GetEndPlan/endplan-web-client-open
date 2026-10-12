import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type InputProps = {
  label?: string
  error?: string | null
} & InputHTMLAttributes<HTMLInputElement>

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, className, ...props }, ref) {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block typo-label">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'ep-input-field',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500 dark:border-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="typo-body-sm text-red-600 dark:text-red-400">{error}</p>}
      </div>
    )
  }
)
