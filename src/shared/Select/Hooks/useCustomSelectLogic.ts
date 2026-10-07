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
} from 'react'
import { resolveSelectMessages } from '../../../lib/Messages/i18n.js'
import type {
    Option,
    CustomSelectProps,
    CustomSelectLogicResult,
} from '../Types/select.types.js'
import { useSelectDefaults } from './useSelectContext.js'
import { mergeAriaIds } from '../../../lib/Field/selectField.js'
import { getOptionKey } from '../../../lib/Select/selectOptions.js'
import useSelectValues from './useSelectValues.js'
import useSelectOptionIdentity from './useSelectOptionIdentity.js'
import useComposedRefs from './useComposedRefs.js'

function handleSearchPointerDown(event: PointerEvent<HTMLInputElement>) {
    event.stopPropagation()
}

function handleSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Escape') event.stopPropagation()
}

export default function useCustomSelectLogic<TValue>(
    props: CustomSelectProps<TValue>,
): CustomSelectLogicResult<TValue> {
    const {
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
    const locale = providedLocale ?? defaults.locale ?? 'de'
    const searchable = providedSearchable ?? defaults.searchable ?? true
    const nonce = providedNonce ?? defaults.nonce
    const classNames = { ...defaults.classNames, ...providedClassNames }
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
    const interactionDisabled = disabled || readOnly
    const [previousInteractionDisabled, setPreviousInteractionDisabled] =
        useState(interactionDisabled)
    const [searchValue, setSearchValue] = useState('')
    const [isTouched, setIsTouched] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const rootRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const validationInputRef = useRef<HTMLInputElement>(null)
    const focusedOptionValue = useRef<{ value: TValue } | null>(null)
    const internalTriggerRef = useRef<HTMLButtonElement>(null)
    const shouldKeepOpen = useRef(false)
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
        handleSelectValue(entry.option.value)
    }

    function handleClear() {
        if (disabled || readOnly || selectedValues.length === 0) return
        handleClearValues()
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

    const closeAfterOptionRemoval = useCallback(() => {
        shouldKeepOpen.current = false
        setOpen(false)
        setSearchValue('')
    }, [])

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

    useLayoutEffect(() => {
        if (!open || !focusedOptionValue.current) return

        const activeElement = contentRef.current?.ownerDocument.activeElement
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
    const isOptionDisabled = useCallback(
        (option: Option<TValue>) => {
            return (
                option.disabled === true ||
                (multiple &&
                    maxSelection !== undefined &&
                    selectedValues.length >= maxSelection &&
                    !isSelected(option.value))
            )
        },
        [isSelected, maxSelection, multiple, selectedValues.length],
    )

    const handleOptionPointerDown = useCallback(() => {
        if (multiple) shouldKeepOpen.current = true
    }, [multiple])
    const handleOptionFocus = useCallback((optionValue: TValue) => {
        focusedOptionValue.current = { value: optionValue }
    }, [])
    const handleOptionBlur = useCallback(
        (event: FocusEvent<HTMLDivElement>) => {
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
            if (multiple && (event.key === 'Enter' || event.key === ' '))
                shouldKeepOpen.current = true
        },
        [multiple],
    )
    const optionHandler = useMemo(
        () => ({
            handleOptionPointerDown,
            handleOptionFocus,
            handleOptionBlur,
            handleOptionKeyDown,
        }),
        [
            handleOptionPointerDown,
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
        if (
            readOnly &&
            ['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)
        )
            event.preventDefault()
    }
    function handleSearchChange(event: ChangeEvent<HTMLInputElement>) {
        setSearchValue(event.target.value)
    }
    return {
        refs: {
            root: rootRef,
            content: contentRef,
            trigger: composedTriggerRef,
            searchInput: searchInputRef,
            validationInput: validationInputRef,
        },
        state: {
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
            option: optionHandler,
            handleTriggerPointerDown,
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
