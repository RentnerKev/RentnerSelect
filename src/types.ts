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

/**
 * @deprecated Verwende `MultipleSelectProps<TValue>` mit `TValue[]`. Das
 * kommagetrennte Stringformat wird in Version 2.0 entfernt.
 */
export interface LegacyMultipleSelectProps extends SharedCustomSelectProps<string> {
    /** @deprecated Übergib ein Array und behandle Änderungen als `string[]`. */
    value: string
    /** @deprecated Der Callback erhält mit der Array-API ein `string[]`. */
    onValueChange: (value: string) => void
    /**
     * @deprecated Dynamische Booleans bleiben bis Version 2.0 kompatibel.
     * Verwende für neue Mehrfachauswahlen `multiple: true` mit einem Array.
     */
    multiple: boolean
}

export type CustomSelectProps<TValue = string> =
    | SingleSelectProps<TValue>
    | MultipleSelectProps<TValue>
    | ([TValue] extends [string]
          ? [string] extends [TValue]
              ? LegacyMultipleSelectProps
              : never
          : never)

export type { SelectLocale, SelectMessages } from './i18n.js'
