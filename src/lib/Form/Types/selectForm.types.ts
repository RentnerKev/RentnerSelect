export interface SelectFormField<T> {
    name: string
    state: {
        value: T
        meta?: { errors?: ReadonlyArray<unknown>; isTouched?: boolean }
    }
    handleChange: (value: T) => void
    handleBlur: () => void
}
export interface SelectFormOptions {
    errorVisibility?: 'touched' | 'always' | 'never'
    mapError?: (error: unknown) => string | undefined
}
export interface SelectFieldProps<T> {
    name: string
    value: T
    onValueChange: (value: T) => void
    onBlur: () => void
    error: string | null
}
