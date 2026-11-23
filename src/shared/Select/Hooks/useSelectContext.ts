import { createContext, useContext, useMemo, useState } from 'react'
import type {
    SelectDefaults,
    SelectProviderProps,
    SelectProviderLogicResult,
} from '../Types/select.types.ts'

const EMPTY_DEFAULTS: SelectDefaults = {}

export const SelectContext =
    /* @__PURE__ */ createContext<SelectDefaults | null>(null)

function shallowEqualRecord(a: object, b: object): boolean {
    const keysA = Object.keys(a)
    if (keysA.length !== Object.keys(b).length) return false
    const recA = a as Record<string, unknown>
    const recB = b as Record<string, unknown>
    for (let i = 0; i < keysA.length; i += 1) {
        const key = keysA[i]!
        if (!Object.is(recA[key], recB[key])) return false
    }
    return true
}

function useStableOptionalRecord<T extends object>(
    value: T | undefined,
): T | undefined {
    const [stable, setStable] = useState(value)
    if (stable === value) return stable
    if (stable && value && shallowEqualRecord(stable, value)) return stable
    setStable(value)
    return value
}

function mergeOptional<T extends object>(
    parent: T | undefined,
    local: T | undefined,
): T | undefined {
    if (!parent && !local) return undefined
    if (!local) return parent
    if (!parent) return { ...local }
    return { ...parent, ...local }
}

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
    const parent = useContext(SelectContext)
    const stableMessages = useStableOptionalRecord(messages)
    const stableClassNames = useStableOptionalRecord(classNames)
    const mergedMessages = useMemo(
        () => mergeOptional(parent?.messages, stableMessages),
        [parent?.messages, stableMessages],
    )
    const mergedClassNames = useMemo(
        () => mergeOptional(parent?.classNames, stableClassNames),
        [parent?.classNames, stableClassNames],
    )
    const nextControlSize = controlSize ?? parent?.controlSize
    const nextVirtualized = virtualized ?? parent?.virtualized
    const nextTextOverflow = textOverflow ?? parent?.textOverflow
    const nextContentWidth = contentWidth ?? parent?.contentWidth
    const nextPortalContainer =
        portalContainer === undefined
            ? parent?.portalContainer
            : portalContainer
    const nextPortalClassName = portalClassName ?? parent?.portalClassName
    const nextPortalZIndex = portalZIndex ?? parent?.portalZIndex
    const nextLocale = locale ?? parent?.locale
    const nextSearchable = searchable ?? parent?.searchable
    const nextNonce = nonce ?? parent?.nonce

    const mergedDefaults = useMemo<SelectDefaults>(
        () => ({
            controlSize: nextControlSize,
            virtualized: nextVirtualized,
            textOverflow: nextTextOverflow,
            contentWidth: nextContentWidth,
            portalContainer: nextPortalContainer,
            portalClassName: nextPortalClassName,
            portalZIndex: nextPortalZIndex,
            locale: nextLocale,
            searchable: nextSearchable,
            nonce: nextNonce,
            messages: mergedMessages,
            classNames: mergedClassNames,
        }),
        [
            nextControlSize,
            nextVirtualized,
            nextTextOverflow,
            nextContentWidth,
            nextPortalContainer,
            nextPortalClassName,
            nextPortalZIndex,
            nextLocale,
            nextSearchable,
            nextNonce,
            mergedMessages,
            mergedClassNames,
        ],
    )

    return { state: { contextValue: mergedDefaults } }
}

export function useSelectDefaults(): SelectDefaults {
    return useContext(SelectContext) ?? EMPTY_DEFAULTS
}
