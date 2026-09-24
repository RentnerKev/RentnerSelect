import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { SelectLocale, SelectMessages } from './i18n.js'
import type { SelectClassNames } from './types.js'

export interface SelectProviderProps {
    children: ReactNode
    locale?: SelectLocale
    messages?: Partial<SelectMessages>
    classNames?: SelectClassNames
    searchable?: boolean
    nonce?: string
}

type SelectDefaults = Omit<SelectProviderProps, 'children'>

const SelectContext = createContext<SelectDefaults | null>(null)

export function SelectProvider({
    children,
    locale,
    messages,
    classNames,
    searchable,
    nonce,
}: SelectProviderProps) {
    const parentDefaults = useContext(SelectContext)
    const mergedDefaults = useMemo<SelectDefaults>(
        () => ({
            locale: locale ?? parentDefaults?.locale,
            searchable: searchable ?? parentDefaults?.searchable,
            nonce: nonce ?? parentDefaults?.nonce,
            messages: { ...parentDefaults?.messages, ...messages },
            classNames: { ...parentDefaults?.classNames, ...classNames },
        }),
        [parentDefaults, locale, searchable, nonce, messages, classNames],
    )

    return (
        <SelectContext.Provider value={mergedDefaults}>
            {children}
        </SelectContext.Provider>
    )
}

export function useSelectDefaults(): SelectDefaults {
    return useContext(SelectContext) ?? {}
}
