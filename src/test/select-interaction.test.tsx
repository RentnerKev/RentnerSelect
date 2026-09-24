import { afterEach, describe, expect, mock, test } from 'bun:test'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomSelect } from '../index.js'

afterEach(() => {
    cleanup()
})

function ClearableSingleHarness() {
    const [value, setValue] = useState<string | null>('north')
    return (
        <form aria-label="filter form">
            <CustomSelect
                name="region"
                value={value}
                onValueChange={setValue}
                clearable
                options={[{ value: 'north', label: 'North' }]}
            />
        </form>
    )
}

function ClearableMultipleHarness({ readOnly = false, disabled = false }) {
    const [value, setValue] = useState(['north', 'south'])
    return (
        <CustomSelect
            multiple
            value={value}
            onValueChange={setValue}
            clearable
            options={[
                { value: 'north', label: 'North' },
                { value: 'south', label: 'South' },
            ]}
            readOnly={readOnly}
            disabled={disabled}
        />
    )
}

describe('select interactions', () => {
    test('clears a single selection with an accessible button and native form value', async () => {
        const user = userEvent.setup()
        render(<ClearableSingleHarness />)
        const clearButton = screen.getByRole('button', {
            name: 'Auswahl löschen',
        })
        expect(
            new FormData(screen.getByRole('form') as HTMLFormElement).get(
                'region',
            ),
        ).toBe('north')
        clearButton.focus()
        await user.keyboard('{Enter}')

        expect(
            screen.queryByRole('button', { name: 'Auswahl löschen' }),
        ).toBeNull()
        expect(
            new FormData(screen.getByRole('form') as HTMLFormElement).get(
                'region',
            ),
        ).toBe('')
        expect(document.activeElement).toBe(screen.getByRole('combobox'))
    })

    test('keeps the legacy onClear callback semantics', async () => {
        const user = userEvent.setup()
        const onValueChange = mock((_value: string) => undefined)
        const onClear = mock(() => undefined)

        render(
            <CustomSelect
                value="north"
                onValueChange={onValueChange}
                clearable
                onClear={onClear}
                options={[{ value: 'north', label: 'North' }]}
            />,
        )

        await user.click(
            screen.getByRole('button', { name: 'Auswahl löschen' }),
        )

        expect(onClear).toHaveBeenCalledTimes(1)
        expect(onValueChange).not.toHaveBeenCalled()
    })

    test('clears a string field to its configured empty value', async () => {
        const user = userEvent.setup()
        const changes: Array<string> = []

        function Harness() {
            const [value, setValue] = useState('north')

            return (
                <form aria-label="string field form">
                    <CustomSelect
                        name="region"
                        value={value}
                        onValueChange={(nextValue) => {
                            changes.push(nextValue)
                            setValue(nextValue)
                        }}
                        clearable
                        emptyValue=""
                        options={[{ value: 'north', label: 'North' }]}
                    />
                </form>
            )
        }

        render(<Harness />)
        await user.click(
            screen.getByRole('button', { name: 'Auswahl löschen' }),
        )

        expect(changes).toEqual([''])
        expect(
            new FormData(screen.getByRole('form') as HTMLFormElement).get(
                'region',
            ),
        ).toBe('')
        expect(
            screen.queryByRole('button', { name: 'Auswahl löschen' }),
        ).toBeNull()
    })

    test('reports blur after leaving the whole select field', async () => {
        const user = userEvent.setup()
        const onBlur = mock(() => undefined)

        render(
            <>
                <CustomSelect
                    value="north"
                    onValueChange={() => undefined}
                    onBlur={onBlur}
                    options={[{ value: 'north', label: 'North' }]}
                />
                <button type="button">Outside</button>
            </>,
        )

        const trigger = screen.getByRole('combobox')
        await user.click(trigger)
        const search = await screen.findByRole('textbox', {
            name: 'Optionen suchen',
        })
        expect(document.activeElement).toBe(search)
        expect(onBlur).not.toHaveBeenCalled()

        await user.keyboard('{Escape}')
        expect(document.activeElement).toBe(trigger)
        expect(onBlur).not.toHaveBeenCalled()

        await user.tab()
        expect(document.activeElement).toBe(
            screen.getByRole('button', { name: 'Outside' }),
        )
        expect(onBlur).toHaveBeenCalledTimes(1)
    })

    test('keeps focus inside the field when selecting a portaled option', async () => {
        const user = userEvent.setup()
        const onBlur = mock(() => undefined)

        render(
            <CustomSelect
                value=""
                onValueChange={() => undefined}
                onBlur={onBlur}
                options={[{ value: 'north', label: 'North' }]}
            />,
        )

        await user.click(screen.getByRole('combobox'))
        await user.click(await screen.findByRole('option', { name: 'North' }))

        expect(document.activeElement).toBe(screen.getByRole('combobox'))
        expect(onBlur).not.toHaveBeenCalled()
    })

    test('clears multiple values and hides the clear control when read-only or disabled', async () => {
        const user = userEvent.setup()
        const { rerender } = render(<ClearableMultipleHarness readOnly />)
        expect(
            screen.queryByRole('button', { name: 'Auswahl löschen' }),
        ).toBeNull()
        rerender(<ClearableMultipleHarness disabled />)
        expect(
            screen.queryByRole('button', { name: 'Auswahl löschen' }),
        ).toBeNull()
        rerender(<ClearableMultipleHarness />)
        await user.click(
            screen.getByRole('button', { name: 'Auswahl löschen' }),
        )
        expect(
            screen.queryByRole('button', { name: 'Auswahl löschen' }),
        ).toBeNull()
        expect(screen.getByRole('combobox').textContent).not.toContain('North')
    })

    test('adds and removes comma-containing values as complete array entries', async () => {
        const changes: Array<Array<string>> = []

        function Harness() {
            const [value, setValue] = useState<Array<string>>([])

            return (
                <>
                    <CustomSelect
                        multiple
                        value={value}
                        onValueChange={(nextValue) => {
                            changes.push(nextValue)
                            setValue(nextValue)
                        }}
                        options={[
                            { value: 'north,west', label: 'North-West' },
                            { value: 'south', label: 'South' },
                        ]}
                    />
                    <output>{JSON.stringify(value)}</output>
                </>
            )
        }

        const user = userEvent.setup()
        render(<Harness />)

        await user.click(screen.getByRole('combobox'))
        await user.click(
            await screen.findByRole('option', { name: 'North-West' }),
        )

        expect(changes).toEqual([['north,west']])
        expect(screen.getByText('["north,west"]')).toBeTruthy()

        await user.click(screen.getByRole('option', { name: 'North-West' }))

        expect(changes).toEqual([['north,west'], []])
        expect(screen.getByText('[]')).toBeTruthy()
    })

    test('uses repeated form entries and respects disabled and read-only state', () => {
        const { rerender } = render(
            <form aria-label="region form">
                <CustomSelect
                    name="regions"
                    multiple
                    value={['north,west', 'south']}
                    onValueChange={() => undefined}
                    options={[
                        { value: 'north,west', label: 'North-West' },
                        { value: 'south', label: 'South' },
                    ]}
                />
            </form>,
        )

        const form = screen.getByRole('form') as HTMLFormElement
        expect(new FormData(form).getAll('regions')).toEqual([
            'north,west',
            'south',
        ])

        rerender(
            <form aria-label="region form">
                <CustomSelect
                    name="regions"
                    multiple
                    value={['north,west', 'south']}
                    onValueChange={() => undefined}
                    options={[
                        { value: 'north,west', label: 'North-West' },
                        { value: 'south', label: 'South' },
                    ]}
                    disabled
                />
            </form>,
        )

        expect(new FormData(form).getAll('regions')).toEqual([])

        rerender(
            <form aria-label="region form">
                <CustomSelect
                    name="regions"
                    multiple
                    value={['north,west', 'south']}
                    onValueChange={() => undefined}
                    options={[
                        { value: 'north,west', label: 'North-West' },
                        { value: 'south', label: 'South' },
                    ]}
                    readOnly
                />
            </form>,
        )

        expect(new FormData(form).getAll('regions')).toEqual([
            'north,west',
            'south',
        ])
    })

    test('can omit an empty multiple value without changing the default', () => {
        const options = [{ value: 'north', label: 'North' }]
        const { rerender } = render(
            <form aria-label="region form">
                <CustomSelect
                    name="regions"
                    multiple
                    value={[]}
                    onValueChange={() => undefined}
                    options={options}
                />
            </form>,
        )
        const form = screen.getByRole('form') as HTMLFormElement
        expect(new FormData(form).getAll('regions')).toEqual([''])

        rerender(
            <form aria-label="region form">
                <CustomSelect
                    name="regions"
                    multiple
                    value={[]}
                    onValueChange={() => undefined}
                    options={options}
                    omitEmptyFormValue
                    required
                />
            </form>,
        )
        expect(new FormData(form).getAll('regions')).toEqual([])
        expect(
            form.querySelector('input[required]')?.validity.valueMissing,
        ).toBe(true)

        rerender(
            <form aria-label="region form">
                <CustomSelect
                    name="regions"
                    multiple
                    value={['north']}
                    onValueChange={() => undefined}
                    options={options}
                    omitEmptyFormValue
                    required
                />
            </form>,
        )
        expect(new FormData(form).getAll('regions')).toEqual(['north'])
        expect(form.querySelector('input[required]')).toBeNull()
    })

    test('focuses the trigger when required validation fails', () => {
        render(
            <CustomSelect
                value=""
                onValueChange={() => undefined}
                options={[{ value: 'north', label: 'North' }]}
                required
            />,
        )

        const validationInput = document.querySelector(
            'input[aria-hidden="true"]',
        ) as HTMLInputElement
        const trigger = screen.getByRole('combobox')

        fireEvent.invalid(validationInput)

        expect(document.activeElement).toBe(trigger)
    })
})
