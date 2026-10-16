import type {
    SelectFieldProps,
    SelectFormField,
    SelectFormOptions,
} from './Types/selectForm.types.ts'
export type {
    SelectFieldProps,
    SelectFormField,
    SelectFormOptions,
} from './Types/selectForm.types.ts'

export function getReadableSelectError(error: unknown): string | undefined {
    if (typeof error === 'string') return error || undefined
    if (
        error &&
        typeof error === 'object' &&
        'message' in error &&
        typeof error.message === 'string'
    )
        return error.message || undefined
    return undefined
}

/** Structural integration: no form library or UI runtime is imported. */
export function getSelectFieldProps<T>(
    field: SelectFormField<T>,
    options: SelectFormOptions = {},
): SelectFieldProps<T> {
    const visibility = options.errorVisibility ?? 'touched'
    const visible =
        visibility === 'always' ||
        (visibility === 'touched' && field.state.meta?.isTouched === true)
    const messages = visible
        ? (field.state.meta?.errors ?? [])
              .map(options.mapError ?? getReadableSelectError)
              .filter((message): message is string => Boolean(message))
        : []
    return {
        name: field.name,
        value: field.state.value,
        onValueChange: (value) => field.handleChange(value),
        onBlur: () => field.handleBlur(),
        error: messages.join(', ') || null,
    }
}
