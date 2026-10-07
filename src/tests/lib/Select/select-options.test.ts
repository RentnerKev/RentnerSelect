import { describe, expect, test } from 'bun:test'
import {
    getOptionKey,
    indexOptions,
    reconcileOptionEntries,
} from '../../../lib/Select/selectOptions.js'

const compare = (left: { id: number }, right: { id: number }) =>
    left.id === right.id

describe('option identity indexes', () => {
    test('keeps Object.is identities and FIFO duplicates across immutable reorders', () => {
        const object = {}
        const values = [0, -0, NaN, object, 'duplicate', 'duplicate']
        const initial = reconcileOptionEntries(
            values.map((value, index) => ({ value, label: String(index) })),
            { optionEntries: [], nextRadixValue: 0 },
            Object.is,
        )
        const next = reconcileOptionEntries(
            [NaN, -0, 'duplicate', object, 0, 'duplicate'].map((value) => ({
                value,
                label: 'updated',
            })),
            initial,
            Object.is,
        )
        expect(next.optionEntries.map((entry) => entry.radixValue)).toEqual([
            'option-2',
            'option-1',
            'option-4',
            'option-3',
            'option-0',
            'option-5',
        ])
        expect(next.nextRadixValue).toBe(6)
        expect(
            next.optionEntries.every(
                (entry) => entry.option.label === 'updated',
            ),
        ).toBe(true)
        const removed = reconcileOptionEntries(
            [{ value: NaN, label: 'NaN' }],
            next,
            Object.is,
        )
        const added = reconcileOptionEntries(
            [
                { value: 0, label: 'readded' },
                { value: NaN, label: 'retained' },
            ],
            removed,
            Object.is,
        )
        expect(added.optionEntries.map((entry) => entry.radixValue)).toEqual([
            'option-6',
            'option-2',
        ])
    })

    test('reuses unchanged entry objects and preserves custom comparator matching', () => {
        const options = [
            { value: { id: 1 }, label: 'first' },
            { value: { id: 1 }, label: 'second' },
        ]
        const initial = reconcileOptionEntries(
            options,
            { optionEntries: [], nextRadixValue: 0 },
            compare,
        )
        const unchanged = reconcileOptionEntries(options, initial, compare)
        expect(unchanged.optionEntries[0]).toBe(initial.optionEntries[0])
        const next = reconcileOptionEntries(
            [
                { value: { id: 1 }, label: 'replacement' },
                { value: { id: 1 }, label: 'replacement 2' },
            ],
            initial,
            compare,
        )
        expect(next.optionEntries.map((entry) => entry.radixValue)).toEqual([
            'option-0',
            'option-1',
        ])
    })

    test('indexes first form-option position without merging signed zero', () => {
        const object = {}
        const index = indexOptions(
            [0, -0, NaN, NaN, object].map((value) => ({ value, label: '' })),
        )
        expect(index.get(getOptionKey(0))).toBe(0)
        expect(index.get(getOptionKey(-0))).toBe(1)
        expect(index.get(getOptionKey(NaN))).toBe(2)
        expect(index.get(getOptionKey(object))).toBe(4)
        expect(index.has(getOptionKey({}))).toBe(false)
    })
})
