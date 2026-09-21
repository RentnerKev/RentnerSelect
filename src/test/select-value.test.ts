import { describe, expect, test } from 'bun:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { CustomSelect } from '../index.js'
import {
    isSingleValueEmpty,
    parseLegacyMultipleValue,
    toggleSelectedValue,
} from '../selectValue.js'

describe('generic select values', () => {
    test('keeps comma-containing values intact in array mode', () => {
        const selectedValues = ['north,west']
        const nextValues = toggleSelectedValue(
            selectedValues,
            'south',
            Object.is,
        )

        expect(nextValues).toEqual(['north,west', 'south'])
        expect(selectedValues).toEqual(['north,west'])
    })

    test('removes values without string coercion and respects the maximum', () => {
        expect(toggleSelectedValue([1, '1'], 1, Object.is)).toEqual(['1'])
        expect(toggleSelectedValue([1], 2, Object.is, 1)).toBeNull()
    })

    test('preserves the deprecated CSV parser for simple legacy values', () => {
        expect(parseLegacyMultipleValue('one,two')).toEqual(['one', 'two'])
        expect(parseLegacyMultipleValue('')).toEqual([])
    })

    test('treats only empty single values as empty', () => {
        expect(isSingleValueEmpty(null)).toBe(true)
        expect(isSingleValueEmpty(undefined)).toBe(true)
        expect(isSingleValueEmpty('')).toBe(true)
        expect(isSingleValueEmpty(0)).toBe(false)
        expect(isSingleValueEmpty(false)).toBe(false)
    })

    test('renders generic falsy values as selected', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomSelect<number>, {
                name: 'priority',
                value: 0,
                onValueChange: () => undefined,
                options: [{ value: 0, label: 'Zero priority' }],
            }),
        )

        expect(markup).toContain('Zero priority')
        expect(markup).toContain('name="priority"')
        expect(markup).toContain('value="0"')
    })

    test('does not conflate values with the same string representation', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomSelect<string | number>, {
                value: '1',
                onValueChange: () => undefined,
                options: [
                    { value: 1, label: 'Numeric value' },
                    { value: '1', label: 'String value' },
                ],
            }),
        )

        expect(markup).toContain('String value')
        expect(markup).not.toContain('Numeric value')
    })

    test('supports custom equality and form serialization for objects', () => {
        type Customer = { id: number }

        const markup = renderToStaticMarkup(
            createElement(CustomSelect<Customer>, {
                name: 'customer',
                value: { id: 2 },
                onValueChange: () => undefined,
                options: [
                    { value: { id: 1 }, label: 'Customer one' },
                    { value: { id: 2 }, label: 'Customer two' },
                ],
                isOptionEqualToValue: (option, value) => option.id === value.id,
                getFormValue: (value) => String(value.id),
            }),
        )

        expect(markup).toContain('Customer two')
        expect(markup).toContain('name="customer"')
        expect(markup).toContain('value="2"')
    })

    test('submits modern multiple values as repeated form fields', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomSelect<string>, {
                name: 'regions',
                multiple: true,
                value: ['north,west', 'south'],
                onValueChange: () => undefined,
                options: [
                    { value: 'north,west', label: 'North-West' },
                    { value: 'south', label: 'South' },
                ],
            }),
        )

        expect(markup.match(/name="regions"/g)).toHaveLength(2)
        expect(markup).toContain('value="north,west"')
        expect(markup).toContain('value="south"')
        expect(markup).toContain('North-West, South')
    })

    test('keeps legacy multiple form output backward compatible', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomSelect, {
                name: 'legacy-regions',
                multiple: true,
                value: 'north,south',
                onValueChange: () => undefined,
                options: [
                    { value: 'north', label: 'North' },
                    { value: 'south', label: 'South' },
                ],
            }),
        )

        expect(markup.match(/name="legacy-regions"/g)).toHaveLength(1)
        expect(markup).toContain('value="north,south"')
        expect(markup).toContain('North, South')
    })

    test('normalizes invalid modern multiple input defensively', () => {
        const markup = renderToStaticMarkup(
            createElement(CustomSelect<string>, {
                name: 'regions',
                multiple: true,
                value: null as unknown as Array<string>,
                onValueChange: () => undefined,
                options: [{ value: 'north', label: 'North' }],
                placeholder: 'Choose regions',
            }),
        )

        expect(markup).toContain('name="regions"')
        expect(markup).toContain('value=""')
        expect(markup).toContain('Choose regions')
    })
})
