import * as SelectPrimitive from '@radix-ui/react-select'
import { CustomTooltip } from '@rentnerkev/tooltips'
import { AlertCircle, ChevronDown, X } from 'lucide-react'
import SelectOptions from './SelectOptions.js'
import type { CustomSelectLogicResult } from '../Types/select.types.js'

export default function SelectView<TValue>({
    state,
    handler,
    refs,
}: CustomSelectLogicResult<TValue>) {
    const {
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
        selectedValues,
        formEntries,
        ariaProps,
        ariaLabel,
        describedBy,
        labelledBy,
        showClear,
        isOptionDisabled,
        selectedOptions,
        selectedLabel,
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
        isValueSelected,
        hasLeftIcon,
    } = state
    const { root, content, trigger, validationInput, searchInput } = refs
    const {
        option: optionHandler,
        handleFieldBlur,
        handleInvalid,
        handleValueChange,
        handleClear,
        handleOpenChange,
        handleContentKeyDownCapture,
        handleTriggerPointerDown,
        handleTriggerKeyDown,
        handleSearchChange,
        handleSearchPointerDown,
        handleSearchKeyDown,
    } = handler
    return (
        <SelectPrimitive.Root
            open={open}
            onOpenChange={handleOpenChange}
            value={selectedRadixValue}
            onValueChange={handleValueChange}
        >
            <div
                ref={root}
                onBlurCapture={handleFieldBlur}
                className={`group relative ${classNames.root || ''}`}
            >
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
                    name={
                        multiple &&
                        omitEmptyFormValue &&
                        formEntries.length === 0
                            ? undefined
                            : name
                    }
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
                    aria-haspopup={searchable ? 'dialog' : undefined}
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
                    onPointerDown={handleTriggerPointerDown}
                    onKeyDown={handleTriggerKeyDown}
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
                                    renderValue(selectedOptions)
                                ) : (
                                    <>
                                        <span className="truncate leading-5">
                                            {selectedLabel}
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
                    ref={content}
                    role={searchable ? 'dialog' : 'listbox'}
                    aria-label={
                        searchable ? resolvedMessages.searchOptions : ariaLabel
                    }
                    aria-labelledby={
                        searchable ? undefined : (labelledBy ?? triggerId)
                    }
                    aria-modal={searchable ? true : undefined}
                    aria-multiselectable={
                        !searchable && multiple ? true : undefined
                    }
                    onBlurCapture={handleFieldBlur}
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
                                onChange={handleSearchChange}
                                onPointerDownCapture={handleSearchPointerDown}
                                onKeyDownCapture={handleSearchKeyDown}
                                onKeyDown={handleSearchKeyDown}
                                placeholder={resolvedMessages.searchPlaceholder}
                                className={`h-10 w-full rounded-lg border border-select-border bg-select-control px-3 text-sm font-normal tracking-normal normal-case text-select-foreground placeholder:text-select-muted outline-none focus-visible:border-select-accent focus-visible:ring-2 focus-visible:ring-select-accent/20 ${classNames.search || ''}`}
                            />
                        </div>
                    )}
                    <div className="rentnerselect-scrollbar max-h-[min(var(--radix-select-content-available-height),16rem)] overflow-y-scroll scrollbar-gutter-stable">
                        <SelectPrimitive.Viewport
                            role={searchable ? 'listbox' : 'presentation'}
                            aria-label={
                                searchable
                                    ? resolvedMessages.searchOptions
                                    : undefined
                            }
                            aria-multiselectable={
                                searchable && multiple ? true : undefined
                            }
                            nonce={nonce}
                            className={`p-1.5 ${classNames.viewport || ''}`}
                        >
                            {filteredOptions.length > 0 ? (
                                <SelectOptions
                                    entries={filteredOptions}
                                    isSelected={isValueSelected}
                                    isOptionDisabled={isOptionDisabled}
                                    multiple={multiple}
                                    renderOption={renderOption}
                                    className={classNames.option}
                                    handler={optionHandler}
                                />
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
