import * as SelectPrimitive from '@radix-ui/react-select'
import { CustomTooltip } from './Internal/Tooltip.js'
import { AlertCircle, Check, ChevronDown } from 'lucide-react'
import {
    useCallback,
    useEffect,
    useId,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import type { InvalidEvent, ReactElement } from 'react'
import { resolveSelectMessages } from './i18n.js'
import {
    isSingleValueEmpty,
    parseLegacyMultipleValue,
    toggleSelectedValue,
} from './selectValue.js'
import type {
    CustomSelectProps,
    LegacyMultipleSelectProps,
    MultipleSelectProps,
    SingleSelectProps,
} from './types.js'

type TypedCustomSelectProps<TValue> =
    | SingleSelectProps<TValue>
    | MultipleSelectProps<TValue>

type RuntimeCustomSelectProps<TValue> =
    | TypedCustomSelectProps<TValue>
    | LegacyMultipleSelectProps

type SelectViewProps<TValue> = Omit<
    SingleSelectProps<TValue>,
    'value' | 'onValueChange' | 'multiple' | 'getFormValue'
> & {
    selectedValues: ReadonlyArray<TValue>
    formEntries: ReadonlyArray<{ key: string; value: string }>
    multiple: boolean
    onSelectValue: (value: TValue) => void
}

function defaultGetFormValue(value: unknown) {
    return String(value)
}

function TypedCustomSelect<TValue>({
    value,
    onValueChange,
    multiple,
    getFormValue = defaultGetFormValue,
    ...viewProps
}: TypedCustomSelectProps<TValue>) {
    const isOptionEqualToValue = viewProps.isOptionEqualToValue ?? Object.is
    const multipleValues: ReadonlyArray<TValue> =
        multiple && Array.isArray(value) ? value : []
    const selectedValues: ReadonlyArray<TValue> = multiple
        ? multipleValues
        : isSingleValueEmpty(value)
          ? []
          : [value]
    const formEntries = selectedValues.map((selectedValue) => {
        const optionIndex = viewProps.options.findIndex((option) =>
            isOptionEqualToValue(option.value, selectedValue),
        )
        const formValue = getFormValue(selectedValue)

        return {
            key:
                optionIndex >= 0
                    ? `option-${optionIndex}`
                    : `${typeof selectedValue}-${formValue}`,
            value: formValue,
        }
    })

    function handleSelectValue(nextValue: TValue) {
        if (multiple) {
            const nextValues = toggleSelectedValue(
                multipleValues,
                nextValue,
                isOptionEqualToValue,
                viewProps.maxSelection,
            )

            if (nextValues) {
                onValueChange(nextValues)
            }
            return
        }

        onValueChange(nextValue)
    }

    return (
        <SelectView
            {...viewProps}
            selectedValues={selectedValues}
            formEntries={formEntries}
            multiple={multiple === true}
            onSelectValue={handleSelectValue}
        />
    )
}

function LegacyCustomSelect({
    value,
    onValueChange,
    multiple,
    getFormValue = defaultGetFormValue,
    ...viewProps
}: LegacyMultipleSelectProps) {
    const isOptionEqualToValue = viewProps.isOptionEqualToValue ?? Object.is
    const selectedValues = multiple
        ? parseLegacyMultipleValue(value)
        : isSingleValueEmpty(value)
          ? []
          : [value]

    function handleSelectValue(nextValue: string) {
        if (multiple) {
            const nextValues = toggleSelectedValue(
                selectedValues,
                nextValue,
                isOptionEqualToValue,
                viewProps.maxSelection,
            )

            if (nextValues) {
                onValueChange(nextValues.join(','))
            }
            return
        }

        onValueChange(nextValue)
    }

    return (
        <SelectView
            {...viewProps}
            selectedValues={selectedValues}
            formEntries={[
                {
                    key: 'legacy-value',
                    value: multiple ? value : getFormValue(value),
                },
            ]}
            multiple={multiple}
            onSelectValue={handleSelectValue}
        />
    )
}

function isLegacyMultipleSelect<TValue>(
    props: RuntimeCustomSelectProps<TValue>,
): props is LegacyMultipleSelectProps {
    return (
        typeof props.multiple === 'boolean' && typeof props.value === 'string'
    )
}

export function CustomSelect<TValue = string>(
    props: SingleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: MultipleSelectProps<TValue>,
): ReactElement
/**
 * @deprecated Übergib bei `multiple` ein Array. Das kommagetrennte
 * Stringformat wird in Version 2.0 entfernt.
 */
export function CustomSelect(props: LegacyMultipleSelectProps): ReactElement
export function CustomSelect<TValue = string>(
    props: CustomSelectProps<TValue>,
): ReactElement
export function CustomSelect(props: CustomSelectProps<string>): ReactElement
export function CustomSelect<TValue = string>(
    props: RuntimeCustomSelectProps<TValue>,
) {
    if (isLegacyMultipleSelect(props)) {
        return <LegacyCustomSelect {...props} />
    }

    return <TypedCustomSelect {...props} />
}

function mergeAriaIds(...values: Array<string | undefined>) {
    const ids = values.flatMap(
        (value) => value?.split(/\s+/).filter(Boolean) ?? [],
    )

    return [...new Set(ids)].join(' ') || undefined
}

function SelectView<TValue>({
    id,
    name,
    options,
    selectedValues,
    formEntries,
    onSelectValue,
    required = false,
    label,
    description,
    error: externalError,
    disabled = false,
    readOnly = false,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    triggerRef,
    icon,
    placeholder,
    className,
    fallbackOption,
    multiple = false,
    minSelection,
    maxSelection,
    locale = 'de',
    messages: providedMessages,
    isOptionEqualToValue: isOptionEqualToValueProp,
    ...ariaProps
}: SelectViewProps<TValue>) {
    const messages = resolveSelectMessages(locale, providedMessages)
    const [open, setOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [isTouched, setIsTouched] = useState(false)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const validationInputRef = useRef<HTMLInputElement>(null)
    const internalTriggerRef = useRef<HTMLButtonElement>(null)
    const shouldKeepOpen = useRef(false)

    const generatedId = useId()
    const triggerId = id ?? `select-${generatedId}`
    const labelId = `${triggerId}-label`
    const descriptionId = `${triggerId}-description`
    const errorId = `${triggerId}-error`
    const optionEntries = useMemo(
        () =>
            options.map((option, index) => ({
                option,
                radixValue: `option-${index}`,
            })),
        [options],
    )
    const labelledBy = mergeAriaIds(
        ariaLabelledBy,
        label !== undefined && label !== null ? labelId : undefined,
    )

    const setTriggerRef = useCallback(
        (node: HTMLButtonElement | null) => {
            internalTriggerRef.current = node

            if (typeof triggerRef === 'function') {
                triggerRef(node)
            }
        },
        [triggerRef],
    )

    useImperativeHandle(
        typeof triggerRef === 'object' ? triggerRef : null,
        () => internalTriggerRef.current as HTMLButtonElement,
    )

    const internalError = useMemo(() => {
        if (required && selectedValues.length === 0) {
            return messages.required
        }
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
        required,
        multiple,
        minSelection,
        maxSelection,
        selectedValues,
        messages,
    ])

    const resolvedError =
        externalError !== undefined ? externalError : internalError
    const hasError =
        externalError !== undefined
            ? Boolean(resolvedError)
            : isTouched && Boolean(resolvedError)
    const hasLeftIcon = Boolean(icon || hasError)

    const describedBy = mergeAriaIds(
        ariaDescribedBy,
        description !== undefined && description !== null
            ? descriptionId
            : undefined,
        hasError ? errorId : undefined,
    )

    const filteredOptions = useMemo(() => {
        const normalizedSearch = searchValue.trim().toLowerCase()

        if (!normalizedSearch) {
            return optionEntries
        }

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
    }, [optionEntries, searchValue])

    const isOptionEqualToValue = isOptionEqualToValueProp ?? Object.is
    const selectedEntries = useMemo(() => {
        return optionEntries.filter(({ option }) =>
            selectedValues.some((value) =>
                isOptionEqualToValue(option.value, value),
            ),
        )
    }, [isOptionEqualToValue, optionEntries, selectedValues])
    const selectedRadixValue = multiple
        ? ''
        : (selectedEntries[0]?.radixValue ?? '')

    function handleValueChange(nextRadixValue: string) {
        if (disabled || readOnly) {
            return
        }

        const entry = optionEntries.find(
            ({ radixValue }) => radixValue === nextRadixValue,
        )

        if (!entry) {
            return
        }

        if (!multiple) {
            setSearchValue('')
        }

        onSelectValue(entry.option.value)
    }

    function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
        event.preventDefault()
        setIsTouched(true)
        internalTriggerRef.current?.focus()
    }

    const focusSearchInput = useCallback(() => {
        requestAnimationFrame(() => searchInputRef.current?.focus())
        window.setTimeout(() => searchInputRef.current?.focus(), 0)
    }, [])

    useEffect(() => {
        if (open) {
            focusSearchInput()
        }
    }, [open, focusSearchInput])

    useEffect(() => {
        validationInputRef.current?.setCustomValidity(
            disabled ? '' : resolvedError || '',
        )
    }, [disabled, resolvedError])

    useEffect(() => {
        const input = validationInputRef.current
        const form = input?.form

        if (!input || !form) {
            return
        }

        const currentInput = input

        function handleFormSubmit() {
            if (currentInput.validity.valid) {
                setIsTouched(false)
            }
        }

        form.addEventListener('submit', handleFormSubmit)

        return () => {
            form.removeEventListener('submit', handleFormSubmit)
        }
    }, [])

    if ((disabled || readOnly) && open) {
        setOpen(false)
    }

    return (
        <SelectPrimitive.Root
            open={open && !disabled && !readOnly}
            onOpenChange={(nextOpen) => {
                if (disabled || readOnly) {
                    setOpen(false)
                    return
                }

                if (multiple && !nextOpen && shouldKeepOpen.current) {
                    shouldKeepOpen.current = false
                    return
                }
                setOpen(nextOpen)

                if (nextOpen) {
                    focusSearchInput()
                } else {
                    setSearchValue('')
                }
            }}
            value={selectedRadixValue}
            onValueChange={handleValueChange}
        >
            <div className="group relative">
                {label !== undefined && label !== null && (
                    <label
                        id={labelId}
                        htmlFor={triggerId}
                        className="mb-1 block text-sm font-medium text-gray-300"
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={validationInputRef}
                    name={name}
                    value={formEntries[0]?.value ?? ''}
                    onChange={() => undefined}
                    onInvalid={handleInvalid}
                    required={
                        required &&
                        selectedValues.length === 0 &&
                        !disabled &&
                        externalError === undefined
                    }
                    disabled={disabled}
                    readOnly={readOnly}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="pointer-events-none absolute left-0 top-1/2 h-px w-px -translate-y-1/2 opacity-0"
                />
                {multiple &&
                    formEntries
                        .slice(1)
                        .map((formEntry) => (
                            <input
                                key={formEntry.key}
                                type="hidden"
                                name={name}
                                value={formEntry.value}
                                disabled={disabled}
                                readOnly={readOnly}
                            />
                        ))}
                {hasLeftIcon && (
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 text-gray-500">
                        {hasError ? (
                            <CustomTooltip
                                content={resolvedError || ''}
                                side="bottom"
                            >
                                <AlertCircle className="h-4 w-4 text-red-500" />
                            </CustomTooltip>
                        ) : (
                            <span className="pointer-events-none flex items-center transition-colors group-focus-within:text-primary [&>svg]:h-4 [&>svg]:w-4">
                                {icon}
                            </span>
                        )}
                    </div>
                )}
                <SelectPrimitive.Trigger
                    ref={setTriggerRef}
                    id={triggerId}
                    disabled={disabled}
                    {...ariaProps}
                    aria-invalid={
                        hasError || ariaProps['aria-invalid'] || undefined
                    }
                    aria-required={
                        disabled
                            ? undefined
                            : externalError === undefined
                              ? required ||
                                ariaProps['aria-required'] ||
                                undefined
                              : ariaProps['aria-required']
                    }
                    aria-label={ariaLabel}
                    aria-labelledby={labelledBy}
                    aria-describedby={describedBy}
                    aria-errormessage={
                        hasError ? errorId : ariaProps['aria-errormessage']
                    }
                    aria-readonly={
                        readOnly || ariaProps['aria-readonly'] || undefined
                    }
                    aria-disabled={
                        disabled || ariaProps['aria-disabled'] || undefined
                    }
                    onPointerDown={(event) => {
                        if (readOnly) {
                            event.preventDefault()
                            event.currentTarget.focus()
                        }
                    }}
                    onKeyDown={(event) => {
                        if (
                            readOnly &&
                            (event.key === 'Enter' ||
                                event.key === ' ' ||
                                event.key === 'ArrowDown' ||
                                event.key === 'ArrowUp')
                        ) {
                            event.preventDefault()
                        }
                    }}
                    className={`bg-input-dark border text-[11px] text-gray-300 rounded-lg ${
                        hasLeftIcon ? 'pl-8' : 'pl-3'
                    } pr-8 py-2 outline-none w-full uppercase font-bold tracking-wider cursor-pointer flex items-center justify-between transition-colors min-w-45 disabled:cursor-not-allowed disabled:opacity-50 ${
                        hasError
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500/50 data-[state=open]:border-red-500'
                            : 'border-border-dark focus:border-primary data-[state=open]:border-primary'
                    } ${className || ''}`}
                >
                    <span className="min-w-0 flex-1 text-left">
                        {selectedEntries.length > 0 ? (
                            <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="truncate leading-4">
                                    {selectedEntries
                                        .map(({ option }) => option.label)
                                        .join(', ')}
                                </span>
                                {selectedEntries.length === 1 &&
                                    selectedEntries[0].option.subOption && (
                                        <span className="truncate text-[10px] font-semibold leading-3 tracking-normal text-gray-500 normal-case">
                                            {
                                                selectedEntries[0].option
                                                    .subOption
                                            }
                                        </span>
                                    )}
                            </span>
                        ) : (
                            <SelectPrimitive.Value placeholder={placeholder} />
                        )}
                    </span>
                    <SelectPrimitive.Icon asChild>
                        <ChevronDown className="h-4 w-4 opacity-50 absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
            </div>

            {description !== undefined && description !== null && (
                <div id={descriptionId} className="mt-1 text-xs text-gray-400">
                    {description}
                </div>
            )}

            {hasError && (
                <span id={errorId} className="sr-only">
                    {resolvedError}
                </span>
            )}

            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    position="popper"
                    sideOffset={4}
                    onFocusCapture={(event) => {
                        if (
                            event.target !== searchInputRef.current &&
                            searchInputRef.current
                        ) {
                            event.stopPropagation()
                            focusSearchInput()
                        }
                    }}
                    onKeyDownCapture={(event) => {
                        if (
                            event.target === searchInputRef.current ||
                            event.ctrlKey ||
                            event.altKey ||
                            event.metaKey ||
                            event.key.length !== 1
                        ) {
                            return
                        }

                        event.preventDefault()
                        event.stopPropagation()
                        setSearchValue((current) => `${current}${event.key}`)
                        focusSearchInput()
                    }}
                    className="z-9998 w-(--radix-select-trigger-width) min-w-45 overflow-hidden rounded-lg border border-border-dark bg-surface-dark shadow-xl animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                >
                    <div className="border-b border-border-dark p-1">
                        <input
                            ref={searchInputRef}
                            aria-label={messages.searchOptions}
                            value={searchValue}
                            onChange={(event) =>
                                setSearchValue(event.target.value)
                            }
                            onPointerDownCapture={(event) =>
                                event.stopPropagation()
                            }
                            onKeyDownCapture={(event) => {
                                if (event.key !== 'Escape') {
                                    event.stopPropagation()
                                }
                            }}
                            onKeyDown={(event) => {
                                if (event.key !== 'Escape') {
                                    event.stopPropagation()
                                }
                            }}
                            placeholder={messages.searchPlaceholder}
                            className="h-8 w-full rounded-md border border-border-dark bg-input-dark px-2 text-[11px] font-bold uppercase tracking-wider text-gray-300 outline-none placeholder:text-gray-500 focus:border-primary"
                        />
                    </div>
                    <div className="rentnerselect-scrollbar max-h-[min(var(--radix-select-content-available-height),16rem)] overflow-y-scroll scrollbar-gutter-stable">
                        <SelectPrimitive.Viewport className="p-1">
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(
                                    ({ option, radixValue }) => (
                                        <SelectPrimitive.Item
                                            key={radixValue}
                                            value={radixValue}
                                            onPointerDown={() => {
                                                if (multiple) {
                                                    shouldKeepOpen.current = true
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (
                                                    multiple &&
                                                    (e.key === 'Enter' ||
                                                        e.key === ' ')
                                                ) {
                                                    shouldKeepOpen.current = true
                                                }
                                            }}
                                            className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-[11px] font-bold uppercase tracking-wider text-gray-300 outline-none focus:bg-primary/20 focus:text-primary transition-colors data-disabled:opacity-50"
                                        >
                                            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                                                {multiple ? (
                                                    selectedValues.some(
                                                        (value) =>
                                                            isOptionEqualToValue(
                                                                option.value,
                                                                value,
                                                            ),
                                                    ) && (
                                                        <Check className="h-4 w-4" />
                                                    )
                                                ) : (
                                                    <SelectPrimitive.ItemIndicator>
                                                        <Check className="h-4 w-4" />
                                                    </SelectPrimitive.ItemIndicator>
                                                )}
                                            </span>
                                            <SelectPrimitive.ItemText>
                                                <span className="flex min-w-0 flex-col gap-0.5">
                                                    <span className="truncate leading-4">
                                                        {option.label}
                                                    </span>
                                                    {option.subOption && (
                                                        <span className="truncate text-[10px] font-semibold leading-3 tracking-normal text-gray-500 normal-case">
                                                            {option.subOption}
                                                        </span>
                                                    )}
                                                </span>
                                            </SelectPrimitive.ItemText>
                                        </SelectPrimitive.Item>
                                    ),
                                )
                            ) : (
                                <div className="relative flex w-full select-none items-center rounded-md py-2 pl-8 pr-2 text-[11px] font-bold uppercase tracking-wider text-gray-500 opacity-60 outline-none italic cursor-not-allowed">
                                    {searchValue.trim()
                                        ? messages.noResults
                                        : fallbackOption || messages.noOptions}
                                </div>
                            )}
                        </SelectPrimitive.Viewport>
                    </div>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    )
}
