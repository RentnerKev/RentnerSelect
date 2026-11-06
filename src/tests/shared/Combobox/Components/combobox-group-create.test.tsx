import { afterEach, expect, mock, test } from 'bun:test'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from '../../../../shared/Combobox/Components/Combobox.tsx'
import type { ComboboxProps } from '../../../../shared/Combobox/Types/combobox.types.ts'

afterEach(cleanup)
const options = [
    { id: 'create-option', name: 'Beta', group: 'B' },
    { id: 'alpha', name: 'Alpha', group: 'A' },
    { id: 'blocked', name: 'Blocked', group: 'B' },
    { id: 'bravo', name: 'Bravo', group: 'B' },
]
type Item = (typeof options)[number]
function Fixture(props: Partial<ComboboxProps<Item>>) {
    const [query, setQuery] = useState('')
    return (
        <form>
            <Combobox
                label="Grouped"
                id="grouped"
                name="choice"
                options={options}
                value={options[0]!}
                onValueChange={() => {}}
                searchValue={query}
                onSearchValueChange={setQuery}
                getOptionKey={(item) => item.id}
                getOptionLabel={(item) => item.name}
                getOptionGroup={(item) => item.group}
                isOptionDisabled={(item) => item.id === 'blocked'}
                {...props}
            />
        </form>
    )
}

test('navigates grouped display order, skips headers and disabled entries, and uses distinct create IDs', async () => {
    const create = mock(() => undefined)
    const change = mock(() => undefined)
    const user = userEvent.setup()
    const { container } = render(
        <Fixture onCreateOption={create} onValueChange={change} />,
    )
    const input = screen.getByRole('combobox')
    await user.click(input)
    expect(
        screen
            .getAllByRole('group')
            .map((group) => group.getAttribute('aria-label')),
    ).toEqual(['B', 'A'])
    expect(
        screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['Beta', 'Blocked', 'Bravo', 'Alpha'])
    fireEvent.change(input, { target: { value: '  New  ' } })
    const created = screen.getByRole('option', { name: /New/ })
    const ids = screen.getAllByRole('option').map((option) => option.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(created.id).toBe('grouped-create-option')
    fireEvent.keyDown(input, { key: 'Home' })
    expect(input.getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: 'Beta' }).id,
    )
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: 'Bravo' }).id,
    )
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input.getAttribute('aria-activedescendant')).toBe(
        screen.getByRole('option', { name: 'Alpha' }).id,
    )
    fireEvent.keyDown(input, { key: 'End' })
    expect(input.getAttribute('aria-activedescendant')).toBe(created.id)
    expect(created.getAttribute('aria-posinset')).toBe('5')
    expect(created.getAttribute('aria-setsize')).toBe('5')
    fireEvent.keyDown(input, { key: 'Enter' })
    expect(create).toHaveBeenCalledWith('New')
    expect(change).not.toHaveBeenCalled()
    expect(new FormData(container.querySelector('form')!).get('choice')).toBe(
        'create-option',
    )
    expect(screen.queryByRole('listbox') === null).toBe(true)
})

test('matches trimmed existing labels case-insensitively and allows group-label filtering', () => {
    const create = mock(() => undefined)
    const { rerender } = render(
        <Fixture onCreateOption={create} searchValue="  bEtA  " />,
    )
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getAllByRole('option')).toHaveLength(4)
    expect(screen.queryByText(/anlegen|Create/)).toBeNull()
    rerender(
        <Fixture onCreateOption={create} searchValue="B" filterMode="local" />,
    )
    expect(
        screen.getAllByRole('option').map((option) => option.textContent),
    ).toEqual(['Beta', 'Blocked', 'Bravo', '„B“ anlegen'])
})

test.each(['loading', 'disabled', 'readOnly'] as const)(
    'suppresses creation while %s without changing form selection',
    (flag) => {
        const create = mock(() => undefined)
        const change = mock(() => undefined)
        const { container } = render(
            <Fixture
                {...{ [flag]: true }}
                searchValue="New"
                onCreateOption={create}
                onValueChange={change}
            />,
        )
        const input = screen.getByRole('combobox')
        fireEvent.focus(input)
        fireEvent.keyDown(input, { key: 'End' })
        fireEvent.keyDown(input, { key: 'Enter' })
        expect(screen.queryByText(/New.*anlegen/)).toBeNull()
        expect(create).not.toHaveBeenCalled()
        expect(change).not.toHaveBeenCalled()
        if (flag !== 'disabled')
            expect(
                new FormData(container.querySelector('form')!).get('choice'),
            ).toBe('create-option')
    },
)

test('requires a nonempty query and explicit creation callback', () => {
    const { rerender } = render(
        <Fixture searchValue="  " onCreateOption={() => {}} />,
    )
    fireEvent.focus(screen.getByRole('combobox'))
    expect(screen.getAllByRole('option')).toHaveLength(4)
    rerender(<Fixture searchValue="New" />)
    expect(screen.getAllByRole('option')).toHaveLength(4)
})
