export const requiredValidator =
    (label: string) =>
    ({ value }: { value: unknown }) => {
        const isEmpty = Array.isArray(value)
            ? value.length === 0
            : typeof value !== 'string' || value.trim().length === 0

        return isEmpty ? `${label} ist erforderlich.` : undefined
    }
