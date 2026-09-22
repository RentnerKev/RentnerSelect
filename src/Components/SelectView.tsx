import * as SelectPrimitive from '@radix-ui/react-select'
import { CustomTooltip } from '@rentnerkev/tooltips'
import { AlertCircle, Check, ChevronDown } from 'lucide-react'
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
    const logic = useSelectLogic({
        id,
        options,
        selectedValues,
        multiple,
        required,
        externalError,
        disabled,
        readOnly,
        triggerRef,
        minSelection,
        maxSelection,
        locale,
        messages: providedMessages,
        isOptionEqualToValue: isOptionEqualToValueProp,
        onSelectValue,
    })
    const {
        triggerId,
        labelId,
        descriptionId,
        errorId,
        messages,
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
        handleOpenChange,
        handleContentKeyDownCapture,
        setSearchValue,
    } = logic.handler
    const { shouldKeepOpen } = logic.setter
    const hasLeftIcon = Boolean(icon || hasError)
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
                    <div className="absolute left-2.5 top-1/2 z-10 -translate-y-1/2 text-gray-500">
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
                    } pr-8 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 w-full uppercase font-bold tracking-wider cursor-pointer flex items-center justify-between transition-colors min-w-45 disabled:cursor-not-allowed disabled:opacity-50 ${
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
                                        <span className="truncate text-[10px] font-semibold leading-3 tracking-normal text-gray-400 normal-case">
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
                        <ChevronDown className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>
            </div>

            {description !== undefined && description !== null && (
                <div id={descriptionId} className="mt-1 text-xs text-gray-400">
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
                    className="z-9998 w-(--radix-select-trigger-width) min-w-45 overflow-hidden rounded-lg border border-border-dark bg-surface-dark shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
                >
                    <div className="border-b border-border-dark p-1">
                        <input
                            ref={searchInput}
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
                            className="h-8 w-full rounded-md border border-border-dark bg-input-dark px-2 text-[11px] font-bold uppercase tracking-wider text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 placeholder:text-gray-500 focus:border-primary"
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
                                            onKeyDown={(event) => {
                                                if (
                                                    multiple &&
                                                    (event.key === 'Enter' ||
                                                        event.key === ' ')
                                                ) {
                                                    shouldKeepOpen.current = true
                                                }
                                            }}
                                            className="relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-[11px] font-bold uppercase tracking-wider text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus:bg-primary/20 focus:text-primary transition-colors data-disabled:opacity-50"
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
                                                        <span className="truncate text-[10px] font-semibold leading-3 tracking-normal text-gray-400 normal-case">
                                                            {option.subOption}
                                                        </span>
                                                    )}
                                                </span>
                                            </SelectPrimitive.ItemText>
                                        </SelectPrimitive.Item>
                                    ),
                                )
                            ) : (
                                <div className="relative flex w-full select-none items-center rounded-md py-2 pl-8 pr-2 text-[11px] font-bold uppercase tracking-wider text-gray-400 opacity-60 outline-none italic cursor-not-allowed">
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
