import { afterEach, expect, mock, test } from 'bun:test'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomSelect } from '../../../../shared/Select/Components/CustomSelect.tsx'
import type { Option } from '../../../../shared/Select/Types/select.types.ts'
import type {
    SelectLocale,
    SelectMessages,
} from '../../../../lib/Messages/Types/i18n.types.ts'
import { resolveSelectMessages } from '../../../../lib/Messages/i18n.ts'

afterEach(async () => {
    await act(async () => {
        await import('@rentnerkev/tooltips')
    })
    cleanup()
})
const options = [
    { value: 'alpha,west', label: 'Alpha, West' },
    { value: 'beta', label: 'Beta' },
    { value: 'locked', label: 'Locked', disabled: true },
]
function Harness(props: {
    enabled?: boolean
    disabled?: boolean
    readOnly?: boolean
    required?: boolean
    minSelection?: number
    initial?: Array<string>
    onChange?: (next: Array<string>) => void
    onClear?: () => void
    onBlur?: () => void
    renderValue?: (options: ReadonlyArray<Option<string>>) => ReactNode
    locale?: SelectLocale
    messages?: Partial<SelectMessages>
}) {
    const [value, setValue] = useState(props.initial ?? ['alpha,west', 'beta'])
    function handleChange(next: Array<string>) {
        props.onChange?.(next)
        setValue(next)
    }
    return (
        <form aria-label="Selected form">
            <CustomSelect
                multiple
                label="Selected"
                name="choice"
                value={value}
                onValueChange={handleChange}
                options={options}
                clearable
                onClear={props.onClear}
                removableSelectedItems={props.enabled}
                disabled={props.disabled}
                readOnly={props.readOnly}
                required={props.required}
                minSelection={props.minSelection}
                renderValue={props.renderValue}
                onBlur={props.onBlur}
                locale={props.locale ?? 'en'}
                messages={props.messages}
                searchable={false}
            />
            <button type="button">Outside</button>
        </form>
    )
}
function accessibleInstruction(button: HTMLElement) {
    return (button.getAttribute('aria-describedby') ?? '')
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent ?? '')
        .join(' ')
}
function formValues() {
    return new FormData(screen.getByRole('form') as HTMLFormElement).getAll(
        'choice',
    )
}

test('keeps removal opt-in and respects custom rendering and immutable controls', () => {
    const { rerender, container } = render(<Harness />)
    expect(screen.queryAllByRole('button', { name: /^Remove / })).toHaveLength(
        0,
    )
    expect(screen.getByRole('combobox').textContent).toContain(
        'Alpha, West, Beta',
    )
    rerender(<Harness enabled readOnly />)
    expect(screen.queryAllByRole('button', { name: /^Remove / })).toHaveLength(
        0,
    )
    rerender(<Harness enabled disabled />)
    expect(screen.queryAllByRole('button', { name: /^Remove / })).toHaveLength(
        0,
    )
    rerender(<Harness enabled renderValue={() => <span>Custom value</span>} />)
    expect(screen.queryAllByRole('button', { name: /^Remove / })).toHaveLength(
        0,
    )
    expect(screen.getByRole('combobox').textContent).toContain('Custom value')
    expect(container.querySelector('button button') === null).toBe(true)
})

test('removes a whole comma-containing value once, focuses before callback and leaves clear-all separate', async () => {
    const user = userEvent.setup()
    const clear = mock(() => undefined)
    const blur = mock(() => undefined)
    const focused: boolean[] = []
    const change = mock((_next: Array<string>) => {
        focused.push(
            document.activeElement?.getAttribute('role') === 'combobox',
        )
    })
    const { container } = render(
        <Harness enabled onClear={clear} onChange={change} onBlur={blur} />,
    )
    expect(formValues()).toEqual(['alpha,west', 'beta'])
    const remove = screen.getByRole('button', { name: 'Remove Alpha, West' })
    expect(remove.closest('[role="combobox"]') === null).toBe(true)
    await user.click(remove)
    expect(change).toHaveBeenCalledTimes(1)
    expect(change).toHaveBeenCalledWith(['beta'])
    expect(focused).toEqual([true])
    expect(clear).not.toHaveBeenCalled()
    expect(blur).not.toHaveBeenCalled()
    expect(formValues()).toEqual(['beta'])
    expect(document.activeElement?.getAttribute('role')).toBe('combobox')
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe(
        'false',
    )
    expect(container.querySelector('button button') === null).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(clear).toHaveBeenCalledTimes(1)
    expect(change).toHaveBeenCalledTimes(1)
})

test('only exposes selected editable items and hides removals while the popup is open', async () => {
    const user = userEvent.setup()
    render(<Harness enabled initial={['alpha,west', 'locked']} />)
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(1)
    expect(
        screen.queryByRole('button', { name: 'Remove Locked' }) === null,
    ).toBe(true)
    expect(screen.queryByRole('button', { name: 'Remove Beta' }) === null).toBe(
        true,
    )
    expect(screen.getByRole('combobox').textContent).toContain('Locked')
    await user.click(screen.getByRole('combobox'))
    expect(screen.queryAllByRole('button', { name: /^Remove / })).toHaveLength(
        0,
    )
    await user.keyboard('{Escape}')
    expect(screen.getAllByRole('button', { name: /^Remove / })).toHaveLength(1)
})

test('removing the last item updates form entries and required/minimum validation', async () => {
    const user = userEvent.setup()
    const { container } = render(
        <Harness enabled initial={['alpha,west']} required minSelection={2} />,
    )
    await user.click(screen.getByRole('button', { name: 'Remove Alpha, West' }))
    expect(formValues()).toEqual([''])
    expect(screen.queryAllByRole('button', { name: /^Remove / })).toHaveLength(
        0,
    )
    const validation = container.querySelector<HTMLInputElement>(
        'input[aria-hidden="true"]',
    )!
    fireEvent.invalid(validation)
    expect(screen.getByRole('combobox').getAttribute('aria-invalid')).toBe(
        'true',
    )
    expect(document.activeElement?.getAttribute('role')).toBe('combobox')
    expect(screen.getByText('This field is required').textContent).toBe(
        'This field is required',
    )
})

test('removes comparator-equal object values while preserving remaining controlled identities', async () => {
    const user = userEvent.setup()
    const first = { id: 1 }
    const second = { id: 2 }
    const change = mock((_value: Array<{ id: number }>) => undefined)
    render(
        <CustomSelect
            multiple
            label="Objects"
            name="object"
            value={[first, second]}
            onValueChange={change}
            options={[
                { value: { id: 1 }, label: 'One' },
                { value: { id: 2 }, label: 'Two' },
            ]}
            isOptionEqualToValue={(left, right) => left.id === right.id}
            getFormValue={(value) => String(value.id)}
            removableSelectedItems
            locale="en"
        />,
    )
    await user.click(screen.getByRole('button', { name: 'Remove One' }))
    expect(change).toHaveBeenCalledTimes(1)
    expect(change.mock.calls[0]?.[0]).toEqual([second])
    expect(change.mock.calls[0]?.[0]?.[0] === second).toBe(true)
})

for (const locale of ['de', 'en', 'es', 'fr'] as const) {
    test(`uses ${locale} removal labels and instructions`, () => {
        render(<Harness enabled locale={locale} />)
        const messages = resolveSelectMessages(locale)
        const button = screen.getByRole('button', {
            name: messages.removeSelectedItem?.('Alpha, West'),
        })
        expect(accessibleInstruction(button)).toBe(messages.clickToRemove!)
        expect(messages.clickToRemove!.length).toBeGreaterThan(0)
    })
}

test('honors removal message overrides without changing normal option names', () => {
    render(
        <Harness
            enabled
            messages={{
                clickToRemove: 'Remove this entry',
                removeSelectedItem: (label) => `Delete ${label}`,
            }}
        />,
    )
    expect(
        accessibleInstruction(
            screen.getByRole('button', { name: 'Delete Alpha, West' }),
        ),
    ).toBe('Remove this entry')
})
