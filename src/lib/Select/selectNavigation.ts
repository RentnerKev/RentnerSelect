import type { OptionEntry } from './Types/selectOptions.types.ts'
import type { Option } from './Types/selectOptions.types.ts'

export function findTypeaheadEntry<TValue>(
    entries: ReadonlyArray<OptionEntry<TValue>>,
    currentRadixValue: string | undefined,
    search: string,
    isOptionDisabled: (option: Option<TValue>) => boolean,
): OptionEntry<TValue> | undefined {
    const normalized = search.toLowerCase()
    const len = entries.length
    if (!normalized || !len) return undefined
    let allSame = true
    for (let i = 1; i < normalized.length; i += 1) {
        if (normalized[i] !== normalized[0]) {
            allSame = false
            break
        }
    }
    const query = allSame ? normalized[0]! : normalized
    const currentIndex =
        currentRadixValue === undefined
            ? -1
            : entries.findIndex(
                  (e) =>
                      e.radixValue === currentRadixValue &&
                      !isOptionDisabled(e.option),
              )
    const start =
        currentIndex < 0
            ? 0
            : (currentIndex + (query.length === 1 ? 1 : 0)) % len
    for (let offset = 0; offset < len; offset += 1) {
        const entry = entries[(start + offset) % len]!
        if (
            !isOptionDisabled(entry.option) &&
            entry.option.label.toLowerCase().startsWith(query)
        )
            return entry.radixValue === currentRadixValue ? undefined : entry
    }
    return undefined
}
