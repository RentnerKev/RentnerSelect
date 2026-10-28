import {
    useCallback,
    useLayoutEffect,
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react'
import type {
    FocusEvent,
    ChangeEvent,
    PointerEvent,
    InvalidEvent,
    KeyboardEvent,
    MouseEvent,
} from 'react'
import { resolveSelectMessages } from '../../../lib/Messages/i18n.ts'
import type {
    Option,
    CustomSelectProps,
    CustomSelectLogicResult,
} from '../Types/select.types.ts'
import { useSelectDefaults } from './useSelectContext.ts'
import { mergeAriaIds } from '../../../lib/Field/selectField.ts'
import { getOptionKey } from '../../../lib/Select/selectOptions.ts'
import { findTypeaheadEntry } from '../../../lib/Select/selectNavigation.ts'
import { resolveSelectVirtualization } from '../../../lib/Select/selectVirtualization.ts'
import type { SelectVirtualNavigation } from '../Types/select.types.ts'
import useSelectValues from './useSelectValues.ts'
import useSelectOptionIdentity from './useSelectOptionIdentity.ts'
import useComposedRefs from './useComposedRefs.ts'
import useDeferredModule from '../../VirtualList/Hooks/useDeferredModule.ts'
import useSelectOverlay from './useSelectOverlay.ts'
import {
    containsTarget,
    focusAdjacentControl,
    getActiveElement,
    scrollOptionIntoView,
} from '../../../lib/DOM/selectOverlay.ts'

let virtualOptionsPromise:
    | Promise<typeof import('../Components/VirtualSelectOptions.tsx')>
    | undefined
function loadVirtualOptions() {
    return (virtualOptionsPromise ??=
        import('../Components/VirtualSelectOptions.tsx'))
}

function handleSearchPointerDown(event: PointerEvent<HTMLInputElement>) {
    event.stopPropagation()
}

function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing)
        event.preventDefault()
    if (event.key !== 'Escape') event.stopPropagation()
}

export default function useCustomSelectLogic<TValue>(
    props: CustomSelectProps<TValue>,
): CustomSelectLogicResult<TValue> {
    const {
        controlSize: providedControlSize,
        virtualized: providedVirtualized,
        textOverflow: providedTextOverflow,
        contentWidth: providedContentWidth,
        portalContainer: providedPortalContainer,
        portalClassName: providedPortalClassName,
        portalZIndex: providedPortalZIndex,
        multiple: providedMultiple,
        id,
        name,
        options,
        clearable = false,
        required = false,
        label,
        description,
        error: externalError,
        disabled = false,
        readOnly = false,
        triggerRef,
        onBlur,
        icon,
        placeholder,
        className,
        classNames: providedClassNames,
        searchable: providedSearchable,
        nonce: providedNonce,
        renderOption,
        renderValue,
        fallbackOption,
        locale: providedLocale,
        messages: providedMessages,
        isOptionEqualToValue: isOptionEqualToValueProp,
        'aria-label': ariaLabel,
        'aria-labelledby': ariaLabelledBy,
        'aria-describedby': ariaDescribedBy,
        ...rest
    } = props
    const multiple = providedMultiple === true
    const minSelection =
        'minSelection' in props ? props.minSelection : undefined
    const maxSelection =
        'maxSelection' in props ? props.maxSelection : undefined
    const omitEmptyFormValue =
        'omitEmptyFormValue' in props
            ? (props.omitEmptyFormValue ?? false)
            : false
    const {
        value: _value,
        onValueChange: _onValueChange,
        getFormValue: _getFormValue,
        emptyValue: _emptyValue,
        onClear: _onClear,
        minSelection: _min,
        maxSelection: _max,
        omitEmptyFormValue: _omit,
        ...ariaProps
    } = rest as typeof rest & {
        minSelection?: number
        maxSelection?: number
        omitEmptyFormValue?: boolean
    }
    const defaults = useSelectDefaults()
    const controlSize = providedControlSize ?? defaults.controlSize
    const virtualized = resolveSelectVirtualization(
        providedVirtualized ?? defaults.virtualized,
        options.length,
        'select',
    )
    const textOverflow =
        providedTextOverflow ?? defaults.textOverflow ?? 'truncate'
    const contentWidth =
        providedContentWidth ?? defaults.contentWidth ?? 'trigger'
    const portalContainer =
        providedPortalContainer === undefined
            ? defaults.portalContainer
            : providedPortalContainer
    const portalClassName = providedPortalClassName ?? defaults.portalClassName
    const portalZIndex = providedPortalZIndex ?? defaults.portalZIndex
    const locale = providedLocale ?? defaults.locale ?? 'de'
    const searchable = providedSearchable ?? defaults.searchable ?? true
    const nonce = providedNonce ?? defaults.nonce
    const classNames = useMemo(
        () => ({ ...defaults.classNames, ...providedClassNames }),
        [defaults.classNames, providedClassNames],
    )
    const mergedMessages = useMemo(
        () => ({ ...defaults.messages, ...providedMessages }),
        [defaults.messages, providedMessages],
    )
    const isOptionEqualToValue = isOptionEqualToValueProp ?? Object.is
    const {
        state: { selectedValues, formEntries },
        handler: { handleSelectValue, handleClearValues },
    } = useSelectValues(props)

    const messages = resolveSelectMessages(locale, mergedMessages)
    const [open, setOpen] = useState(false)
    const [defaultPortalTarget, setDefaultPortalTarget] =
        useState<HTMLElement | null>(null)
    const portalTarget = portalContainer ?? defaultPortalTarget
    const {
        state: { module: virtualOptionsModule },
    } = useDeferredModule({
        enabled: open && Boolean(virtualized),
        load: loadVirtualOptions,
    })
    const interactionDisabled = disabled || readOnly
    const [previousInteractionDisabled, setPreviousInteractionDisabled] =
        useState(interactionDisabled)
    const [searchValue, setSearchValue] = useState('')
    const [isTouched, setIsTouched] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const scrollRef = useRef<HTMLDivElement>(null)
    const virtualNavigationRef = useRef<SelectVirtualNavigation>(null)
    const previousVirtualized = useRef(Boolean(virtualized))
    const pendingVirtualNavigationRef = useRef<
        Array<KeyboardEvent<HTMLDivElement>>
    >([])
    const typeaheadRef = useRef({ search: '', updatedAt: 0 })
    const validationInputRef = useRef<HTMLInputElement>(null)
    const focusedOptionValue = useRef<{ value: TValue } | null>(null)
    const internalTriggerRef = useRef<HTMLButtonElement>(null)
    const pointerType = useRef('mouse')
    const initialFocus = useRef<'selected' | 'last'>('selected')
    const initialFocusDone = useRef(false)
    const previousPortalTarget = useRef(portalTarget)
    const {
        state: { optionEntries },
    } = useSelectOptionIdentity(options, isOptionEqualToValue)
    const generatedId = useId()
    const triggerId = id ?? `select-${generatedId}`
    const labelId = `${triggerId}-label`
    const descriptionId = `${triggerId}-description`
    const errorId = `${triggerId}-error`
    const isValueSelected = useMemo(() => {
        if (isOptionEqualToValue !== Object.is) {
            return (optionValue: TValue) =>
                selectedValues.some((selectedValue) =>
                    isOptionEqualToValue(optionValue, selectedValue),
                )
        }
        const selectedKeys = new Set(selectedValues.map(getOptionKey))
        return (optionValue: TValue) =>
            selectedKeys.has(getOptionKey(optionValue))
    }, [isOptionEqualToValue, selectedValues])
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
            optionEntries.filter(({ option }) => isValueSelected(option.value)),
        [isValueSelected, optionEntries],
    )
    const renderedSelection = useMemo(
        () => ({
            options: selectedEntries.map(({ option }) => option),
            label: selectedEntries.map(({ option }) => option.label).join(', '),
        }),
        [selectedEntries],
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

    const isOptionDisabled = useCallback(
        (option: Option<TValue>) =>
            option.disabled === true ||
            (multiple &&
                maxSelection !== undefined &&
                selectedValues.length >= maxSelection &&
                !isValueSelected(option.value)),
        [isValueSelected, maxSelection, multiple, selectedValues.length],
    )

    const focusSearchInput = useCallback(() => {
        if (!searchable) return
        searchInputRef.current?.focus({ preventScroll: true })
    }, [searchable])

    useLayoutEffect(() => {
        const moved = previousPortalTarget.current !== portalTarget
        previousPortalTarget.current = portalTarget
        if (!open) {
            initialFocusDone.current = false
            return
        }
        if (initialFocusDone.current && !moved) return
        initialFocusDone.current = true
        if (searchable) focusSearchInput()
        else if (virtualized) contentRef.current?.focus({ preventScroll: true })
        else {
            const rows = Array.from(
                contentRef.current?.querySelectorAll<HTMLElement>(
                    '[role="option"]:not([data-disabled])',
                ) ?? [],
            )
            const selected = rows.find(
                (row) => row.dataset.optionKey === selectedRadixValue,
            )
            const row =
                selected ??
                (initialFocus.current === 'last' ? rows.at(-1) : rows[0])
            const target = row ?? contentRef.current
            target?.focus({ preventScroll: true })
            if (row) scrollOptionIntoView(row, scrollRef.current)
        }
    }, [
        open,
        searchable,
        virtualized,
        selectedRadixValue,
        focusSearchInput,
        portalTarget,
    ])

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

        let mounted = true
        function handleFormReset(event: Event) {
            queueMicrotask(() => {
                if (!mounted || event.defaultPrevented) return
                const active = getActiveElement(currentInput.ownerDocument)
                if (containsTarget(contentRef.current, active))
                    internalTriggerRef.current?.focus({ preventScroll: true })
                setIsTouched(false)
                setSearchValue('')
                setOpen(false)
                pendingVirtualNavigationRef.current = []
            })
        }

        form.addEventListener('submit', handleFormSubmit)
        form.addEventListener('reset', handleFormReset)
        return () => {
            mounted = false
            form.removeEventListener('submit', handleFormSubmit)
            form.removeEventListener('reset', handleFormReset)
        }
    }, [])

    function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
        event.preventDefault()
        setIsTouched(true)
        internalTriggerRef.current?.focus()
    }

    function handleFieldBlur(event: FocusEvent<HTMLDivElement>) {
        const nextTarget = event.relatedTarget

        if (
            nextTarget &&
            'nodeType' in nextTarget &&
            (containsTarget(rootRef.current, nextTarget as Node) ||
                containsTarget(contentRef.current, nextTarget as Node))
        ) {
            return
        }

        // Focus crossing a ShadowRoot is retargeted to its host. Wait until
        // that root exposes the new active element before classifying a blur.
        if (
            nextTarget &&
            'nodeType' in nextTarget &&
            containsTarget(nextTarget as Element, contentRef.current)
        ) {
            const document = event.currentTarget.ownerDocument
            queueMicrotask(() => {
                const active = getActiveElement(document)
                if (
                    containsTarget(rootRef.current, active) ||
                    containsTarget(contentRef.current, active)
                )
                    return
                closeWithoutFocus()
                onBlur?.(event)
            })
            return
        }

        closeWithoutFocus()
        onBlur?.(event)
    }

    const handleOpenChange = useCallback(
        (nextOpen: boolean) => {
            if (disabled || readOnly) {
                setOpen(false)
                return
            }
            pendingVirtualNavigationRef.current = []
            if (nextOpen) typeaheadRef.current = { search: '', updatedAt: 0 }
            setOpen(nextOpen)
            if (nextOpen) {
                setDefaultPortalTarget(
                    internalTriggerRef.current?.ownerDocument.body ?? null,
                )
                focusSearchInput()
            } else {
                setSearchValue('')
                internalTriggerRef.current?.focus({ preventScroll: true })
            }
        },
        [disabled, readOnly, focusSearchInput],
    )

    const handleValueChange = useCallback(
        (nextRadixValue: string) => {
            if (disabled || readOnly) return
            const entry = optionEntries.find(
                ({ radixValue }) => radixValue === nextRadixValue,
            )
            if (!entry || isOptionDisabled(entry.option)) return
            if (!multiple) setSearchValue('')
            handleSelectValue(entry.option.value)
            if (!multiple) handleOpenChange(false)
        },
        [
            disabled,
            readOnly,
            optionEntries,
            isOptionDisabled,
            multiple,
            handleSelectValue,
            handleOpenChange,
        ],
    )

    function handleClear() {
        if (disabled || readOnly || selectedValues.length === 0) return
        handleClearValues()
        setSearchValue('')
        setOpen(false)
        internalTriggerRef.current?.focus()
    }

    const closeWithoutFocus = useCallback(() => {
        pendingVirtualNavigationRef.current = []
        setOpen(false)
        setSearchValue('')
    }, [])

    const {
        state: { popupStyle },
    } = useSelectOverlay({
        open: open && !interactionDisabled,
        contentWidth,
        portalTarget,
        rootRef,
        contentRef,
        triggerRef: internalTriggerRef,
        onDismiss: closeWithoutFocus,
    })

    useLayoutEffect(() => {
        const popup = contentRef.current
        if (!open || virtualized || !popup || !popupStyle.position) return
        function revealFocusedOption() {
            const active = popup && getActiveElement(popup.ownerDocument)
            if (
                active &&
                containsTarget(popup, active) &&
                active.getAttribute('role') === 'option' &&
                filteredOptions.some(
                    (entry) =>
                        entry.radixValue ===
                        active.getAttribute('data-option-key'),
                )
            )
                scrollOptionIntoView(active as HTMLElement, scrollRef.current)
        }
        revealFocusedOption()
        const observer =
            typeof ResizeObserver === 'undefined'
                ? undefined
                : new ResizeObserver(revealFocusedOption)
        const collection = scrollRef.current?.firstElementChild
        if (collection) observer?.observe(collection)
        return () => observer?.disconnect()
    }, [open, virtualized, popupStyle.position, filteredOptions])

    const closeAfterOptionRemoval = useCallback(() => {
        setOpen(false)
        setSearchValue('')
        internalTriggerRef.current?.focus({ preventScroll: true })
    }, [])

    function handleContentFocusCapture(event: FocusEvent<HTMLDivElement>) {
        if (virtualized && event.target === event.currentTarget)
            virtualNavigationRef.current?.handleContentFocus()
    }

    function handleVirtualClose() {
        handleOpenChange(false)
    }

    function handleContentKeyDownCapture(event: KeyboardEvent<HTMLDivElement>) {
        if (event.nativeEvent.isComposing) return
        if (event.key === 'Escape') {
            event.preventDefault()
            event.stopPropagation()
            handleOpenChange(false)
            return
        }
        if (event.key === 'Tab') {
            event.preventDefault()
            closeWithoutFocus()
            const trigger = internalTriggerRef.current
            if (trigger)
                focusAdjacentControl(
                    trigger,
                    contentRef.current,
                    event.shiftKey,
                )
            return
        }
        if (
            virtualized &&
            (!virtualNavigationRef.current ||
                pendingVirtualNavigationRef.current.length > 0) &&
            !event.ctrlKey &&
            !event.altKey &&
            !event.metaKey &&
            !event.nativeEvent.isComposing &&
            (event.target === searchInputRef.current &&
            pendingVirtualNavigationRef.current.length === 0
                ? ['ArrowDown', 'ArrowUp'].includes(event.key)
                : [
                      'ArrowDown',
                      'ArrowUp',
                      'Home',
                      'End',
                      'Enter',
                      ' ',
                  ].includes(event.key) ||
                  (!searchable && event.key.length === 1))
        ) {
            pendingVirtualNavigationRef.current.push({
                ...event,
                target:
                    event.target === searchInputRef.current &&
                    pendingVirtualNavigationRef.current.length > 0
                        ? (contentRef.current ?? event.target)
                        : event.target,
                defaultPrevented: false,
                preventDefault: () => undefined,
                stopPropagation: () => undefined,
            })
            event.preventDefault()
            event.stopPropagation()
            return
        }
        if (virtualized && virtualNavigationRef.current?.handleKeyDown(event))
            return
        if (event.ctrlKey || event.altKey || event.metaKey) return
        if (!virtualized && event.target !== searchInputRef.current) {
            const rows = Array.from(
                event.currentTarget.querySelectorAll<HTMLElement>(
                    '[role="option"]:not([data-disabled])',
                ),
            )
            const active = getActiveElement(event.currentTarget.ownerDocument)
            const index = rows.findIndex((row) => row === active)
            const key = event.key
            if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(key)) {
                event.preventDefault()
                event.stopPropagation()
                const nextIndex =
                    key === 'Home'
                        ? 0
                        : key === 'End'
                          ? rows.length - 1
                          : key === 'ArrowDown'
                            ? Math.min(rows.length - 1, index + 1)
                            : index < 0
                              ? rows.length - 1
                              : Math.max(0, index - 1)
                rows[nextIndex]?.focus({ preventScroll: true })
                const row = rows[nextIndex]
                if (row) scrollOptionIntoView(row, scrollRef.current)
                return
            }
            if (
                key === 'Enter' ||
                (key === ' ' &&
                    (searchable ||
                        !typeaheadRef.current.search ||
                        Date.now() - typeaheadRef.current.updatedAt >= 1000))
            ) {
                event.preventDefault()
                event.stopPropagation()
                const value = rows[index]?.dataset.optionKey
                if (value) handleValueChange(value)
                return
            }
            if (!searchable && key.length === 1) {
                const now = Date.now()
                const search =
                    (now - typeaheadRef.current.updatedAt < 1000
                        ? typeaheadRef.current.search
                        : '') + key
                typeaheadRef.current = { search, updatedAt: now }
                const current = rows[index]?.dataset.optionKey
                const next = findTypeaheadEntry(
                    filteredOptions,
                    current,
                    search,
                    isOptionDisabled,
                )
                if (next)
                    rows.find(
                        (row) => row.dataset.optionKey === next.radixValue,
                    )?.focus({ preventScroll: true })
                event.preventDefault()
                event.stopPropagation()
                return
            }
        }
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
                    option.focus({ preventScroll: true })
                    scrollOptionIntoView(option, scrollRef.current)
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

    useLayoutEffect(() => {
        if (!open || !focusedOptionValue.current || virtualized) return

        const document = contentRef.current?.ownerDocument
        const activeElement = document && getActiveElement(document)
        if (
            activeElement !== contentRef.current &&
            activeElement !== contentRef.current?.ownerDocument.body
        ) {
            return
        }

        const focusedValue = focusedOptionValue.current.value
        const isStillAvailable = optionEntries.some(({ option }) =>
            isOptionEqualToValue(option.value, focusedValue),
        )

        if (isStillAvailable) return

        if (searchable) {
            searchInputRef.current?.focus()
            return
        }

        const firstEnabledOption =
            contentRef.current?.querySelector<HTMLElement>(
                '[role="option"]:not([data-disabled])',
            )
        if (firstEnabledOption) {
            firstEnabledOption.focus()
        } else {
            closeAfterOptionRemoval()
        }
    }, [
        closeAfterOptionRemoval,
        virtualized,
        contentRef,
        isOptionEqualToValue,
        open,
        optionEntries,
        searchable,
        searchInputRef,
    ])

    const hasLeftIcon = Boolean(icon || hasError)
    const showClear =
        clearable && selectedValues.length > 0 && !disabled && !readOnly
    const describedBy = mergeAriaIds(
        ariaDescribedBy,
        description !== undefined && description !== null
            ? descriptionId
            : undefined,
        hasError ? errorId : undefined,
    )
    const labelledBy = mergeAriaIds(
        ariaLabelledBy,
        label !== undefined && label !== null ? labelId : undefined,
    )

    const isSelected = isValueSelected

    useLayoutEffect(() => {
        const nextVirtualized = Boolean(virtualized)
        const changed = previousVirtualized.current !== nextVirtualized
        previousVirtualized.current = nextVirtualized
        if (!open || !changed) return
        pendingVirtualNavigationRef.current = []

        const content = contentRef.current
        if (!content) return
        if (searchable) {
            searchInputRef.current?.focus({ preventScroll: true })
            return
        }
        const root = content.getRootNode()
        const activeElement =
            'activeElement' in root ? root.activeElement : null
        if (
            activeElement instanceof HTMLElement &&
            content.contains(activeElement) &&
            activeElement.getAttribute('role') === 'option'
        )
            return
        if (nextVirtualized) {
            // Focus the stable popup while its newly enabled module loads.
            // The virtual controller takes over after its rows mount.
            content.focus({ preventScroll: true })
            return
        }
        const focused = focusedOptionValue.current
        const index = filteredOptions.findIndex(
            ({ option }) =>
                !isOptionDisabled(option) &&
                (focused
                    ? isOptionEqualToValue(option.value, focused.value)
                    : isSelected(option.value)),
        )
        const rows = Array.from(
            content.querySelectorAll<HTMLElement>('[role="option"]'),
        )
        const target =
            rows[index] ??
            rows.find((row) => !row.hasAttribute('data-disabled'))
        const nextTarget = target ?? content
        nextTarget.focus({ preventScroll: true })
    }, [
        filteredOptions,
        isOptionDisabled,
        isOptionEqualToValue,
        isSelected,
        open,
        searchable,
        virtualized,
    ])

    const handleOptionPointerDown = useCallback(
        (event?: PointerEvent<HTMLDivElement>) => {
            pointerType.current = event?.pointerType ?? 'mouse'
            if (event?.pointerType === 'mouse') event.preventDefault()
        },
        [],
    )
    const handleOptionPointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            if (
                event.pointerType !== 'mouse' ||
                event.currentTarget.hasAttribute('data-disabled')
            )
                return
            event.currentTarget.focus({ preventScroll: true })
        },
        [],
    )
    const handleOptionPointerUp = useCallback(
        (event: PointerEvent<HTMLDivElement>, value: string) => {
            pointerType.current = event.pointerType
            if (
                event.pointerType === 'mouse' &&
                event.button === 0 &&
                !event.defaultPrevented
            )
                handleValueChange(value)
        },
        [handleValueChange],
    )
    const handleOptionClick = useCallback(
        (event: MouseEvent<HTMLDivElement>, value: string) => {
            if (
                !event.defaultPrevented &&
                (pointerType.current !== 'mouse' || event.detail === 0)
            )
                handleValueChange(value)
        },
        [handleValueChange],
    )
    const handleOptionFocus = useCallback(
        (optionValue: TValue, event?: FocusEvent<HTMLDivElement>) => {
            focusedOptionValue.current = { value: optionValue }
            event?.currentTarget.setAttribute('data-highlighted', '')
            if (event)
                scrollOptionIntoView(event.currentTarget, scrollRef.current)
        },
        [],
    )
    const handleOptionBlur = useCallback(
        (event: FocusEvent<HTMLDivElement>) => {
            event.currentTarget.removeAttribute('data-highlighted')
            const nextTarget = event.relatedTarget
            if (
                nextTarget === null ||
                nextTarget === event.currentTarget.ownerDocument.body ||
                (nextTarget instanceof Node &&
                    (contentRef.current?.contains(nextTarget) ||
                        rootRef.current?.contains(nextTarget)))
            )
                return
            focusedOptionValue.current = null
        },
        [],
    )
    const handleOptionKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>) => {
            const key = event.currentTarget.dataset.optionKey
            if (key && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault()
                handleValueChange(key)
            }
        },
        [handleValueChange],
    )
    const optionHandler = useMemo(
        () => ({
            handleOptionPointerDown,
            handleOptionPointerUp,
            handleOptionPointerMove,
            handleOptionClick,
            handleOptionFocus,
            handleOptionBlur,
            handleOptionKeyDown,
        }),
        [
            handleOptionPointerDown,
            handleOptionPointerUp,
            handleOptionPointerMove,
            handleOptionClick,
            handleOptionFocus,
            handleOptionBlur,
            handleOptionKeyDown,
        ],
    )
    function handleTriggerPointerDown(event: PointerEvent<HTMLButtonElement>) {
        if (readOnly) {
            event.preventDefault()
            event.currentTarget.focus()
        }
    }
    function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
        if (readOnly) {
            if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key))
                event.preventDefault()
            return
        }
        if (
            disabled ||
            open ||
            event.ctrlKey ||
            event.altKey ||
            event.metaKey ||
            event.nativeEvent.isComposing
        )
            return
        if (
            ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key) &&
            !(
                event.key === ' ' &&
                typeaheadRef.current.search &&
                Date.now() - typeaheadRef.current.updatedAt < 1000
            )
        ) {
            event.preventDefault()
            initialFocus.current = event.key === 'ArrowUp' ? 'last' : 'selected'
            handleOpenChange(true)
            return
        }
        if (event.key.length !== 1) return
        const now = Date.now()
        const previous =
            now - typeaheadRef.current.updatedAt < 1000
                ? typeaheadRef.current.search
                : ''
        if (event.key === ' ' && !previous) return
        typeaheadRef.current = { search: previous + event.key, updatedAt: now }
        const entry = findTypeaheadEntry(
            optionEntries,
            selectedRadixValue,
            typeaheadRef.current.search,
            isOptionDisabled,
        )
        event.preventDefault()
        event.stopPropagation()
        if (entry) handleSelectValue(entry.option.value)
    }
    function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
        setSearchValue(event.target.value)
    }
    function handleTriggerClick() {
        initialFocus.current = 'selected'
        handleOpenChange(!open)
    }
    return {
        refs: {
            root: rootRef,
            content: contentRef,
            trigger: composedTriggerRef,
            searchInput: searchInputRef,
            validationInput: validationInputRef,
            scroll: scrollRef,
            virtualNavigation: virtualNavigationRef,
            pendingVirtualNavigation: pendingVirtualNavigationRef,
        },
        state: {
            popupStyle,
            popupId: `${triggerId}-popup`,
            portalTarget,
            virtualOptionsModule,
            virtualized,
            controlSize,
            textOverflow,
            contentWidth,
            portalContainer,
            portalClassName,
            portalZIndex,
            name,
            required,
            disabled,
            readOnly,
            externalError,
            label,
            description,
            icon,
            placeholder,
            className,
            classNames,
            searchable,
            nonce,
            renderOption,
            renderValue,
            fallbackOption,
            multiple,
            omitEmptyFormValue,
            clearable,
            selectedValues,
            formEntries,
            ariaProps,
            ariaLabel,
            describedBy,
            labelledBy,
            showClear,
            isOptionDisabled,
            selectedOptions: renderedSelection.options,
            selectedLabel: renderedSelection.label,
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
            hasLeftIcon,
            isOptionEqualToValue,
            isValueSelected,
        },
        handler: {
            handleContentFocusCapture,
            handleVirtualClose,
            option: optionHandler,
            handleTriggerPointerDown,
            handleTriggerClick,
            handleTriggerKeyDown,
            handleSearchChange,
            handleSearchPointerDown,
            handleSearchKeyDown,
            handleFieldBlur,
            handleInvalid,
            handleValueChange,
            handleClear,
            handleOpenChange,
            closeAfterOptionRemoval,
            handleContentKeyDownCapture,
        },
    }
}
