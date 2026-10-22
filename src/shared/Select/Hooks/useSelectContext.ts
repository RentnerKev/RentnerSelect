import { createContext, useContext, useMemo } from 'react'
import type {
    SelectDefaults,
    SelectProviderProps,
    SelectProviderLogicResult,
} from '../Types/select.types.ts'
export const SelectContext = createContext<SelectDefaults | null>(null)

export function useSelectProviderLogic({
    controlSize,
    virtualized,
    textOverflow,
    contentWidth,
    portalContainer,
    portalClassName,
    portalZIndex,
    locale,
    messages,
    classNames,
    searchable,
    nonce,
}: Omit<SelectProviderProps, 'children'>): SelectProviderLogicResult {
    const parentDefaults = useContext(SelectContext)
    const mergedDefaults = useMemo<SelectDefaults>(
        () => ({
            controlSize: controlSize ?? parentDefaults?.controlSize,
            virtualized: virtualized ?? parentDefaults?.virtualized,
            textOverflow: textOverflow ?? parentDefaults?.textOverflow,
            contentWidth: contentWidth ?? parentDefaults?.contentWidth,
            portalContainer:
                portalContainer === undefined
                    ? parentDefaults?.portalContainer
                    : portalContainer,
            portalClassName: portalClassName ?? parentDefaults?.portalClassName,
            portalZIndex: portalZIndex ?? parentDefaults?.portalZIndex,
            locale: locale ?? parentDefaults?.locale,
            searchable: searchable ?? parentDefaults?.searchable,
            nonce: nonce ?? parentDefaults?.nonce,
            messages: { ...parentDefaults?.messages, ...messages },
            classNames: { ...parentDefaults?.classNames, ...classNames },
        }),
        [
            parentDefaults,
            locale,
            searchable,
            nonce,
            messages,
            classNames,
            controlSize,
            virtualized,
            textOverflow,
            contentWidth,
            portalContainer,
            portalClassName,
            portalZIndex,
        ],
    )

    return { state: { contextValue: mergedDefaults } }
}

export function useSelectDefaults(): SelectDefaults {
    return useContext(SelectContext) ?? {}
}
