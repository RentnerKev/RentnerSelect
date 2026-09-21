import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
    CustomSelect,
    resolveSelectMessages,
    selectMessageCatalog,
} from '../index.js'

const options = [{ value: 'one', label: 'One' }]

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

    test('renders the shared field contract and external error', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomSelect, {
                id: 'department',
                name: 'department',
                value: '',
                onValueChange: () => undefined,
                options,
                required: true,
                label: 'Department',
                description: 'Choose one department',
                error: 'Department is required',
                'aria-label': 'Department select',
                'aria-labelledby': 'external-label department-label',
                'aria-describedby': 'external-help department-description',
                'aria-controls': 'department-options',
                'aria-keyshortcuts': 'Alt+ArrowDown',
            }),
        )

        expect(markup).toContain('id="department-label"')
        expect(markup).toContain('for="department"')
        expect(markup).toContain('id="department-description"')
        expect(markup).toContain('Department is required')
        expect(markup).toContain('aria-invalid="true"')
        expect(markup).toContain(
            'aria-describedby="external-help department-description department-error"',
        )
        expect(markup).toContain(
            'aria-labelledby="external-label department-label"',
        )
        expect(markup).toContain('aria-errormessage="department-error"')
        expect(markup).toContain('aria-label="Department select"')
        expect(markup).toContain('aria-controls="department-options"')
        expect(markup).toContain('aria-keyshortcuts="Alt+ArrowDown"')

        const requiredMarkup = renderToStaticMarkup(
            createElement(CustomSelect, {
                value: '',
                onValueChange: () => undefined,
                options,
                required: true,
            }),
        )

        expect(requiredMarkup).toContain('aria-required="true"')
    })

    test('error null clears required validation and generated error state', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomSelect, {
                value: '',
                onValueChange: () => undefined,
                options,
                required: true,
                error: null,
            }),
        )

        expect(markup).not.toContain('required=""')
        expect(markup).not.toContain('aria-required="true"')
        expect(markup).not.toContain('aria-invalid="true"')
        expect(markup).not.toContain('aria-errormessage=')
    })

    test('disables the hidden input and visible trigger', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomSelect, {
                value: '',
                onValueChange: () => undefined,
                options,
                required: true,
                disabled: true,
                readOnly: true,
                error: 'Server error',
            }),
        )

        expect(markup).toContain('disabled=""')
        expect(markup).toContain('aria-disabled="true"')
        expect(markup).toContain('aria-readonly="true"')
        expect(markup).toContain('aria-invalid="true"')
        expect(markup).toContain('aria-errormessage=')
        expect(markup).toContain('readOnly=""')
    })
})
