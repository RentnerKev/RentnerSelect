import type { AriaAttributes, FocusEventHandler, ReactNode, Ref } from 'react'
import type { SelectLocale, SelectMessages } from './i18n.js'

export interface Option<TValue = string> {
    value: TValue
    label: string
    subOption?: string
    disabled?: boolean
}

export interface SelectClassNames {
    root?: string
    trigger?: string
    content?: string
    search?: string
    viewport?: string
    option?: string
    empty?: string
    label?: string
    description?: string
    clear?: string
}

export interface SelectOptionState {
    selected: boolean
    disabled: boolean
}

interface SharedCustomSelectProps<TValue> extends AriaAttributes {
    id?: string
    name?: string
    options: ReadonlyArray<Option<TValue>>
    required?: boolean
    label?: ReactNode
    description?: ReactNode
    error?: string | null
    disabled?: boolean
    readOnly?: boolean
    triggerRef?: Ref<HTMLButtonElement>
    onBlur?: FocusEventHandler<HTMLButtonElement>
    icon?: ReactNode
    placeholder?: string
    className?: string
    classNames?: SelectClassNames
    searchable?: boolean
    nonce?: string
    renderOption?: (
        option: Option<TValue>,
        state: SelectOptionState,
    ) => ReactNode
    renderValue?: (options: ReadonlyArray<Option<TValue>>) => ReactNode
    fallbackOption?: string
    minSelection?: number
    maxSelection?: number
    locale?: SelectLocale
    messages?: Partial<SelectMessages>
    isOptionEqualToValue?: (optionValue: TValue, value: TValue) => boolean
    getFormValue?: (value: TValue) => string
}

type ClearableSelectProps =
    | { clearable: true; onClear: () => void }
    | { clearable?: false; onClear?: never }

export type SingleSelectProps<TValue = string> =
    SharedCustomSelectProps<TValue> &
        ClearableSelectProps & {
            value: TValue | null | undefined
            onValueChange: (value: TValue) => void
            multiple?: false
        }

export type MultipleSelectProps<TValue = string> =
    SharedCustomSelectProps<TValue> &
        ClearableSelectProps & {
            value: ReadonlyArray<TValue>
            onValueChange: (value: Array<TValue>) => void
            multiple: true
            omitEmptyFormValue?: boolean
        }

export type CustomSelectProps<TValue = string> =
    | SingleSelectProps<TValue>
    | MultipleSelectProps<TValue>

export type { SelectLocale, SelectMessages } from './i18n.js'
