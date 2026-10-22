import { Combobox } from '../../shared/Combobox/Components/Combobox.tsx'
import { getSelectFieldProps } from '../../lib/Form/selectForm.ts'
const options = [{ id: 1, name: 'One' }]
const field = {
    name: 'customer',
    state: { value: null as (typeof options)[number] | null },
    handleChange: (_value: (typeof options)[number] | null) => undefined,
    handleBlur: () => undefined,
}
export const control = (
    <Combobox
        {...getSelectFieldProps(field)}
        virtualized={{ estimateSize: 48, overscan: 4 }}
        options={options}
        getOptionKey={(option) => String(option.id)}
        getOptionLabel={(option) => option.name}
        searchValue=""
        onSearchValueChange={() => undefined}
    />
)
// @ts-expect-error Query and selection callbacks remain separately typed.
export const invalid: import('../../shared/Combobox/Types/combobox.types.ts').ComboboxProps<
    (typeof options)[number]
>['onValueChange'] = (value: string) => value
