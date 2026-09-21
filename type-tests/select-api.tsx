import { createElement } from 'react'
import { CustomSelect } from '../src/index.js'
import type {
    CustomSelectProps,
    LegacyMultipleSelectProps,
    Option,
} from '../src/index.js'

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

export const legacyMultipleProps: LegacyMultipleSelectProps = {
    multiple: true,
    value: 'one,two',
    onValueChange: () => undefined,
    options: [
        { value: 'one', label: 'One' },
        { value: 'two', label: 'Two' },
    ],
}

export const createElementSingle = createElement(CustomSelect<number>, {
    value: 0,
    onValueChange: (_value: number) => undefined,
    options: [{ value: 0, label: 'Zero' }],
})

export const createElementLegacy = createElement(CustomSelect, {
    multiple: true,
    value: 'one,two',
    onValueChange: (_value: string) => undefined,
    options: legacyMultipleProps.options,
})

export function DynamicLegacyMultiple({ multiple }: { multiple: boolean }) {
    return (
        <CustomSelect
            multiple={multiple}
            value="one,two"
            onValueChange={(_value: string) => undefined}
            options={legacyMultipleProps.options}
        />
    )
}

type LegacyLeaksIntoNumber =
    LegacyMultipleSelectProps extends CustomSelectProps<number> ? true : false

export const excludesLegacyStringsFromNumberProps: LegacyLeaksIntoNumber = false

type LegacyLeaksIntoStatus =
    LegacyMultipleSelectProps extends CustomSelectProps<Status> ? true : false

export const excludesLegacyStringsFromLiteralProps: LegacyLeaksIntoStatus = false

type LegacyLeaksIntoMixedValues =
    LegacyMultipleSelectProps extends CustomSelectProps<string | number>
        ? true
        : false

export const excludesLegacyStringsFromMixedProps: LegacyLeaksIntoMixedValues = false
