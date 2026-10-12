import { useRef } from 'react'
import { cn } from '@/shared/lib/cn'

type VerificationCodeInputProps = {
    value: string[]
    length?: number
    onComplete?: (code: string) => void
    onChange: (value: string[]) => void
    error?: boolean
    disabled?: boolean
    className?: string
}

export function VerificationCodeInput({
    value,
    length = 6,
    onComplete,
    onChange,
    error,
    disabled,
    className,
}: VerificationCodeInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([])

    const handleCodeChange = (index: number, char: string) => {
        // Only allow digits
        if (char && !/^\d$/.test(char)) return

        const newCode = [...value]
        newCode[index] = char
        onChange(newCode)

        // Auto-focus next input
        if (char && index < length - 1) {
            inputRefs.current[index + 1]?.focus()
        }

        // Check completion
        if (char && index === length - 1 && newCode.every((d) => d)) {
            onComplete?.(newCode.join(''))
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus()
        }
    }

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)

        if (pastedData) {
            const newCode = Array(length).fill('')
            pastedData.split('').forEach((char, i) => {
                if (i < length) newCode[i] = char
            })
            onChange(newCode)

            const focusIndex = Math.min(pastedData.length, length - 1)
            inputRefs.current[focusIndex]?.focus()

            if (pastedData.length === length) {
                onComplete?.(pastedData)
            }
        }
    }

    return (
        <div className={cn("flex justify-center gap-2", className)}>
            {value.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={disabled}
                    className={cn(
                        "w-12 h-14 text-center typo-heading-page-static border rounded-lg outline-none transition-colors",
                        "bg-white dark:bg-ep-surface-panel text-slate-900 dark:text-slate-100",
                        error
                            ? "border-red-300 dark:border-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                            : "border-slate-300 dark:border-slate-600 focus:border-ep-primary focus:ring-2 focus:ring-ep-primary dark:focus:border-ep-primary-accent dark:focus:ring-ep-primary-accent",
                        disabled && "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-900"
                    )}
                />
            ))}
        </div>
    )
}
