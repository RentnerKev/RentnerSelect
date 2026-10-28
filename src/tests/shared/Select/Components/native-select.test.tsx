import { afterEach, expect, mock, test } from 'bun:test'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderToString } from 'react-dom/server'
import { useState } from 'react'
import { CustomSelect } from '../../../../shared/Select/Components/CustomSelect.tsx'

afterEach(cleanup)

const options = [
    { value: 'alpha', label: 'Alpha' },
    { value: 'blocked', label: 'Blocked', disabled: true },
    { value: 'beta', label: 'Beta' },
]

test('Tabs from the portaled popup through the surrounding field controls in either direction', async () => {
    const user = userEvent.setup()
    const blur = mock()
    render(
        <>
            <button type="button">Before</button>
            <CustomSelect
                label="Choice"
                value="alpha"
                options={options}
                clearable
                onValueChange={() => undefined}
                onBlur={blur}
            />
            <button type="button">After</button>
        </>,
    )
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.tab()
    expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Auswahl löschen' }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(blur).not.toHaveBeenCalled()
    await user.tab()
    expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'After' }),
    )
    expect(blur).toHaveBeenCalledTimes(1)
    await user.click(trigger)
    await user.tab({ shift: true })
    expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Before' }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(blur).toHaveBeenCalledTimes(2)
})

test('outside dismissal emits one whole-field blur without stealing outside focus', async () => {
    const user = userEvent.setup()
    const blur = mock()
    render(
        <>
            <CustomSelect
                label="Choice"
                value=""
                options={options}
                onValueChange={() => undefined}
                onBlur={blur}
            />
            <button type="button">Outside</button>
            <p>Outside text</p>
        </>,
    )
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Outside' }))
    expect(document.activeElement).toBe(
        screen.getByRole('button', { name: 'Outside' }),
    )
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(blur).toHaveBeenCalledTimes(1)
    await user.click(trigger)
    await user.click(screen.getByText('Outside text'))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(blur).toHaveBeenCalledTimes(2)
})

test.each(['disabled', 'readOnly'] as const)(
    'closes an open popup when %s changes and retains its controlled value',
    async (mode) => {
        const user = userEvent.setup()
        const change = mock()
        const view = render(
            <CustomSelect
                name="choice"
                label="Choice"
                value="alpha"
                options={options}
                onValueChange={change}
            />,
        )
        await user.click(screen.getByRole('combobox'))
        expect(screen.getByRole('dialog')).toBeTruthy()
        view.rerender(
            <CustomSelect
                name="choice"
                label="Choice"
                value="alpha"
                options={options}
                onValueChange={change}
                {...{ [mode]: true }}
            />,
        )
        expect(screen.queryByRole('dialog')).toBeNull()
        fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' })
        fireEvent.click(screen.getByRole('combobox'))
        expect(screen.queryByRole('dialog')).toBeNull()
        expect(change).not.toHaveBeenCalled()
        expect(
            (
                view.container.querySelector(
                    'input[name="choice"]',
                ) as HTMLInputElement
            ).value,
        ).toBe('alpha')
    },
)

test('native options select mouse releases once and defer touch selection to an actual click', async () => {
    const change = mock()
    render(
        <CustomSelect
            label="Choice"
            value={[]}
            multiple
            options={options}
            searchable={false}
            onValueChange={change}
        />,
    )
    fireEvent.click(screen.getByRole('combobox'))
    const alpha = screen.getByRole('option', { name: 'Alpha' })
    fireEvent.pointerDown(alpha, { pointerType: 'mouse', button: 0 })
    fireEvent.pointerUp(alpha, { pointerType: 'mouse', button: 0 })
    fireEvent.click(alpha, { detail: 1 })
    expect(change).toHaveBeenCalledTimes(1)
    expect(change).toHaveBeenLastCalledWith(['alpha'])
    change.mockClear()
    fireEvent.pointerDown(alpha, { pointerType: 'touch' })
    fireEvent.pointerCancel(alpha, { pointerType: 'touch' })
    expect(change).not.toHaveBeenCalled()
    fireEvent.pointerDown(alpha, { pointerType: 'touch' })
    fireEvent.pointerUp(alpha, { pointerType: 'touch', button: 0 })
    expect(change).not.toHaveBeenCalled()
    fireEvent.click(alpha, { detail: 1 })
    expect(change).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('option', { name: 'Blocked' }))
    expect(change).toHaveBeenCalledTimes(1)
})

test('supports closed and open typeahead, skips disabled options and preserves IME composition', async () => {
    const user = userEvent.setup()
    const change = mock()
    render(
        <CustomSelect
            value=""
            label="Choice"
            searchable={false}
            options={options}
            onValueChange={change}
        />,
    )
    const trigger = screen.getByRole('combobox')
    fireEvent.keyDown(trigger, { key: 'b', isComposing: true })
    expect(change).not.toHaveBeenCalled()
    fireEvent.keyDown(trigger, { key: 'b' })
    expect(change).toHaveBeenCalledWith('beta')
    await user.click(trigger)
    await user.keyboard('{End}')
    const beta = screen.getByRole('option', { name: 'Beta' })
    expect(document.activeElement).toBe(beta)
    await user.keyboard('{ArrowUp}')
    expect(document.activeElement).toBe(
        screen.getByRole('option', { name: 'Alpha' }),
    )
    fireEvent.keyDown(document.activeElement!, {
        key: 'Enter',
        isComposing: true,
    })
    expect(change).toHaveBeenCalledTimes(1)
    await user.keyboard('b')
    expect(document.activeElement).toBe(beta)
    expect(change).toHaveBeenCalledTimes(1)
    await user.keyboard('{Escape}')
    expect(document.activeElement).toBe(trigger)
})

function ResetHarness() {
    const [value, setValue] = useState('alpha')
    return (
        <form aria-label="Choice form" onReset={() => setValue('beta')}>
            <CustomSelect
                name="choice"
                label="Choice"
                value={value}
                options={options}
                onValueChange={setValue}
            />
        </form>
    )
}

test('form reset clears transient search while the parent remains responsible for controlled values', async () => {
    const user = userEvent.setup()
    render(<ResetHarness />)
    const form = screen.getByRole('form') as HTMLFormElement
    const trigger = screen.getByRole('combobox')
    await user.click(trigger)
    await user.type(screen.getByRole('textbox'), 'Alpha')
    await act(async () => {
        form.reset()
    })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(new FormData(form).get('choice')).toBe('beta')
    await user.click(trigger)
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe('')
    expect(screen.getAllByRole('option')).toHaveLength(3)
})

test('a cancelled reset preserves search and the open popup', async () => {
    const user = userEvent.setup()
    render(
        <form
            aria-label="Choice form"
            onReset={(event) => event.preventDefault()}
        >
            <CustomSelect
                value="alpha"
                label="Choice"
                options={options}
                onValueChange={() => undefined}
            />
        </form>,
    )
    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('textbox'), 'Alpha')
    await act(async () => {
        ;(screen.getByRole('form') as HTMLFormElement).reset()
    })
    expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
        'Alpha',
    )
    expect(screen.getAllByRole('option')).toHaveLength(1)
})

test('search Enter never submits a custom portal inside the surrounding form', async () => {
    const user = userEvent.setup()
    const form = document.createElement('form')
    document.body.append(form)
    const submit = mock((event: Event) => event.preventDefault())
    form.addEventListener('submit', submit)
    const view = render(
        <CustomSelect
            label="Choice"
            value="alpha"
            options={options}
            onValueChange={() => undefined}
            portalContainer={form}
        />,
        { container: form },
    )
    await user.click(screen.getByRole('combobox'))
    const search = screen.getByRole('textbox')
    expect(fireEvent.keyDown(search, { key: 'Enter' })).toBe(false)
    await user.keyboard('{Enter}')
    expect(submit).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeTruthy()
    view.unmount()
    form.remove()
})

test('SSR renders only the controlled trigger and form value without invoking option renderers', () => {
    const renderOption = mock(() => 'Custom option')
    const html = renderToString(
        <CustomSelect
            name="choice"
            label="Choice"
            value="alpha"
            options={options}
            renderOption={renderOption}
            onValueChange={() => undefined}
        />,
    )
    expect(html).toContain('role="combobox"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('name="choice"')
    expect(html).toContain('value="alpha"')
    expect(html).not.toContain('role="option"')
    expect(renderOption).not.toHaveBeenCalled()
})

test('moves an open popup between custom containers while retaining focus and option state', async () => {
    const user = userEvent.setup()
    const first = document.createElement('div')
    const second = document.createElement('div')
    document.body.append(first, second)
    const change = mock()
    const view = render(
        <CustomSelect
            label="Choice"
            value="alpha"
            options={options}
            onValueChange={change}
            searchable={false}
            portalContainer={first}
        />,
    )
    await user.click(screen.getByRole('combobox'))
    expect(first.querySelector('[role="listbox"]')).toBeTruthy()
    expect(document.activeElement).toBe(
        screen.getByRole('option', { name: 'Alpha' }),
    )
    expect(document.activeElement?.hasAttribute('data-highlighted')).toBe(true)
    view.rerender(
        <CustomSelect
            label="Choice"
            value="alpha"
            options={options}
            onValueChange={change}
            searchable={false}
            portalContainer={second}
        />,
    )
    expect(first.querySelector('[role="listbox"]')).toBeNull()
    expect(second.querySelector('[role="listbox"]')).toBeTruthy()
    expect(document.activeElement).toBe(
        screen.getByRole('option', { name: 'Alpha' }),
    )
    await user.keyboard('{ArrowDown}')
    expect(
        screen
            .getByRole('option', { name: 'Alpha' })
            .hasAttribute('data-highlighted'),
    ).toBe(false)
    expect(document.activeElement).toBe(
        screen.getByRole('option', { name: 'Beta' }),
    )
    await user.keyboard('{Escape}')
    expect(second.querySelector('[role="listbox"]')).toBeNull()
    view.unmount()
    first.remove()
    second.remove()
})
