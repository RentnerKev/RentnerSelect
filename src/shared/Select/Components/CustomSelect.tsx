/* oxlint-disable jsx-a11y/prefer-tag-over-role -- A select-only combobox uses a native button to open its listbox or search dialog. */
import type { ReactElement } from 'react'
import { createPortal } from 'react-dom'
import { SelectErrorTooltip } from './SelectErrorTooltip.tsx'
import { AlertCircle, ChevronDown, X } from 'lucide-react'
import SelectOptions from './SelectOptions.tsx'

import type {
    CustomSelectProps,
    ConfiguredClearableSingleSelectProps,
    DefaultSingleSelectProps,
    DirectClearableSingleSelectProps,
    LegacySingleSelectProps,
    MultipleSelectProps,
} from '../Types/select.types.ts'

import useCustomSelectLogic from '../Hooks/useCustomSelectLogic.ts'

export function CustomSelect<TValue = string>(
    props: LegacySingleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: DirectClearableSingleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: ConfiguredClearableSingleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: DefaultSingleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: MultipleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: CustomSelectProps<TValue>,
): ReactElement
export function CustomSelect(props: CustomSelectProps<string>): ReactElement
export function CustomSelect<TValue = string>(
    props: CustomSelectProps<TValue>,
) {
    const { state, handler, refs } = useCustomSelectLogic(props)
    const VirtualSelectOptions = state.virtualOptionsModule?.default
    const {
        virtualized,
        controlSize,
        textOverflow,
        popupStyle,
        popupId,
        portalTarget,
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
        hasError,
        resolvedError,
        isValueSelected,
        hasLeftIcon,
    } = state
    const {
        root,
        content,
        trigger,
        validationInput,
        searchInput,
        scroll,
        virtualNavigation,
        pendingVirtualNavigation,
    } = refs
    const {
        option: optionHandler,
        handleContentFocusCapture,
        handleVirtualClose,
        handleFieldBlur,
        handleInvalid,
        handleValueChange,
        handleClear,
        handleContentKeyDownCapture,
        handleTriggerPointerDown,
        handleTriggerClick,
        handleTriggerKeyDown,
        handleSearchChange,
        handleSearchPointerDown,
        handleSearchKeyDown,
    } = handler
    return (
        <>
            <div
                ref={root}
                onBlurCapture={handleFieldBlur}
                className={`group relative ${classNames.root || ''}`}
            >
                {label !== undefined && label !== null && (
                    <label
                        id={labelId}
                        htmlFor={triggerId}
                        className={
                            classNames.label ??
                            'mb-1 block text-sm font-medium text-select-foreground'
                        }
                    >
                        {label}
                    </label>
                )}
                <div className={`relative ${classNames.control ?? ''}`}>
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
                        <div
                            className={`absolute left-3 top-1/2 z-10 -translate-y-1/2 ${classNames.leading ?? 'text-select-muted'}`}
                        >
                            {hasError ? (
                                <SelectErrorTooltip
                                    content={resolvedError || ''}
                                >
                                    <AlertCircle className="h-4 w-4 text-rentner-danger" />
                                </SelectErrorTooltip>
                            ) : (
                                <span className="pointer-events-none flex items-center transition-colors group-focus-within:text-primary [&>svg]:h-4 [&>svg]:w-4">
                                    {icon}
                                </span>
                            )}
                        </div>
                    )}
                    <button
                        type="button"
                        role="combobox"
                        ref={trigger}
                        aria-haspopup={searchable ? 'dialog' : 'listbox'}
                        aria-expanded={open}
                        aria-controls={open ? popupId : undefined}
                        data-state={open ? 'open' : 'closed'}
                        id={triggerId}
                        disabled={disabled}
                        {...ariaProps}
                        aria-invalid={
                            hasError || ariaProps['aria-invalid'] || undefined
                        }
                        aria-required={
                            disabled
                                ? undefined
                                : required || ariaProps['aria-required']
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
                        onClick={handleTriggerClick}
                        onKeyDown={handleTriggerKeyDown}
                        className={`box-border relative flex w-full min-w-0 items-center justify-between gap-2 outline-none disabled:cursor-not-allowed disabled:opacity-50 ${classNames.trigger ?? `cursor-pointer rounded-rentner-control border bg-select-control ${showClear ? 'pr-17' : 'pr-9'} text-left text-sm font-medium tracking-normal normal-case text-select-foreground transition-[border-color,box-shadow,background-color] hover:border-select-border-strong focus-visible:ring-[3px] motion-reduce:transition-none ${hasLeftIcon ? 'pl-9' : 'pl-3'} ${hasError ? 'border-rentner-danger focus-visible:ring-rentner-danger/20 data-[state=open]:border-rentner-danger' : 'border-select-border focus-visible:border-select-accent focus-visible:ring-select-accent/20 data-[state=open]:border-select-accent'}`} ${controlSize === 'sm' ? 'h-rentner-control-sm' : controlSize === 'md' ? 'h-rentner-control-md' : controlSize === 'lg' ? 'h-rentner-control-lg' : textOverflow === 'wrap' ? 'min-h-12 py-2' : 'h-12'} ${className || ''}`}
                    >
                        <span className="min-w-0 flex-1 text-left">
                            {selectedEntries.length > 0 ? (
                                <span className="flex min-w-0 flex-col gap-0.5">
                                    {renderValue ? (
                                        renderValue(selectedOptions)
                                    ) : (
                                        <>
                                            <span
                                                className={`${textOverflow === 'wrap' ? 'whitespace-normal break-words' : 'truncate'} ${classNames.selectedLabel ?? 'leading-5'}`}
                                            >
                                                {selectedLabel}
                                            </span>
                                            {selectedEntries.length === 1 &&
                                                selectedEntries[0].option
                                                    .subOption && (
                                                    <span
                                                        className={`${textOverflow === 'wrap' ? 'whitespace-normal break-words' : 'truncate'} ${classNames.selectedDescription ?? 'text-xs leading-4 text-select-muted'}`}
                                                    >
                                                        {
                                                            selectedEntries[0]
                                                                .option
                                                                .subOption
                                                        }
                                                    </span>
                                                )}
                                        </>
                                    )}
                                </span>
                            ) : (
                                <span data-placeholder="">{placeholder}</span>
                            )}
                        </span>
                        <ChevronDown
                            aria-hidden="true"
                            className={`absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 ${classNames.trailing ?? 'text-select-muted'}`}
                        />
                    </button>
                    {showClear && (
                        <button
                            type="button"
                            aria-label={resolvedMessages.clearSelection}
                            onClick={handleClear}
                            className={`absolute right-8 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center ${classNames.clear ?? 'h-8 w-8 rounded-md text-select-muted transition-colors hover:text-select-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-select-accent motion-reduce:transition-none'}`}
                        >
                            <X aria-hidden="true" className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {description !== undefined && description !== null && (
                <div
                    id={descriptionId}
                    className={
                        classNames.description ??
                        'mt-1 text-xs text-select-muted'
                    }
                >
                    {description}
                </div>
            )}

            {hasError && (
                <span
                    id={errorId}
                    className={classNames.error ?? 'sr-only'}
                    aria-live="polite"
                >
                    {resolvedError}
                </span>
            )}

            {open &&
                portalTarget &&
                createPortal(
                    <div className={portalClassName}>
                        <div
                            id={popupId}
                            ref={content}
                            tabIndex={-1}
                            data-state="open"
                            role={searchable ? 'dialog' : 'listbox'}
                            aria-label={
                                searchable
                                    ? resolvedMessages.searchOptions
                                    : ariaLabel
                            }
                            aria-labelledby={
                                searchable
                                    ? undefined
                                    : (labelledBy ?? triggerId)
                            }
                            aria-multiselectable={
                                !searchable && multiple ? true : undefined
                            }
                            onBlurCapture={handleFieldBlur}
                            onKeyDownCapture={handleContentKeyDownCapture}
                            onFocusCapture={handleContentFocusCapture}
                            style={{
                                ...popupStyle,
                                zIndex:
                                    portalZIndex ??
                                    'var(--rentner-overlay-z, 9998)',
                            }}
                            className={`flex flex-col overflow-hidden outline-none ${classNames.content ?? 'rounded-rentner-control border border-select-border bg-select-surface text-select-foreground shadow-xl motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95'}`}
                        >
                            {searchable && (
                                <div className="shrink-0 border-b border-select-border p-2">
                                    <input
                                        ref={searchInput}
                                        aria-label={
                                            resolvedMessages.searchOptions
                                        }
                                        value={searchValue}
                                        onChange={handleSearchChange}
                                        onPointerDownCapture={
                                            handleSearchPointerDown
                                        }
                                        onKeyDownCapture={handleSearchKeyDown}
                                        onKeyDown={handleSearchKeyDown}
                                        placeholder={
                                            resolvedMessages.searchPlaceholder
                                        }
                                        className={`w-full outline-none ${classNames.search ?? 'h-10 rounded-lg border border-select-border bg-select-control px-3 text-sm font-normal tracking-normal normal-case text-select-foreground placeholder:text-select-muted focus-visible:border-select-accent focus-visible:ring-2 focus-visible:ring-select-accent/20'}`}
                                    />
                                </div>
                            )}
                            <div
                                ref={scroll}
                                className="rentnerselect-scrollbar min-h-0 max-h-64 overflow-y-auto overscroll-contain scrollbar-gutter-stable"
                            >
                                <div
                                    data-rentner-select-viewport=""
                                    role={
                                        searchable ? 'listbox' : 'presentation'
                                    }
                                    aria-label={
                                        searchable
                                            ? resolvedMessages.searchOptions
                                            : undefined
                                    }
                                    aria-multiselectable={
                                        searchable && multiple
                                            ? true
                                            : undefined
                                    }
                                    className={classNames.viewport ?? 'p-1.5'}
                                >
                                    {virtualized ? (
                                        open &&
                                        (VirtualSelectOptions ? (
                                            <VirtualSelectOptions
                                                entries={filteredOptions}
                                                isSelected={isValueSelected}
                                                isOptionDisabled={
                                                    isOptionDisabled
                                                }
                                                multiple={multiple}
                                                renderOption={renderOption}
                                                className={classNames.option}
                                                classNames={classNames}
                                                textOverflow={textOverflow}
                                                handler={optionHandler}
                                                searchable={searchable}
                                                virtualization={virtualized}
                                                navigationRef={
                                                    virtualNavigation
                                                }
                                                pendingNavigationRef={
                                                    pendingVirtualNavigation
                                                }
                                                scrollRef={scroll}
                                                contentRef={content}
                                                searchInputRef={searchInput}
                                                onValueChange={
                                                    handleValueChange
                                                }
                                                onClose={handleVirtualClose}
                                            />
                                        ) : (
                                            <output className="p-3 text-sm text-select-muted">
                                                {resolvedMessages.loading}
                                            </output>
                                        ))
                                    ) : filteredOptions.length > 0 ? (
                                        <SelectOptions
                                            entries={filteredOptions}
                                            isSelected={isValueSelected}
                                            isOptionDisabled={isOptionDisabled}
                                            multiple={multiple}
                                            renderOption={renderOption}
                                            className={classNames.option}
                                            classNames={classNames}
                                            textOverflow={textOverflow}
                                            handler={optionHandler}
                                        />
                                    ) : null}
                                    {filteredOptions.length === 0 && (
                                        <div
                                            className={`relative flex w-full select-none items-center ${classNames.empty ?? 'rounded-lg py-2 pl-9 pr-3 text-sm text-select-muted'}`}
                                        >
                                            {searchable && searchValue.trim()
                                                ? resolvedMessages.noResults
                                                : fallbackOption ||
                                                  resolvedMessages.noOptions}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <style nonce={nonce}>
                            {
                                '[data-rentner-select-viewport]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch}[data-rentner-select-viewport]::-webkit-scrollbar{display:none}'
                            }
                        </style>
                    </div>,
                    portalTarget,
                )}
        </>
    )
}
