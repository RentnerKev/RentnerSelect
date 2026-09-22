import { createElement } from 'react'
import { CustomSelect, SelectProvider } from '../src/index.js'
import type { Option } from '../src/index.js'

const statuses = ['todo', 'done'] as const
type Status = (typeof statuses)[number]

const statusOptions = statuses.map((status) => ({
    value: status,
    label: status,
})) satisfies ReadonlyArray<Option<Status>>

export function GenericSingleSelect({
    value,
    onChange,
}: {
    value: Status
    onChange: (value: Status) => void
}) {
    return (
        <CustomSelect
            value={value}
            onValueChange={(nextValue) => {
                const typedValue: Status = nextValue
                onChange(typedValue)
            }}
            options={statusOptions}
        />
    )
}

type Region = 'north,west' | 'south'

const regionOptions: ReadonlyArray<Option<Region>> = [
    { value: 'north,west', label: 'North-West' },
    { value: 'south', label: 'South' },
]

export function GenericMultipleSelect({
    value,
    onChange,
}: {
    value: ReadonlyArray<Region>
    onChange: (value: Array<Region>) => void
}) {
    return (
        <CustomSelect
            multiple
            value={value}
            onValueChange={(nextValue) => {
                const typedValue: Array<Region> = nextValue
                onChange(typedValue)
            }}
            options={regionOptions}
        />
    )
}

export function GenericNumberSelect({
    value,
    onChange,
}: {
    value: number | null
    onChange: (value: number) => void
}) {
    return (
        <CustomSelect
            value={value}
            onValueChange={onChange}
            options={[
                { value: 0, label: 'Zero' },
                { value: 1, label: 'One' },
            ]}
        />
    )
}

export const createElementSingle = createElement(CustomSelect<number>, {
    value: 0,
    onValueChange: (_value: number) => undefined,
    options: [{ value: 0, label: 'Zero' }],
})

export function CustomizedSelect({ value }: { value: Status }) {
    return (
        <SelectProvider
            locale="fr"
            searchable={false}
            classNames={{ trigger: 'h-12' }}
        >
            <CustomSelect
                value={value}
                onValueChange={(nextValue) => {
                    const typedValue: Status = nextValue
                    void typedValue
                }}
                options={statusOptions}
                renderOption={(option, state) => {
                    const typedOption: Status = option.value
                    return `${typedOption}: ${state.selected}`
                }}
                renderValue={(selected) => selected[0]?.label}
                onBlur={(event) => event.currentTarget.focus()}
            />
        </SelectProvider>
    )
}
