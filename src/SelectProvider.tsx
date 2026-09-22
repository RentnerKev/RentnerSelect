import { createContext, useContext } from 'react'
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

export function SelectProvider({ children, ...defaults }: SelectProviderProps) {
    return (
        <SelectContext.Provider value={defaults}>
            {children}
        </SelectContext.Provider>
    )
}

export function useSelectDefaults(): SelectDefaults {
    return useContext(SelectContext) ?? {}
}
