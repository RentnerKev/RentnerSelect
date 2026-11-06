import type { SelectOptionGroup } from './Types/selectOptions.types.ts'

export function groupSelectEntries<TEntry>(
    entries: ReadonlyArray<TEntry>,
    getGroup: (entry: TEntry) => string | undefined,
): Array<SelectOptionGroup<TEntry>> {
    const groups = new Map<string | undefined, SelectOptionGroup<TEntry>>()
    for (const entry of entries) {
        const label = getGroup(entry) || undefined
        let group = groups.get(label)
        if (!group) {
            group = { label, entries: [] }
            groups.set(label, group)
        }
        group.entries.push(entry)
    }
    return Array.from(groups.values())
}
