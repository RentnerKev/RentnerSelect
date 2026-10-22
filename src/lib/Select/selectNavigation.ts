import type { OptionEntry } from './Types/selectOptions.types.ts'
import type { Option } from './Types/selectOptions.types.ts'

export function findTypeaheadEntry<TValue>(
    entries: ReadonlyArray<OptionEntry<TValue>>,
    currentRadixValue: string | undefined,
    search: string,
    isOptionDisabled: (option: Option<TValue>) => boolean,
): OptionEntry<TValue> | undefined {
    const normalized = search.toLowerCase()
    if (!normalized) return undefined
    const query = Array.from(normalized).every(
        (letter) => letter === normalized[0],
    )
        ? normalized[0]!
        : normalized
    const enabled = entries.filter(({ option }) => !isOptionDisabled(option))
    const currentIndex = enabled.findIndex(
        ({ radixValue }) => radixValue === currentRadixValue,
    )
    const start =
        currentIndex < 0 ? 0 : currentIndex + (query.length === 1 ? 1 : 0)
    for (let offset = 0; offset < enabled.length; offset++) {
        const entry = enabled[(start + offset) % enabled.length]!
        if (entry.option.label.toLowerCase().startsWith(query))
            return entry.radixValue === currentRadixValue ? undefined : entry
    }
    return undefined
}
