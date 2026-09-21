import type { AriaAttributes, ReactNode, Ref } from 'react'
import type { SelectLocale, SelectMessages } from './i18n.js'

export interface Option {
    value: string
    label: string
    subOption?: string
}

export interface CustomSelectProps extends AriaAttributes {
    id?: string
    name?: string
    value: string
    onValueChange: (value: string) => void
    options: Array<Option>
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
    multiple?: boolean
    minSelection?: number
    maxSelection?: number
    locale?: SelectLocale
    messages?: Partial<SelectMessages>
}

export type { SelectLocale, SelectMessages } from './i18n.js'
