import { describe, expect, test } from 'bun:test'
import { resolveSelectMessages, selectMessageCatalog } from '../index.js'

describe('select locale messages', () => {
    test('keeps German defaults', () => {
        const messages = resolveSelectMessages()

        expect(messages).toEqual(selectMessageCatalog.de)
        expect(messages.required).toBe('Dieses Feld ist erforderlich')
        expect(messages.minSelection(2)).toBe('Mindestens 2 Optionen auswählen')
        expect(messages.searchOptions).toBe('Optionen suchen')
        expect(messages.searchPlaceholder).toBe('Suchen...')
        expect(messages.noResults).toBe('Keine Ergebnisse')
        expect(messages.noOptions).toBe('Keine Optionen')
    })

    test('provides complete English defaults', () => {
        const messages = resolveSelectMessages('en')

        expect(messages).toEqual(selectMessageCatalog.en)
        expect(messages.required).toBe('This field is required')
        expect(messages.minSelection(2)).toBe('Select at least 2 options')
        expect(messages.maxSelection(4)).toBe('Select at most 4 options')
        expect(messages.searchOptions).toBe('Search options')
        expect(messages.searchPlaceholder).toBe('Search...')
        expect(messages.noResults).toBe('No results')
        expect(messages.noOptions).toBe('No options')
    })

    test('merges partial overrides without losing locale defaults', () => {
        const messages = resolveSelectMessages('en', {
            searchPlaceholder: 'Find an option',
            minSelection: (count) => `Choose ${count} or more`,
        })

        expect(messages.searchPlaceholder).toBe('Find an option')
        expect(messages.minSelection(3)).toBe('Choose 3 or more')
        expect(messages.searchOptions).toBe('Search options')
        expect(messages.noResults).toBe('No results')
    })
})
