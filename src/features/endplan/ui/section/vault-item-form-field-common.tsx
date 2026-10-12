type SelectOption = {
  value: string
  label: string
}

type FormSelectFieldProps = {
  label: string
  placeholder: string
  value: string
  options: readonly SelectOption[]
  onChange: (value: string) => void
}

type FormTextareaFieldProps = {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  minHeightClass?: string
}

export function FormSelectField({
  label,
  placeholder,
  value,
  options,
  onChange,
}: FormSelectFieldProps) {
  return (
    <div>
      <label className="mb-1 block typo-body-sm-strong text-ep-body">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export function FormTextareaField({
  label,
  placeholder,
  value,
  onChange,
  minHeightClass = 'min-h-[80px]',
}: FormTextareaFieldProps) {
  return (
    <div>
      <label className="mb-2 block typo-body-sm-strong text-ep-body">
        {label}
      </label>
      <textarea
        className={`w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 resize-y ${minHeightClass}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
