import { createContext, useContext, useMemo } from 'react'
import type {
    SelectDefaults,
    SelectProviderProps,
    SelectProviderLogicResult,
} from '../Types/select.types.ts'
export const SelectContext = createContext<SelectDefaults | null>(null)

export function useSelectProviderLogic({
    locale,
    messages,
    classNames,
    searchable,
    nonce,
}: Omit<SelectProviderProps, 'children'>): SelectProviderLogicResult {
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

    return { state: { contextValue: mergedDefaults } }
}

export function useSelectDefaults(): SelectDefaults {
    return useContext(SelectContext) ?? {}
}
