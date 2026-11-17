import { useState } from 'react'
import type { ComboboxProps } from '../../shared/Combobox/Types/combobox.types.ts'
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

export const automaticVirtualization: import('../../shared/Combobox/Types/combobox.types.ts').ComboboxProps<
    (typeof options)[number]
>['virtualized'] = 'auto'

export const groupedCreatable = (
    <Combobox
        options={options}
        value={null}
        onValueChange={() => undefined}
        searchValue=""
        onSearchValueChange={() => undefined}
        getOptionKey={(item) => String(item.id)}
        getOptionLabel={(item) => item.name}
        getOptionGroup={(item) => item.name.slice(0, 1)}
        onCreateOption={(query) => {
            const trimmedQuery: string = query
            void trimmedQuery
        }}
        createOptionLabel={(query) => `Create ${query}`}
    />
)
type Item = (typeof options)[number]
type CreateOption =
    import('../../shared/Combobox/Types/combobox.types.ts').ComboboxProps<Item>['onCreateOption']
// @ts-expect-error Creation receives a query string, never a selected option.
export const invalidCreate: CreateOption = (_option: Item) => undefined

export const multiple = (
    <Combobox
        multiple
        options={options}
        value={options as readonly Item[]}
        onValueChange={(items) => {
            const typed: Item[] = items
            void typed
        }}
        searchValue=""
        onSearchValueChange={() => undefined}
        getOptionKey={(item) => String(item.id)}
        getOptionLabel={(item) => item.name}
    />
)

const multipleCommon = {
    options,
    searchValue: '',
    onSearchValueChange: (_query: string) => undefined,
    getOptionKey: (item: Item) => String(item.id),
    getOptionLabel: (item: Item) => item.name,
}
// @ts-expect-error Multiple selection requires an array, never null.
export const invalidMultipleValue: import('../../shared/Combobox/Types/combobox.types.ts').ComboboxProps<Item> =
    {
        ...multipleCommon,
        multiple: true,
        value: null,
        onValueChange: (_items: Item[]) => undefined,
    }
// @ts-expect-error Single callbacks cannot be used for multiple selection.
export const invalidMultipleCallback: import('../../shared/Combobox/Types/combobox.types.ts').ComboboxProps<Item> =
    {
        ...multipleCommon,
        multiple: true,
        value: options,
        onValueChange: (_value: Item | null) => undefined,
    }

export function ReactSetterInference() {
    const [single, setSingle] = useState<Item | null>(null)
    const [mutable, setMutable] = useState<Item[]>([])
    const [readonly, setReadonly] = useState<readonly Item[]>([])
    return (
        <>
            <Combobox
                options={options}
                value={single}
                onValueChange={setSingle}
                searchValue=""
                onSearchValueChange={() => undefined}
                getOptionKey={(item) => String(item.id)}
                getOptionLabel={(item) => item.name}
            />
            <Combobox
                multiple
                options={options}
                value={mutable}
                onValueChange={setMutable}
                searchValue=""
                onSearchValueChange={() => undefined}
                getOptionKey={(item) => String(item.id)}
                getOptionLabel={(item) => item.name}
            />
            <Combobox
                multiple
                options={options}
                value={readonly}
                onValueChange={setReadonly}
                searchValue=""
                onSearchValueChange={() => undefined}
                getOptionKey={(item) => String(item.id)}
                getOptionLabel={(item) => item.name}
                renderOption={(item, state) => {
                    const selected: boolean = state.selected
                    return selected ? item.name : String(item.id)
                }}
            />
        </>
    )
}

export function ForwardControlledCombobox(props: ComboboxProps<Item>) {
    return <Combobox {...props} />
}

export function RejectMismatchedReactSetters() {
    const [single, setSingle] = useState<Item | null>(null)
    const [selectedItems, setMultiple] = useState<readonly Item[]>([])
    const invalidSingle = (
        // @ts-expect-error A multiple setter cannot receive a single value or null.
        <Combobox
            {...multipleCommon}
            value={single}
            onValueChange={setMultiple}
        />
    )
    const invalidMultiple = (
        // @ts-expect-error A single setter cannot receive a multiple selection array.
        <Combobox
            {...multipleCommon}
            multiple
            value={selectedItems}
            onValueChange={setSingle}
        />
    )
    return (
        <>
            {invalidSingle}
            {invalidMultiple}
        </>
    )
}
