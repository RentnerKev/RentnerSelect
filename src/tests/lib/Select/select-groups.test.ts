import { expect, test } from 'bun:test'
import { groupSelectEntries } from '../../../lib/Select/selectGroups.ts'

test('groups in first-seen order while preserving item order and plain options', () => {
    const entries = [
        { label: 'B1', group: 'B' },
        { label: 'Plain' },
        { label: 'A1', group: 'A' },
        { label: 'B2', group: 'B' },
        { label: 'Plain2', group: '' },
    ]
    expect(groupSelectEntries(entries, (entry) => entry.group)).toEqual([
        { label: 'B', entries: [entries[0], entries[3]] },
        { label: undefined, entries: [entries[1], entries[4]] },
        { label: 'A', entries: [entries[2]] },
    ])
    expect(entries.map((entry) => entry.label)).toEqual([
        'B1',
        'Plain',
        'A1',
        'B2',
        'Plain2',
    ])
    expect(groupSelectEntries([], () => 'Empty')).toEqual([])
})
