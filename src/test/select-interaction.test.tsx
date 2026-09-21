import { afterEach, describe, expect, test } from 'bun:test'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomSelect } from '../index.js'

afterEach(() => {
    cleanup()
})

describe('select interactions', () => {
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
