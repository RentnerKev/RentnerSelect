import { afterEach, expect, mock, test } from 'bun:test'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomSelect } from '../../../../shared/Select/Components/CustomSelect.tsx'
import { SelectProvider } from '../../../../shared/Select/Components/SelectProvider.tsx'

const options = Array.from({ length: 250 }, (_, index) => ({
    value: String(index),
    label: 'Item ' + index,
}))
const descriptors = new Map(
    ['offsetHeight', 'clientHeight', 'clientWidth'].map((name) => [
        name,
        Object.getOwnPropertyDescriptor(HTMLElement.prototype, name),
    ]),
)
afterEach(() => {
    cleanup()
    for (const [name, descriptor] of descriptors)
        if (descriptor)
            Object.defineProperty(HTMLElement.prototype, name, descriptor)
})
function prepareMeasurements() {
    for (const [name, value] of [
        ['offsetHeight', 44],
        ['clientHeight', 256],
        ['clientWidth', 320],
    ] as const)
        Object.defineProperty(HTMLElement.prototype, name, {
            configurable: true,
            get: () => value,
        })
}

test('uses the supplied option count for automatic select virtualization and keeps keyboard selection working', async () => {
    prepareMeasurements()
    const user = userEvent.setup()
    const change = mock(() => undefined)
    const base = {
        value: '',
        onValueChange: change,
        label: 'Auto choices',
        searchable: false,
    }
    const { rerender } = render(
        <CustomSelect {...base} options={options.slice(0, 249)} />,
    )
    await user.click(screen.getByRole('combobox'))
    expect(screen.getAllByRole('option')).toHaveLength(249)
    await user.keyboard('{Escape}')
    rerender(<CustomSelect {...base} options={options} />)
    await user.click(screen.getByRole('combobox'))
    await waitFor(() =>
        expect(
            screen
                .getByRole('option', { name: 'Item 0' })
                .getAttribute('aria-setsize'),
        ).toBe('250'),
    )
    expect(screen.getAllByRole('option').length).toBeLessThan(30)
    await user.keyboard('{End}{Enter}')
    expect(change).toHaveBeenCalledWith('249')
})

test('inherits a forced provider and allows a local auto override or custom virtual settings', async () => {
    prepareMeasurements()
    const user = userEvent.setup()
    const base = {
        value: '',
        onValueChange: () => undefined,
        label: 'Auto choices',
        options,
        searchable: false,
    }
    const { rerender } = render(
        <SelectProvider virtualized={false}>
            <SelectProvider>
                <CustomSelect {...base} virtualized="auto" />
            </SelectProvider>
        </SelectProvider>,
    )
    await user.click(screen.getByRole('combobox'))
    await waitFor(() =>
        expect(
            screen
                .getByRole('option', { name: 'Item 0' })
                .getAttribute('aria-setsize'),
        ).toBe('250'),
    )
    expect(screen.getAllByRole('option').length).toBeLessThan(30)
    rerender(
        <SelectProvider virtualized={false}>
            <SelectProvider>
                <CustomSelect {...base} />
            </SelectProvider>
        </SelectProvider>,
    )
    expect(screen.getAllByRole('option')).toHaveLength(250)
    rerender(
        <SelectProvider virtualized={false}>
            <SelectProvider>
                <CustomSelect
                    {...base}
                    options={options.slice(0, 10)}
                    virtualized={{ overscan: 2 }}
                />
            </SelectProvider>
        </SelectProvider>,
    )
    await waitFor(() =>
        expect(
            screen
                .getByRole('option', { name: 'Item 0' })
                .getAttribute('aria-setsize'),
        ).toBe('10'),
    )
})

test('keeps automatic select virtualization active while local search narrows a large list', async () => {
    prepareMeasurements()
    const user = userEvent.setup()
    render(
        <CustomSelect
            label="Auto choices"
            options={options}
            value=""
            onValueChange={() => undefined}
        />,
    )
    await user.click(screen.getByRole('combobox'))
    const search = screen.getByRole('textbox')
    fireEvent.change(search, { target: { value: 'Item 249' } })
    await waitFor(() =>
        expect(
            screen
                .getByRole('option', { name: 'Item 249' })
                .getAttribute('aria-setsize'),
        ).toBe('1'),
    )
    expect(search).toBe(document.activeElement)
})
