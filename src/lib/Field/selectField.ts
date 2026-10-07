export function mergeAriaIds(...values: Array<string | undefined>) {
    const ids = values.flatMap(
        (value) => value?.split(/\s+/).filter(Boolean) ?? [],
    )
    return [...new Set(ids)].join(' ') || undefined
}
