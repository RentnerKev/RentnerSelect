import type { AriaAttributes, ReactNode, Ref } from 'react'
import type { SelectLocale, SelectMessages } from './i18n.js'

export interface Option<TValue = string> {
    value: TValue
    label: string
    subOption?: string
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
    icon?: ReactNode
    placeholder?: string
    className?: string
    fallbackOption?: string
    minSelection?: number
    maxSelection?: number
    locale?: SelectLocale
    messages?: Partial<SelectMessages>
    isOptionEqualToValue?: (optionValue: TValue, value: TValue) => boolean
    getFormValue?: (value: TValue) => string
}

export interface SingleSelectProps<
    TValue = string,
> extends SharedCustomSelectProps<TValue> {
    value: TValue | null | undefined
    onValueChange: (value: TValue) => void
    multiple?: false
}

export interface MultipleSelectProps<
    TValue = string,
> extends SharedCustomSelectProps<TValue> {
    value: ReadonlyArray<TValue>
    onValueChange: (value: Array<TValue>) => void
    multiple: true
}

export type CustomSelectProps<TValue = string> =
    | SingleSelectProps<TValue>
    | MultipleSelectProps<TValue>

export type { SelectLocale, SelectMessages } from './i18n.js'
