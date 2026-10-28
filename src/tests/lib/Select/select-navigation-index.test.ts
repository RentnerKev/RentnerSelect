import { expect, mock, test } from 'bun:test'
import {
    indexSelectNavigation,
    findEnabledSelectEntry,
} from '../../../lib/Select/selectNavigationIndex.ts'

test('indexes internal identities without coercing values or merging duplicate and signed-zero choices', () => {
    const object = {}
    const values = [NaN, -0, 0, 1, '1', object, 'duplicate', 'duplicate']
    const entries = values.map((value, index) => ({
        radixValue: `id-${index}`,
        option: { value, label: String(index), disabled: index === 3 },
    }))
    const index = indexSelectNavigation(entries)
    values.forEach((value, position) => {
        expect(index.positions.get(`id-${position}`)?.entry.option.value).toBe(
            value,
        )
        expect(index.positions.get(`id-${position}`)?.index).toBe(position)
    })
    expect(index.positions.size).toBe(values.length)
})

test('checks only visited neighbors and reads disabled mutations live in both directions', () => {
    const entries = Array.from({ length: 10000 }, (_, index) => ({
        radixValue: String(index),
        option: { value: index, label: String(index), disabled: false },
    }))
    const disabled = mock(
        (option: (typeof entries)[number]['option']) => option.disabled,
    )
    expect(findEnabledSelectEntry(entries, disabled, 5001, 1)).toBe(
        entries[5001],
    )
    expect(disabled).toHaveBeenCalledTimes(1)
    entries[5001]!.option.disabled = true
    expect(findEnabledSelectEntry(entries, disabled, 5001, 1)).toBe(
        entries[5002],
    )
    expect(findEnabledSelectEntry(entries, disabled, 5001, -1)).toBe(
        entries[5000],
    )
    entries[5001]!.option.disabled = false
    expect(findEnabledSelectEntry(entries, disabled, 5001, -1)).toBe(
        entries[5001],
    )
    expect(findEnabledSelectEntry(entries, disabled, -1, -1)).toBeUndefined()
    expect(
        findEnabledSelectEntry(entries, disabled, entries.length, 1),
    ).toBeUndefined()
})
