import { forwardRef, type InputHTMLAttributes } from 'react'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={id}
            ref={ref}
            type="checkbox"
            className={`
              h-4 w-4 rounded border-slate-300 text-ep-primary 
              focus:ring-ep-primary focus:ring-offset-0
              dark:border-slate-600 dark:bg-slate-700 dark:checked:bg-ep-primary
              dark:focus:ring-ep-primary-accent dark:focus:ring-offset-slate-900
              cursor-pointer transition-colors
              ${error ? 'border-red-500 dark:border-red-400' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {label && (
          <label
            htmlFor={id}
            className={`ml-2 typo-body-sm cursor-pointer select-none ${
              error
                ? 'text-red-600 dark:text-red-400'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
