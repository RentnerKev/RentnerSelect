import type { SelectOptionGroup } from './Types/selectOptions.types.ts'

export function groupSelectEntries<TEntry>(
    entries: ReadonlyArray<TEntry>,
    getGroup: (entry: TEntry) => string | undefined,
): Array<SelectOptionGroup<TEntry>> {
    let first: SelectOptionGroup<TEntry> | undefined
    let map: Map<string | undefined, SelectOptionGroup<TEntry>> | undefined
    for (const entry of entries) {
        const label = getGroup(entry) || undefined
        if (!map && (!first || first.label === label)) {
            ;(first ??= { label, entries: [] }).entries.push(entry)
            continue
        }
        map ??= new Map([[first!.label, first!]])
        let group = map.get(label)
        if (!group) map.set(label, (group = { label, entries: [] }))
        group.entries.push(entry)
    }
    return map ? [...map.values()] : first ? [first] : []
}
