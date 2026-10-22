import { afterEach, expect, mock, test } from 'bun:test'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { Combobox } from '../../../../shared/Combobox/Components/Combobox.tsx'
import { SelectProvider } from '../../../../shared/Select/Components/SelectProvider.tsx'

const items = Array.from({ length: 1000 }, (_, index) => ({
    id: String(index),
    name: `Item ${index}`,
}))
const base = {
    options: items,
    value: null,
    searchValue: '',
    onValueChange: mock(() => undefined),
    onSearchValueChange: mock(() => undefined),
    getOptionKey: (item: (typeof items)[number]) => item.id,
    getOptionLabel: (item: (typeof items)[number]) => item.name,
    label: 'Virtual customers',
    virtualized: true,
}
const rowHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight',
)
const height = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientHeight',
)
const width = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientWidth',
)
afterEach(() => {
    cleanup()
    if (rowHeight)
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', rowHeight)
    if (height)
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', height)
    if (width)
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', width)
})
function prepareMeasurements() {
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get() {
            return 44
        },
    })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
        configurable: true,
        get() {
            return this.getAttribute('role') === 'option' ? 44 : 256
        },
    })
    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
        configurable: true,
        get() {
            return 320
        },
    })
}

test('virtualizes 1000 options and mounts distant active descendants with their logical positions', async () => {
    prepareMeasurements()
    const change = mock(() => undefined)
    render(
        <Combobox
            {...base}
            onValueChange={change}
            isOptionDisabled={(item) => item.id === '999'}
        />,
    )
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    await waitFor(() =>
        expect(screen.getAllByRole('option').length).toBeGreaterThan(0),
    )
    expect(screen.getAllByRole('option').length).toBeLessThan(30)
    fireEvent.keyDown(input, { key: 'End' })
    await waitFor(() =>
        expect(screen.getByRole('option', { name: 'Item 998' }).id).toBe(
            input.getAttribute('aria-activedescendant'),
        ),
    )
    expect(
        screen
            .getByRole('option', { name: 'Item 998' })
            .getAttribute('aria-posinset'),
    ).toBe('999')
    expect(
        screen
            .getByRole('option', { name: 'Item 998' })
            .getAttribute('aria-setsize'),
    ).toBe('1000')
    expect(screen.getAllByRole('option').length).toBeLessThan(30)
    fireEvent.keyDown(input, { key: 'Home' })
    expect(screen.getByRole('option', { name: 'Item 0' }).id).toBe(
        input.getAttribute('aria-activedescendant'),
    )
    fireEvent.keyDown(input, { key: 'End' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(change).toHaveBeenCalledWith(items[998])
})

test('reconciles replaced external pages and loading without stale virtual active descendants', async () => {
    prepareMeasurements()
    const { rerender } = render(<Combobox {...base} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    await waitFor(() =>
        expect(screen.getAllByRole('option').length).toBeGreaterThan(0),
    )
    fireEvent.keyDown(input, { key: 'End' })
    rerender(<Combobox {...base} options={items.slice(0, 2)} />)
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    expect(screen.getAllByRole('option')).toHaveLength(2)
    rerender(<Combobox {...base} loading locale="en" />)
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByRole('listbox').getAttribute('aria-busy')).toBe('true')
    expect(screen.getByRole('status').textContent).toBe('Loading…')
    fireEvent.keyDown(input, { key: 'End' })
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
})

test('inherits virtualization and supports explicitly disabling it', async () => {
    prepareMeasurements()
    const { rerender } = render(
        <SelectProvider virtualized>
            <Combobox {...base} virtualized={undefined} />
        </SelectProvider>,
    )
    fireEvent.focus(screen.getByRole('combobox'))
    await waitFor(() =>
        expect(screen.getAllByRole('option').length).toBeGreaterThan(0),
    )
    expect(screen.getAllByRole('option').length).toBeLessThan(30)
    rerender(
        <SelectProvider virtualized>
            <Combobox {...base} virtualized={false} />
        </SelectProvider>,
    )
    expect(screen.getAllByRole('option')).toHaveLength(1000)
})

test('keeps the active option mounted when the viewport scrolls independently', async () => {
    prepareMeasurements()
    const { rerender } = render(<Combobox {...base} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    await waitFor(() =>
        expect(screen.getAllByRole('option').length).toBeGreaterThan(0),
    )
    fireEvent.keyDown(input, { key: 'Home' })
    const viewport = screen.getByRole('listbox')
    viewport.scrollTop = 22000
    fireEvent.scroll(viewport)
    await waitFor(() =>
        expect(screen.getByRole('option', { name: 'Item 500' })).toBeTruthy(),
    )
    expect(screen.getByRole('option', { name: 'Item 0' }).id).toBe(
        input.getAttribute('aria-activedescendant'),
    )
    expect(screen.getAllByRole('option').length).toBeLessThan(30)
    rerender(<Combobox {...base} description="Updated description" />)
    expect(viewport.scrollTop).toBe(22000)
})

test.each([
    { estimateSize: Number.NaN, overscan: Number.POSITIVE_INFINITY },
    { estimateSize: Number.POSITIVE_INFINITY, overscan: Number.NaN },
    { estimateSize: -1, overscan: -2 },
    { estimateSize: 44, overscan: 2.8 },
])(
    'normalizes invalid or fractional virtualization settings %j',
    async (virtualized) => {
        prepareMeasurements()
        render(<Combobox {...base} virtualized={virtualized} />)
        fireEvent.focus(screen.getByRole('combobox'))
        await waitFor(() =>
            expect(screen.getAllByRole('option').length).toBeGreaterThan(0),
        )
        expect(screen.getAllByRole('option').length).toBeLessThan(30)
        expect(
            screen
                .getByRole('listbox')
                .firstElementChild?.getAttribute('style'),
        ).not.toContain('NaN')
    },
)

test('keeps shadow-root virtual active targets current through loading and reordered pages', async () => {
    prepareMeasurements()
    const host = document.createElement('div')
    document.body.append(host)
    const portal = host.attachShadow({ mode: 'open' })
    const { rerender, unmount } = render(
        <Combobox {...base} portalContainer={portal} />,
    )
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    await waitFor(() =>
        expect(
            portal.querySelectorAll('[role="option"]').length,
        ).toBeGreaterThan(0),
    )
    fireEvent.keyDown(input, { key: 'End' })
    expect(
        portal.getElementById(input.getAttribute('aria-activedescendant') ?? '')
            ?.textContent,
    ).toBe('Item 999')
    rerender(<Combobox {...base} portalContainer={portal} loading />)
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    expect(portal.querySelectorAll('[role="option"]')).toHaveLength(0)
    rerender(
        <Combobox
            {...base}
            portalContainer={portal}
            options={[items[999]!, items[0]!]}
        />,
    )
    const active = portal.getElementById(
        input.getAttribute('aria-activedescendant') ?? '',
    )
    expect(active?.textContent).toBe('Item 999')
    expect(active?.getAttribute('aria-posinset')).toBe('1')
    fireEvent.pointerDown(active!)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    rerender(
        <Combobox {...base} portalContainer={portal} options={[items[0]!]} />,
    )
    expect(input.hasAttribute('aria-activedescendant')).toBe(false)
    unmount()
    host.remove()
})

test('repeated Home navigation scrolls back after manual scrolling with the same active option', async () => {
    prepareMeasurements()
    render(<Combobox {...base} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    await waitFor(() =>
        expect(screen.getAllByRole('option').length).toBeGreaterThan(0),
    )
    const viewport = screen.getByRole('listbox')
    Object.defineProperty(viewport, 'scrollHeight', {
        configurable: true,
        value: 44000,
    })
    fireEvent.keyDown(input, { key: 'Home' })
    viewport.scrollTop = 22000
    fireEvent.scroll(viewport)
    await waitFor(() =>
        expect(screen.getByRole('option', { name: 'Item 500' })).toBeTruthy(),
    )
    expect(viewport.scrollTop).toBe(22000)
    fireEvent.keyDown(input, { key: 'Home' })
    await waitFor(() => expect(viewport.scrollTop).toBe(0))
    expect(screen.getByRole('option', { name: 'Item 0' }).id).toBe(
        input.getAttribute('aria-activedescendant'),
    )
})

test('automatically virtualizes from 1000 supplied options and re-evaluates external page sizes', async () => {
    prepareMeasurements()
    const { rerender } = render(
        <Combobox
            {...base}
            virtualized={undefined}
            options={items.slice(0, 999)}
        />,
    )
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    expect(screen.getAllByRole('option')).toHaveLength(999)
    rerender(<Combobox {...base} virtualized={undefined} />)
    await waitFor(() =>
        expect(
            screen
                .getByRole('option', { name: 'Item 0' })
                .getAttribute('aria-setsize'),
        ).toBe('1000'),
    )
    expect(screen.getAllByRole('option').length).toBeLessThan(30)
    fireEvent.keyDown(input, { key: 'End' })
    await waitFor(() =>
        expect(screen.getByRole('option', { name: 'Item 999' }).id).toBe(
            input.getAttribute('aria-activedescendant'),
        ),
    )
    rerender(
        <Combobox
            {...base}
            virtualized={undefined}
            options={items.slice(0, 999)}
        />,
    )
    expect(screen.getAllByRole('option')).toHaveLength(999)
    fireEvent.keyDown(input, { key: 'End' })
    expect(screen.getByRole('option', { name: 'Item 998' }).id).toBe(
        input.getAttribute('aria-activedescendant'),
    )
})

test('local auto overrides a forced combobox provider and keeps the mode stable through local filtering', async () => {
    prepareMeasurements()
    const { rerender } = render(
        <SelectProvider virtualized={false}>
            <Combobox {...base} virtualized="auto" filterMode="local" />
        </SelectProvider>,
    )
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    await waitFor(() =>
        expect(
            screen
                .getByRole('option', { name: 'Item 0' })
                .getAttribute('aria-setsize'),
        ).toBe('1000'),
    )
    rerender(
        <SelectProvider virtualized={false}>
            <Combobox
                {...base}
                virtualized="auto"
                filterMode="local"
                searchValue="Item 999"
            />
        </SelectProvider>,
    )
    await waitFor(() =>
        expect(
            screen
                .getByRole('option', { name: 'Item 999' })
                .getAttribute('aria-setsize'),
        ).toBe('1'),
    )
    expect(screen.getAllByRole('option')).toHaveLength(1)
})
