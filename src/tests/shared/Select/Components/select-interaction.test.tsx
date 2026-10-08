import { afterEach, describe, expect, mock, test } from 'bun:test'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomSelect } from '../../../../shared/Select/Components/CustomSelect.tsx'

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

function MaxSelectionHarness() {
    const [value, setValue] = useState<Array<string>>(['north', 'south'])

    return (
        <>
            <CustomSelect
                multiple
                value={value}
                onValueChange={setValue}
                maxSelection={2}
                searchable={false}
                options={[
                    { value: 'north', label: 'North' },
                    { value: 'south', label: 'South' },
                    { value: 'west', label: 'West' },
                ]}
                renderOption={(option, state) =>
                    `${option.label}${state.disabled ? ' unavailable' : ''}`
                }
            />
            <output>{JSON.stringify(value)}</output>
        </>
    )
}

function MultipleSelectionHarness() {
    const [value, setValue] = useState<Array<string>>([])

    return (
        <>
            <CustomSelect
                multiple
                value={value}
                onValueChange={setValue}
                options={[
                    { value: 'north', label: 'North' },
                    { value: 'south', label: 'South' },
                ]}
            />
            <output>{JSON.stringify(value)}</output>
        </>
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

    test('keeps the same option focused when dynamic options reorder', async () => {
        const user = userEvent.setup()
        const north = { value: 'north', label: 'North' }
        const south = { value: 'south', label: 'South' }
        const { rerender } = render(
            <CustomSelect
                value=""
                onValueChange={() => undefined}
                options={[north, south]}
            />,
        )

        await user.click(screen.getByRole('combobox'))
        await screen.findByRole('textbox', {
            name: 'Optionen suchen',
        })
        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowDown}')
        const focusedSouth = screen.getByRole('option', { name: 'South' })
        expect(document.activeElement === focusedSouth).toBe(true)

        rerender(
            <CustomSelect
                value=""
                onValueChange={() => undefined}
                options={[south, north]}
            />,
        )

        expect(
            document.activeElement ===
                screen.getByRole('option', { name: 'South' }),
        ).toBe(true)
    })

    test('returns focus to search when the focused dynamic option is removed', async () => {
        const user = userEvent.setup()
        const north = { value: 'north', label: 'North' }
        const south = { value: 'south', label: 'South' }
        const { rerender } = render(
            <CustomSelect
                value=""
                onValueChange={() => undefined}
                options={[north, south]}
            />,
        )

        await user.click(screen.getByRole('combobox'))
        const search = await screen.findByRole('textbox', {
            name: 'Optionen suchen',
        })
        await user.keyboard('{ArrowDown}')
        await user.keyboard('{ArrowDown}')
        expect(
            document.activeElement ===
                screen.getByRole('option', { name: 'South' }),
        ).toBe(true)

        rerender(
            <CustomSelect
                value=""
                onValueChange={() => undefined}
                options={[north]}
            />,
        )

        expect(document.activeElement === search).toBe(true)
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

    test('disables unselected options at the maximum and keeps selected options removable', async () => {
        const user = userEvent.setup()
        render(<MaxSelectionHarness />)
        await user.click(screen.getByRole('combobox'))

        const north = screen.getByRole('option', { name: 'North' })
        const west = screen.getByRole('option', { name: /West/ })
        expect(north.getAttribute('aria-disabled')).not.toBe('true')
        expect(west.getAttribute('aria-disabled')).toBe('true')
        expect(west.className).toContain('data-disabled:opacity-40')
        expect(screen.getByText('West unavailable')).toBeTruthy()

        await user.click(north)

        expect(screen.getByText('["south"]')).toBeTruthy()
        expect(west.getAttribute('aria-disabled')).toBeNull()
    })

    test('keeps multiple selection ARIA state in sync and toggles with Space', async () => {
        const user = userEvent.setup()
        render(<MultipleSelectionHarness />)
        await user.click(screen.getByRole('combobox'))

        const search = screen.getByRole('textbox', {
            name: 'Optionen suchen',
        })
        await user.click(search)
        await user.keyboard('{ArrowDown}')

        const north = screen.getByRole('option', { name: 'North' })
        expect(document.activeElement).toBe(north)
        expect(north.getAttribute('aria-selected')).toBe('false')
        expect(north.getAttribute('data-state')).toBe('unchecked')

        await user.keyboard(' ')

        expect(screen.getByText('["north"]')).toBeTruthy()
        expect(north.getAttribute('aria-selected')).toBe('true')
        expect(north.getAttribute('data-state')).toBe('checked')

        await user.keyboard(' ')

        expect(screen.getByText('[]')).toBeTruthy()
        expect(north.getAttribute('aria-selected')).toBe('false')
        expect(north.getAttribute('data-state')).toBe('unchecked')
    })

    test('keeps a selected disabled option pinned until its value changes externally', async () => {
        const user = userEvent.setup()
        const onValueChange = mock(() => undefined)

        render(
            <form aria-label="region form">
                <CustomSelect
                    name="regions"
                    multiple
                    value={['north']}
                    onValueChange={onValueChange}
                    searchable={false}
                    options={[
                        { value: 'north', label: 'North', disabled: true },
                        { value: 'south', label: 'South' },
                    ]}
                />
            </form>,
        )

        const form = document.querySelector(
            'form[aria-label="region form"]',
        ) as HTMLFormElement
        await user.click(screen.getByRole('combobox'))

        const north = screen.getByRole('option', { name: 'North' })
        expect(north.getAttribute('aria-disabled')).toBe('true')
        expect(north.getAttribute('aria-selected')).toBe('true')
        expect(north.getAttribute('data-state')).toBe('checked')

        await user.click(north)

        expect(onValueChange).not.toHaveBeenCalled()
        expect(new FormData(form).getAll('regions')).toEqual(['north'])
    })

    test('treats controlled values missing from options as unselected', () => {
        const { rerender } = render(
            <form aria-label="region form">
                <CustomSelect
                    name="region"
                    value="retired"
                    onValueChange={() => undefined}
                    options={[{ value: 'north', label: 'North' }]}
                    placeholder="Choose a region"
                    required
                />
            </form>,
        )

        const form = screen.getByRole('form') as HTMLFormElement
        const trigger = screen.getByRole('combobox')
        expect(trigger.textContent).toContain('Choose a region')
        expect(trigger.textContent).not.toContain('Retired')
        expect(new FormData(form).get('region')).toBe('')
        expect(
            form.querySelector('input[required]')?.validity.valueMissing,
        ).toBe(true)

        rerender(
            <form aria-label="region form">
                <CustomSelect
                    name="regions"
                    multiple
                    value={['north', 'retired']}
                    onValueChange={() => undefined}
                    options={[
                        { value: 'north', label: 'North' },
                        { value: 'south', label: 'South' },
                    ]}
                    required
                />
            </form>,
        )

        expect(screen.getByRole('combobox').textContent).toContain('North')
        expect(screen.getByRole('combobox').textContent).not.toContain(
            'Retired',
        )
        expect(new FormData(form).getAll('regions')).toEqual(['north'])
        expect(form.querySelector('input[required]')).toBeNull()

        rerender(
            <form aria-label="region form">
                <CustomSelect
                    name="regions"
                    multiple
                    value={['retired']}
                    onValueChange={() => undefined}
                    options={[
                        { value: 'north', label: 'North' },
                        { value: 'south', label: 'South' },
                    ]}
                    placeholder="Choose regions"
                    omitEmptyFormValue
                    required
                />
            </form>,
        )

        expect(screen.getByRole('combobox').textContent).toContain(
            'Choose regions',
        )
        expect(new FormData(form).getAll('regions')).toEqual([])
        expect(
            form.querySelector('input[required]')?.validity.valueMissing,
        ).toBe(true)
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
