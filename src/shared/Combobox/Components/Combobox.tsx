/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events -- APG editable combobox uses a custom listbox; keyboard navigation remains on the input through aria-activedescendant. */
import { createPortal } from 'react-dom'
import ComboboxOption from './ComboboxOption.tsx'

export type { ComboboxProps } from '../Types/combobox.types.ts'
import type { ComboboxProps } from '../Types/combobox.types.ts'
import useComboboxLogic from '../Hooks/useComboboxLogic.ts'

export function Combobox<T>(props: ComboboxProps<T>) {
    const { state, handler, refs } = useComboboxLogic(props)
    const VirtualComboboxOptions = state.virtualOptionsModule?.default
    const { root, content, input, validation } = refs
    return (
        <div
            ref={root}
            onBlurCapture={handler.handleFieldBlur}
            className={
                'relative ' +
                (state.classNames.root ?? '') +
                ' ' +
                (props.className ?? '')
            }
        >
            {state.hasLabel && (
                <label
                    id={state.labelId}
                    htmlFor={state.inputId}
                    className={
                        state.classNames.label ??
                        'mb-1 block text-sm font-medium text-select-foreground'
                    }
                >
                    {props.label}
                </label>
            )}
            <div className={'relative ' + (state.classNames.control ?? '')}>
                <input
                    ref={input}
                    id={state.inputId}
                    role="combobox"
                    type="text"
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-expanded={state.open}
                    aria-controls={state.open ? state.listId : undefined}
                    aria-activedescendant={state.activeId}
                    aria-label={props['aria-label']}
                    aria-labelledby={state.labelledBy}
                    aria-describedby={state.describedBy}
                    aria-errormessage={
                        state.hasError
                            ? state.errorId
                            : props['aria-errormessage']
                    }
                    aria-invalid={
                        state.hasError || props['aria-invalid'] || undefined
                    }
                    aria-required={
                        props.disabled
                            ? undefined
                            : props.required || props['aria-required']
                    }
                    aria-readonly={props.readOnly || undefined}
                    aria-busy={props.loading || undefined}
                    disabled={props.disabled}
                    readOnly={props.readOnly}
                    value={props.searchValue}
                    onChange={handler.handleChange}
                    onFocus={handler.handleFocus}
                    onClick={handler.handleFocus}
                    onKeyDown={handler.handleKeyDown}
                    placeholder={
                        props.placeholder ?? state.messages.searchPlaceholder
                    }
                    className={
                        'box-border w-full min-w-0 outline-none disabled:cursor-not-allowed disabled:opacity-50 ' +
                        (state.classNames.search ??
                            state.classNames.trigger ??
                            'rounded-rentner-control border border-select-border bg-select-control pl-3 pr-10 text-sm text-select-foreground placeholder:text-select-muted focus-visible:border-select-accent focus-visible:ring-2 focus-visible:ring-select-accent/20 aria-invalid:border-rentner-danger aria-invalid:focus-visible:ring-rentner-danger') +
                        ' ' +
                        (state.controlSize === 'sm'
                            ? 'h-rentner-control-sm'
                            : state.controlSize === 'md'
                              ? 'h-rentner-control-md'
                              : state.controlSize === 'lg'
                                ? 'h-rentner-control-lg'
                                : 'h-12')
                    }
                />
                <input
                    ref={validation}
                    tabIndex={-1}
                    aria-hidden="true"
                    name={props.name}
                    value={state.formValue}
                    onChange={() => undefined}
                    required={
                        props.required &&
                        props.value === null &&
                        !props.disabled &&
                        !props.readOnly &&
                        props.error === undefined
                    }
                    disabled={props.disabled}
                    onInvalid={handler.handleInvalid}
                    className="pointer-events-none absolute left-0 top-1/2 h-px w-px opacity-0"
                />
                {state.showClear && (
                    <button
                        type="button"
                        aria-label={state.messages.clearSelection}
                        onMouseDown={handler.handleKeepFocus}
                        onClick={handler.handleClear}
                        className={
                            'absolute right-2 top-1/2 -translate-y-1/2 ' +
                            (state.classNames.clear ??
                                'flex h-8 w-8 items-center justify-center rounded text-select-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-select-accent')
                        }
                    >
                        <span aria-hidden="true">×</span>
                    </button>
                )}
            </div>
            {props.description !== undefined && props.description !== null && (
                <div
                    id={state.descriptionId}
                    className={
                        state.classNames.description ??
                        'mt-1 text-xs text-select-muted'
                    }
                >
                    {props.description}
                </div>
            )}
            {state.hasError && (
                <div
                    id={state.errorId}
                    aria-live="polite"
                    className={
                        state.classNames.error ??
                        'mt-1 text-xs text-rentner-danger'
                    }
                >
                    {state.error}
                </div>
            )}
            {state.open &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        role="region"
                        aria-label={state.messages.searchOptions}
                        className={state.portalClassName}
                    >
                        <div
                            ref={content}
                            style={state.popupStyle}
                            className={
                                (state.virtualization
                                    ? 'flex flex-col overflow-hidden '
                                    : 'overflow-y-auto ') +
                                (state.classNames.content ??
                                    'rounded-rentner-control border border-select-border bg-select-surface p-1.5 text-select-foreground shadow-xl')
                            }
                        >
                            {state.virtualization ? (
                                VirtualComboboxOptions ? (
                                    <VirtualComboboxOptions
                                        state={state}
                                        handler={handler}
                                        renderOption={props.renderOption}
                                        loading={props.loading}
                                        ariaLabel={
                                            props['aria-label'] ??
                                            state.messages.searchOptions
                                        }
                                    />
                                ) : (
                                    <div
                                        id={state.listId}
                                        role="listbox"
                                        aria-label={
                                            props['aria-label'] ??
                                            state.messages.searchOptions
                                        }
                                        aria-labelledby={state.labelledBy}
                                        aria-busy={props.loading || undefined}
                                    >
                                        {state.activeEntry && (
                                            <ComboboxOption
                                                entry={state.activeEntry}
                                                state={state}
                                                handler={handler}
                                                renderOption={
                                                    props.renderOption
                                                }
                                                index={state.activeIndex}
                                                setSize={state.entries.length}
                                            />
                                        )}
                                    </div>
                                )
                            ) : (
                                <div
                                    id={state.listId}
                                    role="listbox"
                                    aria-label={
                                        props['aria-label'] ??
                                        state.messages.searchOptions
                                    }
                                    aria-labelledby={state.labelledBy}
                                    aria-busy={props.loading || undefined}
                                    className={state.classNames.viewport}
                                >
                                    {!props.loading &&
                                        state.entries.map((entry) => (
                                            <ComboboxOption
                                                key={entry.key}
                                                entry={entry}
                                                state={state}
                                                handler={handler}
                                                renderOption={
                                                    props.renderOption
                                                }
                                            />
                                        ))}
                                </div>
                            )}
                            {(props.loading || state.entries.length === 0) && (
                                <output
                                    className={
                                        state.classNames.empty ??
                                        'px-3 py-2 text-sm text-select-muted'
                                    }
                                >
                                    {props.loading
                                        ? state.loadingText
                                        : state.emptyText}
                                </output>
                            )}
                        </div>
                    </div>,
                    state.portalContainer ?? document.body,
                )}
        </div>
    )
}
