import { describe, expect, test } from 'bun:test'
import { findTypeaheadEntry } from '../../../lib/Select/selectNavigation.ts'
const entries = [
    {
        radixValue: 'a-disabled',
        option: {
            value: 'a-disabled',
            label: 'Alpha disabled',
            disabled: true,
        },
    },
    { radixValue: 'a', option: { value: 'a', label: 'Alpha' } },
    { radixValue: 'al', option: { value: 'al', label: 'Alpine' } },
    { radixValue: 'ny', option: { value: 'ny', label: 'New York' } },
]
const isDisabled = (option: { disabled?: boolean }) => Boolean(option.disabled)
describe('complete-list typeahead', () => {
    test('skips disabled matches and cycles repeated keys', () => {
        expect(
            findTypeaheadEntry(entries, undefined, 'A', isDisabled)?.radixValue,
        ).toBe('a')
        expect(
            findTypeaheadEntry(entries, 'a', 'aa', isDisabled)?.radixValue,
        ).toBe('al')
        expect(
            findTypeaheadEntry(entries, 'al', 'aaa', isDisabled)?.radixValue,
        ).toBe('a')
    })
    test('matches buffered labels with spaces and avoids toggling an unchanged match', () => {
        expect(
            findTypeaheadEntry(entries, 'a', 'New Y', isDisabled)?.radixValue,
        ).toBe('ny')
        expect(
            findTypeaheadEntry(entries, 'ny', 'New Yo', isDisabled),
        ).toBeUndefined()
        expect(
            findTypeaheadEntry(entries, 'a', 'missing', isDisabled),
        ).toBeUndefined()
        expect(
            findTypeaheadEntry([], undefined, 'a', isDisabled),
        ).toBeUndefined()
    })
})
