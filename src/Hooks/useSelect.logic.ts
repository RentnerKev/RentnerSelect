import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type {
    FocusEvent,
    FocusEventHandler,
    InvalidEvent,
    KeyboardEvent,
    Ref,
} from 'react'
import {
    resolveSelectMessages,
    type SelectLocale,
    type SelectMessages,
} from '../i18n.js'
import type { Option } from '../types.js'
import useComposedRefs from './useComposedRefs.js'

export interface UseSelectLogicOptions<TValue> {
    id?: string
    name?: string
    options: ReadonlyArray<Option<TValue>>
    selectedValues: ReadonlyArray<TValue>
    multiple: boolean
    required?: boolean
    externalError?: string | null
    disabled?: boolean
    readOnly?: boolean
    searchable?: boolean
    triggerRef?: Ref<HTMLButtonElement>
    onBlur?: FocusEventHandler<HTMLDivElement>
    minSelection?: number
    maxSelection?: number
    locale?: SelectLocale
    messages?: Partial<SelectMessages>
    isOptionEqualToValue?: (optionValue: TValue, value: TValue) => boolean
    onSelectValue: (value: TValue) => void
    onClear?: () => void
}

export default function useSelectLogic<TValue>({
    id,
    options,
    selectedValues,
    multiple,
    required = false,
    externalError,
    disabled = false,
    readOnly = false,
    searchable = true,
    triggerRef,
    onBlur,
    minSelection,
    maxSelection,
    locale = 'de',
    messages: providedMessages,
    isOptionEqualToValue: isOptionEqualToValueProp,
    onSelectValue,
    onClear,
}: UseSelectLogicOptions<TValue>) {
    const messages = resolveSelectMessages(locale, providedMessages)
    const [open, setOpen] = useState(false)
    const interactionDisabled = disabled || readOnly
    const [previousInteractionDisabled, setPreviousInteractionDisabled] =
        useState(interactionDisabled)
    const [searchValue, setSearchValue] = useState('')
    const [isTouched, setIsTouched] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const validationInputRef = useRef<HTMLInputElement>(null)
    const internalTriggerRef = useRef<HTMLButtonElement>(null)
    const shouldKeepOpen = useRef(false)
    const [optionIdentityState, setOptionIdentityState] = useState<{
        optionEntries: ReadonlyArray<{
            option: Option<TValue>
            radixValue: string
        }>
        nextRadixValue: number
    }>({ optionEntries: [], nextRadixValue: 0 })

    const generatedId = useId()
    const triggerId = id ?? `select-${generatedId}`
    const labelId = `${triggerId}-label`
    const descriptionId = `${triggerId}-description`
    const errorId = `${triggerId}-error`
    const isOptionEqualToValue = isOptionEqualToValueProp ?? Object.is
    const optionEntriesResult = useMemo(() => {
        let nextRadixValue = optionIdentityState.nextRadixValue
        const usedPreviousEntries = new Set<number>()
        const previousEntries = optionIdentityState.optionEntries
        const optionEntries = options.map((option) => {
            const previousIndex = previousEntries.findIndex(
                (entry, index) =>
                    !usedPreviousEntries.has(index) &&
                    isOptionEqualToValue(option.value, entry.option.value),
            )

            if (previousIndex >= 0) {
                usedPreviousEntries.add(previousIndex)
                return {
                    option,
                    radixValue: previousEntries[previousIndex].radixValue,
                }
            }

            return {
                option,
                radixValue: `option-${nextRadixValue++}`,
            }
        })

        return { optionEntries, nextRadixValue }
    }, [isOptionEqualToValue, optionIdentityState, options])
    const { optionEntries } = optionEntriesResult

    const optionIdentityIsCurrent =
        optionIdentityState.optionEntries.length === optionEntries.length &&
        optionIdentityState.optionEntries.every((entry, index) => {
            const nextEntry = optionEntries[index]

            return (
                nextEntry !== undefined &&
                entry.option === nextEntry.option &&
                entry.radixValue === nextEntry.radixValue
            )
        }) &&
        optionIdentityState.nextRadixValue ===
            optionEntriesResult.nextRadixValue

    if (!optionIdentityIsCurrent) {
        setOptionIdentityState(optionEntriesResult)
    }
    const filteredOptions = useMemo(() => {
        const normalizedSearch = (searchable ? searchValue : '')
            .trim()
            .toLowerCase()

        if (!normalizedSearch) return optionEntries

        return optionEntries.filter(({ option }) => {
            const optionLabel = option.label.toLowerCase()
            const optionValue = String(option.value).toLowerCase()
            const subOption = option.subOption?.toLowerCase() || ''

            return (
                optionLabel.includes(normalizedSearch) ||
                optionValue.includes(normalizedSearch) ||
                subOption.includes(normalizedSearch)
            )
        })
    }, [optionEntries, searchValue, searchable])
    const selectedEntries = useMemo(
        () =>
            optionEntries.filter(({ option }) =>
                selectedValues.some((value) =>
                    isOptionEqualToValue(option.value, value),
                ),
            ),
        [isOptionEqualToValue, optionEntries, selectedValues],
    )
    const selectedRadixValue = multiple
        ? ''
        : (selectedEntries[0]?.radixValue ?? '')
    const internalError = useMemo(() => {
        if (required && selectedValues.length === 0) return messages.required
        if (
            multiple &&
            minSelection !== undefined &&
            selectedValues.length < minSelection
        ) {
            return messages.minSelection(minSelection)
        }
        if (
            multiple &&
            maxSelection !== undefined &&
            selectedValues.length > maxSelection
        ) {
            return messages.maxSelection(maxSelection)
        }
        return null
    }, [
        maxSelection,
        messages,
        minSelection,
        multiple,
        required,
        selectedValues,
    ])
    const resolvedError =
        externalError !== undefined ? externalError : internalError
    const hasError =
        externalError !== undefined
            ? Boolean(resolvedError)
            : isTouched && Boolean(resolvedError)

    const composedTriggerRef = useComposedRefs(internalTriggerRef, triggerRef)

    const focusSearchInput = useCallback(() => {
        if (!searchable) return
        requestAnimationFrame(() => searchInputRef.current?.focus())
        window.setTimeout(() => searchInputRef.current?.focus(), 0)
    }, [searchable])

    useEffect(() => {
        if (open) focusSearchInput()
    }, [focusSearchInput, open])

    if (previousInteractionDisabled !== interactionDisabled) {
        setPreviousInteractionDisabled(interactionDisabled)

        if (interactionDisabled && open) {
            setOpen(false)
        }
    }

    useEffect(() => {
        validationInputRef.current?.setCustomValidity(
            disabled ? '' : resolvedError || '',
        )
    }, [disabled, resolvedError])

    useEffect(() => {
        const input = validationInputRef.current
        const form = input?.form
        if (!input || !form) return
        const currentInput = input

        function handleFormSubmit() {
            if (currentInput.validity.valid) setIsTouched(false)
        }

        form.addEventListener('submit', handleFormSubmit)
        return () => form.removeEventListener('submit', handleFormSubmit)
    }, [])

    function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
        event.preventDefault()
        setIsTouched(true)
        internalTriggerRef.current?.focus()
    }

    function handleFieldBlur(event: FocusEvent<HTMLDivElement>) {
        const nextTarget = event.relatedTarget

        if (
            nextTarget instanceof Node &&
            (rootRef.current?.contains(nextTarget) ||
                contentRef.current?.contains(nextTarget))
        ) {
            return
        }

        onBlur?.(event)
    }

    function handleValueChange(nextRadixValue: string) {
        if (disabled || readOnly) return
        const entry = optionEntries.find(
            ({ radixValue }) => radixValue === nextRadixValue,
        )
        if (!entry) return
        if (!multiple) setSearchValue('')
        onSelectValue(entry.option.value)
    }

    function handleClear() {
        if (disabled || readOnly || selectedValues.length === 0) return
        onClear?.()
        setSearchValue('')
        setOpen(false)
        internalTriggerRef.current?.focus()
    }

    function handleOpenChange(nextOpen: boolean) {
        if (disabled || readOnly) {
            setOpen(false)
            return
        }
        if (multiple && !nextOpen && shouldKeepOpen.current) {
            shouldKeepOpen.current = false
            return
        }
        setOpen(nextOpen)
        if (nextOpen) focusSearchInput()
        else setSearchValue('')
    }

    function closeAfterOptionRemoval() {
        shouldKeepOpen.current = false
        setOpen(false)
        setSearchValue('')
    }

    function handleContentKeyDownCapture(event: KeyboardEvent<HTMLDivElement>) {
        if (!searchable) return
        if (event.target === searchInputRef.current) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                const focusableOptions = Array.from(
                    event.currentTarget.querySelectorAll<HTMLElement>(
                        '[role="option"]:not([data-disabled])',
                    ),
                )
                const option =
                    event.key === 'ArrowDown'
                        ? focusableOptions[0]
                        : focusableOptions[focusableOptions.length - 1]

                if (option) {
                    event.preventDefault()
                    event.stopPropagation()
                    option.focus()
                }
            }
            return
        }

        if (
            event.ctrlKey ||
            event.altKey ||
            event.metaKey ||
            event.nativeEvent.isComposing ||
            event.key === ' ' ||
            event.key.length !== 1
        ) {
            return
        }
        event.preventDefault()
        event.stopPropagation()
        setSearchValue((current) => `${current}${event.key}`)
        focusSearchInput()
    }

    return {
        ref: {
            root: rootRef,
            content: contentRef,
            trigger: composedTriggerRef,
            searchInput: searchInputRef,
            validationInput: validationInputRef,
        },
        state: {
            messages,
            triggerId,
            labelId,
            descriptionId,
            errorId,
            open: open && !disabled && !readOnly,
            searchValue,
            optionEntries,
            filteredOptions,
            selectedEntries,
            selectedRadixValue,
            hasError,
            resolvedError,
            hasLeftIcon: Boolean(hasError),
            isOptionEqualToValue,
        },
        handler: {
            handleFieldBlur,
            handleInvalid,
            handleValueChange,
            handleClear,
            handleOpenChange,
            closeAfterOptionRemoval,
            handleContentKeyDownCapture,
            setSearchValue,
        },
        setter: {
            setOpen,
            setSearchValue,
            setIsTouched,
            shouldKeepOpen,
        },
    }
}

export type SelectLogic = ReturnType<typeof useSelectLogic>
