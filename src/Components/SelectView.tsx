import * as SelectPrimitive from '@radix-ui/react-select'
import { CustomTooltip } from '@rentnerkev/tooltips'
import { AlertCircle, Check, ChevronDown, X } from 'lucide-react'
import { useSelectDefaults } from '../SelectProvider.js'
import useSelectLogic from '../Hooks/useSelect.logic.js'
import type { SingleSelectProps } from '../types.js'

export type SelectViewProps<TValue> = Omit<
    SingleSelectProps<TValue>,
    'value' | 'onValueChange' | 'multiple' | 'getFormValue'
> & {
    selectedValues: ReadonlyArray<TValue>
    formEntries: ReadonlyArray<{ key: string; value: string }>
    multiple: boolean
    onSelectValue: (value: TValue) => void
    clearable?: boolean
    onClear?: () => void
}

function mergeAriaIds(...values: Array<string | undefined>) {
    const ids = values.flatMap(
        (value) => value?.split(/\s+/).filter(Boolean) ?? [],
    )

    return [...new Set(ids)].join(' ') || undefined
}

export default function SelectView<TValue>({
    id,
    name,
    options,
    selectedValues,
    formEntries,
    onSelectValue,
    clearable = false,
    onClear,
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
    multiple = false,
    minSelection,
    maxSelection,
    locale: providedLocale,
    messages: providedMessages,
    isOptionEqualToValue: isOptionEqualToValueProp,
    ...ariaProps
}: SelectViewProps<TValue>) {
    const defaults = useSelectDefaults()
    const locale = providedLocale ?? defaults.locale ?? 'de'
    const searchable = providedSearchable ?? defaults.searchable ?? true
    const nonce = providedNonce ?? defaults.nonce
    const classNames = { ...defaults.classNames, ...providedClassNames }
    const messages = { ...defaults.messages, ...providedMessages }
    const logic = useSelectLogic({
        id,
        options,
        selectedValues,
        multiple,
        required,
        externalError,
        disabled,
        readOnly,
        searchable,
        triggerRef,
        minSelection,
        maxSelection,
        locale,
        messages,
        isOptionEqualToValue: isOptionEqualToValueProp,
        onSelectValue,
        onClear,
    })
    const {
        triggerId,
        labelId,
        descriptionId,
        errorId,
        messages: resolvedMessages,
        open,
        searchValue,
        filteredOptions,
        selectedEntries,
        selectedRadixValue,
        hasError,
        resolvedError,
        isOptionEqualToValue,
    } = logic.state
    const { trigger, validationInput, searchInput } = logic.ref
    const {
        handleInvalid,
        handleValueChange,
        handleClear,
        handleOpenChange,
        handleContentKeyDownCapture,
        setSearchValue,
    } = logic.handler
    const { shouldKeepOpen } = logic.setter
    const hasLeftIcon = Boolean(icon || hasError)
    const showClear =
        clearable &&
        Boolean(onClear) &&
        selectedValues.length > 0 &&
        !disabled &&
        !readOnly
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

    return (
        <SelectPrimitive.Root
            open={open}
            onOpenChange={handleOpenChange}
            value={selectedRadixValue}
            onValueChange={handleValueChange}
        >
            <div className={`group relative ${classNames.root || ''}`}>
                {label !== undefined && label !== null && (
                    <label
                        id={labelId}
                        htmlFor={triggerId}
                        className={`mb-1 block text-sm font-medium text-select-foreground ${classNames.label || ''}`}
                    >
                        {label}
                    </label>
                )}
                <input
                    ref={validationInput}
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
                    <div className="absolute left-3 top-1/2 z-10 -translate-y-1/2 text-select-muted">
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
                    ref={trigger}
                    id={triggerId}
                    disabled={disabled}
                    onBlur={onBlur}
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
                    className={`box-border flex h-12 w-full min-w-0 cursor-pointer items-center justify-between gap-2 rounded-xl border bg-select-control ${showClear ? 'pr-17' : 'pr-9'} text-left text-sm font-medium tracking-normal normal-case text-select-foreground outline-none transition-[border-color,box-shadow,background-color] hover:border-select-border-strong focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${
                        hasLeftIcon ? 'pl-9' : 'pl-3'
                    } ${
                        hasError
                            ? 'border-red-500 focus-visible:ring-red-500/20 data-[state=open]:border-red-500'
                            : 'border-select-border focus-visible:border-select-accent focus-visible:ring-select-accent/20 data-[state=open]:border-select-accent'
                    } ${classNames.trigger || ''} ${className || ''}`}
                >
                    <span className="min-w-0 flex-1 text-left">
                        {selectedEntries.length > 0 ? (
                            <span className="flex min-w-0 flex-col gap-0.5">
                                {renderValue ? (
                                    renderValue(
                                        selectedEntries.map(
                                            ({ option }) => option,
                                        ),
                                    )
                                ) : (
                                    <>
                                        <span className="truncate leading-5">
                                            {selectedEntries
                                                .map(
                                                    ({ option }) =>
                                                        option.label,
                                                )
                                                .join(', ')}
                                        </span>
                                        {selectedEntries.length === 1 &&
                                            selectedEntries[0].option
                                                .subOption && (
                                                <span className="truncate text-xs leading-4 text-select-muted">
                                                    {
                                                        selectedEntries[0]
                                                            .option.subOption
                                                    }
                                                </span>
                                            )}
                                    </>
                                )}
                            </span>
                        ) : (
                            <SelectPrimitive.Value placeholder={placeholder} />
                        )}
                    </span>
                    <SelectPrimitive.Icon asChild>
                        <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-select-muted" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
                {showClear && (
                    <button
                        type="button"
                        aria-label={resolvedMessages.clearSelection}
                        onClick={handleClear}
                        className={`absolute right-8 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-select-muted transition-colors hover:text-select-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-select-accent motion-reduce:transition-none ${classNames.clear || ''}`}
                    >
                        <X aria-hidden="true" className="h-4 w-4" />
                    </button>
                )}
            </div>

            {description !== undefined && description !== null && (
                <div
                    id={descriptionId}
                    className={`mt-1 text-xs text-select-muted ${classNames.description || ''}`}
                >
                    {description}
                </div>
            )}

            {hasError && (
                <span id={errorId} className="sr-only" aria-live="polite">
                    {resolvedError}
                </span>
            )}

            <SelectPrimitive.Portal>
                <SelectPrimitive.Content
                    position="popper"
                    sideOffset={4}
                    onKeyDownCapture={handleContentKeyDownCapture}
                    className={`z-9998 w-(--radix-select-trigger-width) min-w-45 overflow-hidden rounded-xl border border-select-border bg-select-surface text-select-foreground shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${classNames.content || ''}`}
                >
                    {searchable && (
                        <div className="border-b border-select-border p-2">
                            <input
                                ref={searchInput}
                                aria-label={resolvedMessages.searchOptions}
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
                                placeholder={resolvedMessages.searchPlaceholder}
                                className={`h-10 w-full rounded-lg border border-select-border bg-select-control px-3 text-sm font-normal tracking-normal normal-case text-select-foreground placeholder:text-select-muted outline-none focus-visible:border-select-accent focus-visible:ring-2 focus-visible:ring-select-accent/20 ${classNames.search || ''}`}
                            />
                        </div>
                    )}
                    <div className="rentnerselect-scrollbar max-h-[min(var(--radix-select-content-available-height),16rem)] overflow-y-scroll scrollbar-gutter-stable">
                        <SelectPrimitive.Viewport
                            nonce={nonce}
                            className={`p-1.5 ${classNames.viewport || ''}`}
                        >
                            {filteredOptions.length > 0 ? (
                                filteredOptions.map(
                                    ({ option, radixValue }) => (
                                        <SelectPrimitive.Item
                                            key={radixValue}
                                            value={radixValue}
                                            textValue={option.label}
                                            disabled={option.disabled}
                                            onPointerDown={() => {
                                                if (multiple) {
                                                    shouldKeepOpen.current = true
                                                }
                                            }}
                                            onKeyDown={(event) => {
                                                if (
                                                    multiple &&
                                                    (event.key === 'Enter' ||
                                                        event.key === ' ')
                                                ) {
                                                    shouldKeepOpen.current = true
                                                }
                                            }}
                                            className={`relative flex min-h-11 w-full cursor-pointer select-none items-center rounded-lg py-2 pl-9 pr-3 text-sm font-medium tracking-normal normal-case text-select-foreground outline-none transition-colors data-[highlighted]:bg-select-hover data-[highlighted]:text-select-foreground data-[state=checked]:bg-select-hover data-disabled:cursor-not-allowed data-disabled:opacity-40 ${classNames.option || ''}`}
                                        >
                                            <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
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
                                                {renderOption ? (
                                                    renderOption(option, {
                                                        selected:
                                                            selectedValues.some(
                                                                (value) =>
                                                                    isOptionEqualToValue(
                                                                        option.value,
                                                                        value,
                                                                    ),
                                                            ),
                                                        disabled:
                                                            option.disabled ??
                                                            false,
                                                    })
                                                ) : (
                                                    <span className="flex min-w-0 flex-col gap-0.5">
                                                        <span className="truncate leading-5">
                                                            {option.label}
                                                        </span>
                                                        {option.subOption && (
                                                            <span className="truncate text-xs leading-4 text-select-muted">
                                                                {
                                                                    option.subOption
                                                                }
                                                            </span>
                                                        )}
                                                    </span>
                                                )}
                                            </SelectPrimitive.ItemText>
                                        </SelectPrimitive.Item>
                                    ),
                                )
                            ) : (
                                <div
                                    className={`relative flex w-full select-none items-center rounded-lg py-2 pl-9 pr-3 text-sm text-select-muted ${classNames.empty || ''}`}
                                >
                                    {searchable && searchValue.trim()
                                        ? resolvedMessages.noResults
                                        : fallbackOption ||
                                          resolvedMessages.noOptions}
                                </div>
                            )}
                        </SelectPrimitive.Viewport>
                    </div>
                </SelectPrimitive.Content>
            </SelectPrimitive.Portal>
        </SelectPrimitive.Root>
    )
}
