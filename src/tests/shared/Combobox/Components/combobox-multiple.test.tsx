import { afterEach, expect, mock, test } from 'bun:test'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Combobox } from '../../../../shared/Combobox/Components/Combobox.tsx'
import type { ComboboxProps } from '../../../../shared/Combobox/Types/combobox.types.ts'

afterEach(cleanup)
const options = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }, { id: 'c', label: 'Pinned' }]
type Item = typeof options[number]
const base = { options, getOptionKey: (item: Item) => item.id, getOptionLabel: (item: Item) => item.label, locale: 'en' as const, label: 'Customers', name: 'customer' }
function Controlled(props: Partial<Extract<ComboboxProps<Item>, { multiple: true }>>) {
    const [value, setValue] = useState<Item[]>([])
    const [search, setSearch] = useState('')
    return <form aria-label="Form"><Combobox {...base} multiple value={value} onValueChange={setValue} searchValue={search} onSearchValueChange={setSearch} {...props} /></form>
}

test('toggles with keyboard, keeps query and input focus, removes tags with Backspace and buttons', async () => {
    const user = userEvent.setup()
    render(<Controlled />)
    const input = screen.getByRole('combobox')
    await user.click(input)
    expect(screen.getByRole('listbox').getAttribute('aria-multiselectable')).toBe('true')
    await user.keyboard('{ArrowDown}{Enter}{ArrowDown}{Enter}')
    expect(document.activeElement).toBe(input)
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).getAll('customer')).toEqual(['a', 'b'])
    await user.keyboard('{Backspace}')
    expect(screen.queryByRole('button', { name: 'Remove Beta' })).toBeNull()
    await user.type(input, 'query')
    await user.keyboard('{Backspace}')
    expect(screen.getByRole('button', { name: 'Remove Alpha' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Remove Alpha' }))
    expect(document.activeElement).toBe(input)
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).getAll('customer')).toEqual([])
})

test('retains controlled selections across async pages, deduplicates keys and restores selected identity', async () => {
    const user = userEvent.setup()
    const onValueChange = mock(() => undefined)
    const { rerender } = render(<Controlled value={[options[0]!, options[0]!]} onValueChange={onValueChange} />)
    await user.click(screen.getByRole('combobox'))
    const originalId = screen.getByRole('option', { name: 'Alpha' }).id
    rerender(<Controlled value={[options[0]!, options[0]!]} options={[options[1]!]} loading onValueChange={onValueChange} />)
    expect(screen.getAllByRole('button', { name: 'Remove Alpha' })).toHaveLength(1)
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).getAll('customer')).toEqual(['a'])
    rerender(<Controlled value={[options[0]!]} options={[{ ...options[0]! }, { ...options[0]! }, options[1]!]} onValueChange={onValueChange} />)
    const option = screen.getByRole('option', { name: 'Alpha' })
    expect(option.id).toBe(originalId)
    expect(option.getAttribute('aria-selected')).toBe('true')
    await user.click(option)
    expect(onValueChange).toHaveBeenLastCalledWith([])
})

test('respects immutable selected options, readonly, disabled, clearing and required validation', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Controlled value={[options[2]!]} isOptionDisabled={(item) => item.id === 'c'} required />)
    expect(screen.queryByRole('button', { name: 'Remove Pinned' })).toBeNull()
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Backspace}')
    expect(new FormData(screen.getByRole('form') as HTMLFormElement).getAll('customer')).toEqual(['c'])
    for (const immutable of [{ readOnly: true }, { disabled: true }]) {
        rerender(<Controlled value={[options[0]!]} clearable {...immutable} />)
        expect(screen.queryByRole('button', { name: 'Remove Alpha' })).toBeNull()
        expect(screen.queryByRole('button', { name: 'Clear selection' })).toBeNull()
        expect(new FormData(screen.getByRole('form') as HTMLFormElement).getAll('customer')).toEqual('disabled' in immutable ? [] : ['a'])
    }
    rerender(<Controlled required clearable value={[options[0]!]} />)
    await user.click(screen.getByRole('button', { name: 'Clear selection' }))
    rerender(<Controlled required value={[]} />)
    fireEvent.invalid(screen.getByRole('form').querySelector('input[aria-hidden]')!)
    expect(screen.getByRole('combobox').getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(screen.getByRole('combobox'))
})


test('Backspace skips pinned tags and preserves comparator-equal selection identity', async () => {
    const user = userEvent.setup()
    const change = mock(() => undefined)
    render(<Controlled value={[options[0]!, options[2]!]} onValueChange={change} isOptionDisabled={(item) => item.id === 'c'} isOptionEqualToValue={(option, value) => option.label === value.label} />)
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Backspace}')
    expect(change).toHaveBeenLastCalledWith([options[2]!])
    const alpha = screen.getByRole('option', { name: 'Alpha' })
    expect(alpha.getAttribute('aria-selected')).toBe('true')
    await user.click(alpha)
    expect(change).toHaveBeenLastCalledWith([options[2]!])
})
