import { afterEach, expect, mock, test } from 'bun:test'
import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import { CustomSelect } from '../../../../shared/Select/Components/CustomSelect.tsx'

afterEach(cleanup)

const noop = () => undefined

test('keeps closed options unmounted without calling their custom renderers', async () => {
    const options = [
        { value: 'north', label: 'North', subOption: 'Canonical detail' },
    ]
    const selected = ['north']
    const renderOption = mock(() => <span>Custom native label</span>)
    const props = {
        options,
        value: selected,
        multiple: true as const,
        renderOption,
        onValueChange: noop,
        name: 'regions',
    }
    const view = render(
        <form>
            <CustomSelect {...props} aria-label="regions" />
        </form>,
    )
    expect(renderOption).not.toHaveBeenCalled()
    expect(view.container.querySelector('select')).toBeNull()
    expect(
        new FormData(view.container.querySelector('form')!).getAll('regions'),
    ).toEqual(['north'])
    view.rerender(
        <form>
            <CustomSelect {...props} aria-label="updated regions" />
        </form>,
    )
    expect(renderOption).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('combobox'))
    expect(
        await screen.findByRole('option', { name: 'Custom native label' }),
    ).toBeTruthy()
    expect(renderOption).toHaveBeenCalledTimes(1)
})

test('keeps closed collection typeahead and disabled-item filtering with custom native text', async () => {
    const onValueChange = mock()
    render(
        <CustomSelect
            value=""
            searchable={false}
            onValueChange={onValueChange}
            options={[
                { value: 'disabled', label: 'North disabled', disabled: true },
                { value: 'north', label: 'North' },
            ]}
            renderOption={(option) => <span>Custom {option.label}</span>}
        />,
    )
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'n' })
    await waitFor(() => expect(onValueChange).toHaveBeenLastCalledWith('north'))
    expect(screen.queryByRole('listbox')).toBeNull()
})
