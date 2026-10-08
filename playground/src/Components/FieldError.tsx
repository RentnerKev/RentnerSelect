import type { FieldErrorProps } from '../Types/playground.types.ts'

export function FieldError({ errors }: FieldErrorProps) {
    if (errors.length === 0) {
        return null
    }

    return (
        <p className="text-sm font-medium text-red-300">{String(errors[0])}</p>
    )
}
