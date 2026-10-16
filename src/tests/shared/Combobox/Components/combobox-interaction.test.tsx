import { afterEach, expect, mock, test } from 'bun:test'
import { createRef, useState } from 'react'
import { renderToString } from 'react-dom/server'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from '../../../../shared/Combobox/Components/Combobox.tsx'
import { SelectProvider } from '../../../../shared/Select/Components/SelectProvider.tsx'
import type { ComboboxProps } from '../../../../shared/Combobox/Types/combobox.types.ts'

afterEach(cleanup)
const options = [
    { id: 'a', name: 'Alpha' },
    { id: 'b', name: 'Blocked' },
    { id: 'c', name: 'Charlie' },
]
type Item = (typeof options)[number]
const base = {
    options,
    getOptionKey: (item: Item) => item.id,
    getOptionLabel: (item: Item) => item.name,
    isOptionDisabled: (item: Item) => item.id === 'b',
    label: 'Customer',
}
function Controlled(props: Partial<ComboboxProps<Item>>) {
    const [value, setValue] = useState<Item | null>(null)
    const [searchValue, setSearchValue] = useState('')
    return (
        <>
            <Combobox
                {...base}
                value={value}
                onValueChange={setValue}
                searchValue={searchValue}
                onSearchValueChange={setSearchValue}
                {...props}
            />
            <button type="button">Outside</button>
        </>
    )
}

test('keeps input focus, skips disabled options, and selects through active descendants', async () => {
    const user = userEvent.setup()
    const onValueChange = mock(() => undefined)
    const onSearchValueChange = mock(() => undefined)
    render(
        <Controlled
            onValueChange={onValueChange}
            onSearchValueChange={onSearchValueChange}
        />,
    )
    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    expect(input.getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: 'Alpha' }).id,
    )
    await user.keyboard('{ArrowDown}')
    expect(input.getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: 'Charlie' }).id,
    )
    expect(document.activeElement).toBe(input)
    await user.keyboard('{Home}{End}{Enter}')
    expect(onValueChange).toHaveBeenCalledWith(options[2])
    expect(onSearchValueChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(input)
})

test('leaves external results intact and never changes a selection when typing', async () => {
    const user = userEvent.setup()
    const change = mock(() => undefined)
    render(<Controlled value={options[0]!} onValueChange={change} />)
    await user.type(screen.getByRole('combobox'), 'unmatched remote query')
    expect(screen.getAllByRole('option')).toHaveLength(3)
    expect(change).not.toHaveBeenCalled()
    expect(
        screen
            .getByRole('option', { name: 'Alpha' })
            .getAttribute('aria-selected'),
    ).toBe('true')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('combobox').getAttribute('aria-expanded')).toBe(
        'false',
    )
})

test('supports opt-in local filtering and localized loading and empty states', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Controlled filterMode="local" locale="en" />)
    await user.type(screen.getByRole('combobox'), 'missing')
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByRole('status').textContent).toBe('No results')
    rerender(<Controlled loading locale="en" />)
    expect(screen.getByRole('status').textContent).toBe('Loading…')
    expect(screen.getByRole('listbox').getAttribute('aria-busy')).toBe('true')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(
        screen.getByRole('combobox').hasAttribute('aria-activedescendant'),
    ).toBe(false)
})

test('clears both independent channels and returns focus without field blur', async () => {
    const user = userEvent.setup()
    const change = mock(() => undefined)
    const search = mock(() => undefined)
    const blur = mock(() => undefined)
    render(
        <Controlled
            value={options[0]!}
            searchValue="Alpha"
            clearable
            onValueChange={change}
            onSearchValueChange={search}
            onBlur={blur}
        />,
    )
    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.click(screen.getByRole('button', { name: 'Auswahl löschen' }))
    expect(change).toHaveBeenCalledWith(null)
    expect(search).toHaveBeenCalledWith('')
    expect(document.activeElement).toBe(input)
    expect(blur).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(blur).toHaveBeenCalledTimes(1)
})

test('uses provider portal defaults, replaceable slots and input refs', async () => {
    const user = userEvent.setup()
    const portal = document.createElement('div')
    document.body.append(portal)
    const ref = createRef<HTMLInputElement>()
    const { unmount } = render(
        <SelectProvider
            controlSize="sm"
            portalContainer={portal}
            portalClassName="project-portal"
            portalZIndex={123}
            classNames={{
                search: 'project-control',
                optionLabel: 'project-label',
            }}
        >
            <Controlled inputRef={ref} />
        </SelectProvider>,
    )
    const input = screen.getByRole('combobox')
    expect(ref.current).toBe(input)
    expect(input.className).toContain('h-rentner-control-sm')
    expect(input.className).not.toContain('bg-select-control')
    await user.click(input)
    expect(portal.querySelector('.project-portal')).toBeTruthy()
    expect(
        portal.querySelector('[role="listbox"]')?.parentElement?.style.zIndex,
    ).toBe('123')
    expect(portal.querySelector('.project-label')).toBeTruthy()
    unmount()
    expect(ref.current).toBeNull()
    portal.remove()
})

test('reconciles replaced external options without stale active descendants', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Controlled />)
    const input = screen.getByRole('combobox')
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    rerender(<Controlled options={[options[2]!]} />)
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    await user.keyboard('{ArrowDown}')
    expect(input.getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option').id,
    )
})

test.each(['disabled', 'readOnly'] as const)(
    'blocks changes while %s',
    async (flag) => {
        const user = userEvent.setup()
        const change = mock(() => undefined)
        render(
            <Controlled
                {...{ [flag]: true }}
                onValueChange={change}
                clearable
                value={options[0]!}
            />,
        )
        const input = screen.getByRole('combobox')
        fireEvent.focus(input)
        fireEvent.change(input, { target: { value: 'other' } })
        await user.keyboard('{ArrowDown}{Enter}')
        expect(screen.queryByRole('listbox')).toBeNull()
        expect(change).not.toHaveBeenCalled()
        expect(
            screen.queryByRole('button', { name: 'Auswahl löschen' }),
        ).toBeNull()
    },
)

test('connects field semantics, form serialization, validation and external errors', async () => {
    const user = userEvent.setup()
    const { container, rerender } = render(
        <form>
            <Controlled
                name="customer"
                value={options[0]!}
                description="Remote results"
                error="Unavailable"
                required
            />
        </form>,
    )
    const input = screen.getByLabelText('Customer')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-required')).toBe('true')
    const ids = input.getAttribute('aria-describedby')!.split(' ')
    expect(ids.map((id) => document.getElementById(id)?.textContent)).toEqual([
        'Remote results',
        'Unavailable',
    ])
    expect(new FormData(container.querySelector('form')!).get('customer')).toBe(
        'a',
    )
    rerender(<Controlled required />)
    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(screen.getByText('Dieses Feld ist erforderlich')).toBeTruthy()
})

test('closes permanently across disabled transitions and clears external native validity', async () => {
    const user = userEvent.setup()
    const { container, rerender } = render(
        <Controlled required error="Server error" />,
    )
    const validation = container.querySelector<HTMLInputElement>(
        'input[aria-hidden="true"]',
    )!
    expect(validation.validationMessage).toBe('Server error')
    await user.click(screen.getByRole('combobox'))
    rerender(<Controlled disabled required error="Server error" />)
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(validation.validationMessage).toBe('')
    rerender(<Controlled required error={null} />)
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(validation.validationMessage).toBe('')
    expect(validation.required).toBe(false)
})

test('preserves cleanup-returning input refs across renders and unmount', () => {
    const events: string[] = []
    const inputRef = (node: HTMLInputElement | null) => {
        events.push(node ? 'attached' : 'null')
        if (node)
            return () => {
                events.push('cleanup')
            }
    }
    const { rerender, unmount } = render(<Controlled inputRef={inputRef} />)
    rerender(<Controlled inputRef={inputRef} description="Updated" />)
    expect(events).toEqual(['attached'])
    unmount()
    expect(events).toEqual(['attached', 'cleanup'])
})

test('redirects native invalid focus to the editable input', () => {
    const { container } = render(<Controlled required />)
    const validation = container.querySelector<HTMLInputElement>(
        'input[aria-hidden="true"]',
    )!
    expect(fireEvent.invalid(validation)).toBe(false)
    expect(document.activeElement).toBe(screen.getByRole('combobox'))
    expect(screen.getByRole('combobox').getAttribute('aria-invalid')).toBe(
        'true',
    )
})

test('keeps shadow-root portal pointer events inside the field boundary', () => {
    const host = document.createElement('div')
    document.body.append(host)
    const portal = host.attachShadow({ mode: 'open' })
    const change = mock(() => undefined)
    const { unmount } = render(
        <Controlled portalContainer={portal} onValueChange={change} />,
    )
    fireEvent.focus(screen.getByRole('combobox'))
    const option = portal.querySelector<HTMLElement>('[role="option"]')!
    fireEvent(
        option,
        new PointerEvent('pointerdown', { bubbles: true, composed: true }),
    )
    expect(portal.querySelector('[role="listbox"]')).toBeTruthy()
    fireEvent.click(option)
    expect(change).toHaveBeenCalledWith(options[0])
    unmount()
    host.remove()
})

test.each([false, true, '', null, undefined])(
    'keeps the explicit accessible name without a rendered label %s',
    (label) => {
        const { container } = render(
            <Controlled label={label} aria-label="Customer" />,
        )
        expect(screen.getByRole('combobox', { name: 'Customer' })).toBeTruthy()
        expect(container.querySelector('label')).toBeNull()
        expect(
            screen.getByRole('combobox').hasAttribute('aria-labelledby'),
        ).toBe(false)
        const html = renderToString(
            <Controlled label={label} aria-label="Customer" />,
        )
        expect(html).not.toContain('<label')
        expect(html).not.toContain('aria-labelledby=')
        expect(html).toContain('aria-label="Customer"')
    },
)

test('retains zero as a visible, associated accessible label in SSR and the DOM', () => {
    const { container } = render(<Controlled label={0} aria-label="Fallback" />)
    const input = screen.getByRole('combobox', { name: '0' })
    const label = container.querySelector('label')!
    expect(label.textContent).toBe('0')
    expect(input.getAttribute('aria-labelledby')).toBe(label.id)
    const html = renderToString(<Controlled label={0} aria-label="Fallback" />)
    expect(html).toContain('>0</label>')
    expect(html).toContain('aria-labelledby=')
})
