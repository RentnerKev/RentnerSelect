// The harness reproduces the composite listbox content used by Radix Select.
/* oxlint-disable jsx-a11y/prefer-tag-over-role */
import { afterEach, expect, mock, test } from 'bun:test'
import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import VirtualSelectOptions from '../../../../shared/Select/Components/VirtualSelectOptions.tsx'
import type { SelectVirtualNavigation } from '../../../../shared/Select/Types/select.types.ts'
import type { VirtualSelectOptionsProps } from '../../../../shared/Select/Types/virtualSelectOptions.types.ts'

const entries = Array.from({ length: 1000 }, (_, index) => ({
    radixValue: String(index),
    option: { value: index, label: `Item ${index}` },
}))
const offsetHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetHeight',
)
const clientHeight = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientHeight',
)
const clientWidth = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'clientWidth',
)
afterEach(() => {
    cleanup()
    for (const [name, descriptor] of [
        ['offsetHeight', offsetHeight],
        ['clientHeight', clientHeight],
        ['clientWidth', clientWidth],
    ] as const) {
        if (descriptor)
            Object.defineProperty(HTMLElement.prototype, name, descriptor)
    }
})

function Harness(
    props: Partial<VirtualSelectOptionsProps<number>> & {
        optionsReady?: boolean
    },
) {
    const navigationRef = useRef<SelectVirtualNavigation | null>(null)
    const pendingNavigationRef = useRef<Array<KeyboardEvent<HTMLDivElement>>>(
        [],
    )
    const scrollRef = useRef<HTMLDivElement | null>(null)
    const contentRef = useRef<HTMLDivElement | null>(null)
    const searchInputRef = useRef<HTMLInputElement | null>(null)
    return (
        <div
            ref={contentRef}
            role="listbox"
            tabIndex={-1}
            onFocusCapture={(event) => {
                if (event.target === event.currentTarget)
                    navigationRef.current?.handleContentFocus()
            }}
            onKeyDownCapture={(event) => {
                if (navigationRef.current)
                    navigationRef.current.handleKeyDown(event)
                else {
                    const queue =
                        props.pendingNavigationRef ?? pendingNavigationRef
                    queue.current.push({
                        ...event,
                        target:
                            ['Enter', ' ', 'Home', 'End'].includes(event.key) &&
                            queue.current.some(
                                (pending) =>
                                    pending.key === 'ArrowDown' ||
                                    pending.key === 'ArrowUp',
                            )
                                ? event.currentTarget
                                : event.target,
                        defaultPrevented: false,
                        preventDefault: () => undefined,
                        stopPropagation: () => undefined,
                    })
                    event.preventDefault()
                    event.stopPropagation()
                }
            }}
        >
            {props.searchable && (
                <input ref={searchInputRef} aria-label="Search" />
            )}
            <div ref={scrollRef} data-testid="viewport">
                {props.optionsReady !== false && (
                    <VirtualSelectOptions
                        entries={entries}
                        multiple={false}
                        renderOption={undefined}
                        className={undefined}
                        classNames={{}}
                        textOverflow="wrap"
                        isSelected={(value) => value === 500}
                        isOptionDisabled={(option) => option.value === 999}
                        handler={{
                            handleOptionFocus: () => undefined,
                            handleOptionBlur: () => undefined,
                            handleOptionPointerDown: () => undefined,
                            handleOptionKeyDown: () => undefined,
                        }}
                        searchable={false}
                        virtualization
                        onValueChange={() => undefined}
                        onClose={() => undefined}
                        {...props}
                        navigationRef={navigationRef}
                        pendingNavigationRef={
                            props.pendingNavigationRef ?? pendingNavigationRef
                        }
                        contentRef={contentRef}
                        scrollRef={scrollRef}
                        searchInputRef={searchInputRef}
                    />
                )}
            </div>
        </div>
    )
}

function prepareMeasurements() {
    for (const [name, value] of [
        ['offsetHeight', 44],
        ['clientHeight', 256],
        ['clientWidth', 320],
    ] as const) {
        Object.defineProperty(HTMLElement.prototype, name, {
            configurable: true,
            get: () => value,
        })
    }
}

test('keeps distant selected and keyboard destinations mounted with logical positions', async () => {
    prepareMeasurements()
    const change = mock(() => undefined)
    const close = mock(() => undefined)
    render(<Harness onValueChange={change} onClose={close} />)
    fireEvent.focus(screen.getByRole('listbox'))
    await waitFor(() =>
        expect(document.activeElement).toBe(
            screen.getByRole('option', { name: 'Item 500' }),
        ),
    )
    expect(screen.getAllByRole('option').length).toBeLessThan(30)
    fireEvent.keyDown(document.activeElement!, { key: 'End' })
    await waitFor(() =>
        expect(document.activeElement).toBe(
            screen.getByRole('option', { name: 'Item 998' }),
        ),
    )
    expect(document.activeElement!.getAttribute('aria-posinset')).toBe('999')
    expect(document.activeElement!.getAttribute('aria-setsize')).toBe('1000')
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
    expect(change).toHaveBeenCalledWith('998')
    expect(close).toHaveBeenCalledTimes(1)
})

test('uses search arrows across the complete collection while preserving editing Home and End', async () => {
    prepareMeasurements()
    const change = mock(() => undefined)
    const close = mock(() => undefined)
    render(
        <Harness searchable multiple onValueChange={change} onClose={close} />,
    )
    fireEvent.focus(screen.getByRole('listbox'))
    const search = screen.getByRole('textbox')
    expect(document.activeElement).toBe(search)
    expect(fireEvent.keyDown(search, { key: 'End' })).toBe(true)
    fireEvent.keyDown(search, { key: 'ArrowUp' })
    await waitFor(() =>
        expect(document.activeElement).toBe(
            screen.getByRole('option', { name: 'Item 998' }),
        ),
    )
    fireEvent.keyDown(document.activeElement!, { key: ' ' })
    expect(change).toHaveBeenCalledWith('998')
    expect(close).not.toHaveBeenCalled()
    expect(fireEvent.keyDown(document.activeElement!, { key: 'Escape' })).toBe(
        true,
    )
})

test('preserves active identity when reordered and returns focus to search after removal', async () => {
    prepareMeasurements()
    const { rerender } = render(<Harness searchable />)
    const input = screen.getByRole('textbox')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    await waitFor(() =>
        expect(document.activeElement).toBe(
            screen.getByRole('option', { name: 'Item 998' }),
        ),
    )
    rerender(<Harness searchable entries={entries.toReversed()} />)
    expect(document.activeElement).toBe(
        screen.getByRole('option', { name: 'Item 998' }),
    )
    rerender(<Harness searchable entries={entries.slice(0, 10)} />)
    expect(document.activeElement).toBe(input)
})

test('supports spaces in static typeahead and repeated-character cycling without selecting', async () => {
    prepareMeasurements()
    const change = mock(() => undefined)
    render(
        <Harness
            entries={[
                { radixValue: 'york', option: { value: 1, label: 'New York' } },
                {
                    radixValue: 'orleans',
                    option: { value: 2, label: 'New Orleans' },
                },
            ]}
            onValueChange={change}
        />,
    )
    fireEvent.focus(screen.getByRole('listbox'))
    fireEvent.keyDown(document.activeElement!, { key: 'n' })
    expect(document.activeElement).toBe(
        screen.getByRole('option', { name: 'New Orleans' }),
    )
    for (const key of ['e', 'w', ' ', 'y'])
        fireEvent.keyDown(document.activeElement!, { key })
    await waitFor(() =>
        expect(document.activeElement).toBe(
            screen.getByRole('option', { name: 'New York' }),
        ),
    )
    expect(change).not.toHaveBeenCalled()
    fireEvent.keyDown(document.activeElement!, { key: 'Enter' })
    expect(change).toHaveBeenCalledWith('york')
})

test('keeps an all-disabled list readable and closes when its last option disappears', () => {
    prepareMeasurements()
    const close = mock(() => undefined)
    const { rerender } = render(
        <Harness
            entries={entries.slice(0, 2)}
            isOptionDisabled={() => true}
            onClose={close}
        />,
    )
    fireEvent.focus(screen.getByRole('listbox'))
    expect(screen.getAllByRole('option')).toHaveLength(2)
    expect(close).not.toHaveBeenCalled()
    rerender(<Harness entries={entries.slice(0, 1)} onClose={close} />)
    fireEvent.focus(screen.getByRole('listbox'))
    rerender(<Harness entries={[]} onClose={close} />)
    expect(close).toHaveBeenCalledTimes(1)
})

test('selects mouse releases once and defers touch selection to click', () => {
    prepareMeasurements()
    const change = mock(() => undefined)
    render(
        <Harness
            entries={entries.slice(0, 2)}
            multiple
            onValueChange={change}
        />,
    )
    const option = screen.getByRole('option', { name: 'Item 1' })
    fireEvent.pointerUp(option, { pointerType: 'mouse', button: 0 })
    fireEvent.click(option, { detail: 1 })
    expect(change).toHaveBeenCalledTimes(1)
    fireEvent.pointerDown(option, { pointerType: 'touch' })
    fireEvent.pointerUp(option, { pointerType: 'touch', button: 0 })
    expect(change).toHaveBeenCalledTimes(1)
    fireEvent.click(option, { detail: 1 })
    expect(change).toHaveBeenCalledTimes(2)
})

test('cycles repeated typeahead characters across enabled matching labels', () => {
    prepareMeasurements()
    render(
        <Harness
            entries={[
                { radixValue: 'york', option: { value: 1, label: 'New York' } },
                {
                    radixValue: 'orleans',
                    option: { value: 2, label: 'New Orleans' },
                },
            ]}
        />,
    )
    fireEvent.focus(screen.getByRole('listbox'))
    fireEvent.keyDown(document.activeElement!, { key: 'n' })
    expect(document.activeElement).toBe(
        screen.getByRole('option', { name: 'New Orleans' }),
    )
    fireEvent.keyDown(document.activeElement!, { key: 'n' })
    expect(document.activeElement).toBe(
        screen.getByRole('option', { name: 'New York' }),
    )
})

test('replays multiple navigation keys captured before lazy rows mount', async () => {
    prepareMeasurements()
    const change = mock(() => undefined)
    const { rerender } = render(
        <Harness searchable optionsReady={false} onValueChange={change} />,
    )
    const input = screen.getByRole('textbox')
    input.focus()
    for (const key of ['ArrowDown', 'ArrowDown', 'ArrowDown'])
        fireEvent.keyDown(input, { key })
    await act(async () => {
        rerender(<Harness searchable onValueChange={change} />)
    })
    await waitFor(() =>
        expect(document.activeElement).toBe(
            screen.getByRole('option', { name: 'Item 2' }),
        ),
    )
    expect(change).not.toHaveBeenCalled()
})

test('explicit Home navigation scrolls back after user scrolling with the same active key', async () => {
    prepareMeasurements()
    render(<Harness />)
    fireEvent.focus(screen.getByRole('listbox'))
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    await waitFor(() =>
        expect(document.activeElement).toBe(
            screen.getByRole('option', { name: 'Item 0' }),
        ),
    )
    const viewport = screen.getByTestId('viewport')
    viewport.scrollTop = 22000
    fireEvent.scroll(viewport)
    await waitFor(() =>
        expect(screen.getByRole('option', { name: 'Item 500' })).toBeTruthy(),
    )
    expect(viewport.scrollTop).toBe(22000)
    const scroll = mock(() => undefined)
    viewport.scrollTo = scroll
    fireEvent.keyDown(document.activeElement!, { key: 'Home' })
    expect(scroll).toHaveBeenCalled()
})

test('does not select when the only buffered event is input Enter', async () => {
    prepareMeasurements()
    const change = mock(() => undefined)
    const { rerender } = render(
        <Harness searchable optionsReady={false} onValueChange={change} />,
    )
    const input = screen.getByRole('textbox')
    input.focus()
    fireEvent.keyDown(input, { key: 'Enter' })
    await act(async () => {
        rerender(<Harness searchable onValueChange={change} />)
    })
    expect(change).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(input)
})

for (const multiple of [false, true]) {
    test(`replays early ArrowDown then logical content Space for ${multiple ? 'multiple' : 'single'} selection`, async () => {
        prepareMeasurements()
        const change = mock(() => undefined)
        const close = mock(() => undefined)
        const { rerender } = render(
            <Harness
                searchable
                multiple={multiple}
                optionsReady={false}
                onValueChange={change}
                onClose={close}
            />,
        )
        const input = screen.getByRole('textbox')
        input.focus()
        fireEvent.keyDown(input, { key: 'ArrowDown' })
        fireEvent.keyDown(input, { key: ' ' })
        await act(async () => {
            rerender(
                <Harness
                    searchable
                    multiple={multiple}
                    onValueChange={change}
                    onClose={close}
                />,
            )
        })
        expect(change).toHaveBeenCalledTimes(1)
        expect(change).toHaveBeenCalledWith('0')
        expect(close).toHaveBeenCalledTimes(multiple ? 0 : 1)
    })
}
