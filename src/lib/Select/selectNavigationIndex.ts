import type { Option, OptionEntry } from './Types/selectOptions.types.ts'
import type { SelectNavigationIndex } from './Types/selectNavigationIndex.types.ts'

export function indexSelectNavigation<TValue>(
    entries: ReadonlyArray<OptionEntry<TValue>>,
): SelectNavigationIndex<TValue> {
    const positions = new Map<
        string,
        { entry: OptionEntry<TValue>; index: number }
    >()
    entries.forEach((entry, index) => {
        if (!positions.has(entry.radixValue))
            positions.set(entry.radixValue, { entry, index })
    })
    return { positions }
}

export function findEnabledSelectEntry<TValue>(
    entries: ReadonlyArray<OptionEntry<TValue>>,
    isOptionDisabled: (option: Option<TValue>) => boolean,
    start: number,
    direction: 1 | -1,
): OptionEntry<TValue> | undefined {
    for (
        let index = start;
        index >= 0 && index < entries.length;
        index += direction
    ) {
        const entry = entries[index]!
        if (!isOptionDisabled(entry.option)) return entry
    }
    return undefined
}
