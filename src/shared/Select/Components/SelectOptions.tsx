import { memo } from 'react'
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events -- The owning popup captures keyboard navigation for its option collection. */
import { Check } from 'lucide-react'
import type { SelectOptionsProps } from '../Types/select.types.ts'

function SelectOptionsTemplate<TValue>({
    entries,
    isSelected,
    isOptionDisabled,
    renderOption,
    className,
    classNames,
    textOverflow,
    handler,
}: SelectOptionsProps<TValue>) {
    return (
        <>
            {entries.map(({ option, radixValue }) => {
                const selected = isSelected(option.value)
                const optionDisabled = isOptionDisabled(option)

                return (
                    <div
                        key={radixValue}
                        role="option"
                        tabIndex={-1}
                        data-option-key={radixValue}
                        aria-disabled={optionDisabled || undefined}
                        data-disabled={optionDisabled ? '' : undefined}
                        aria-selected={selected}
                        data-state={selected ? 'checked' : 'unchecked'}
                        onPointerDown={handler.handleOptionPointerDown}
                        onPointerMove={handler.handleOptionPointerMove}
                        onPointerUp={(event) =>
                            handler.handleOptionPointerUp?.(event, radixValue)
                        }
                        onClick={(event) =>
                            handler.handleOptionClick?.(event, radixValue)
                        }
                        onFocus={(event) =>
                            handler.handleOptionFocus(option.value, event)
                        }
                        onBlur={handler.handleOptionBlur}
                        className={`relative flex w-full cursor-pointer select-none items-center outline-none data-disabled:cursor-not-allowed data-disabled:opacity-40 ${className ?? 'min-h-11 rounded-lg py-2 pl-9 pr-3 text-sm font-medium tracking-normal normal-case text-select-foreground transition-colors focus:bg-select-hover focus:text-select-foreground data-[state=checked]:bg-select-hover'}`}
                    >
                        <span
                            className={`absolute left-3 flex items-center justify-center ${classNames.optionIndicator ?? 'h-3.5 w-3.5'}`}
                        >
                            {selected && (
                                <Check aria-hidden="true" className="h-4 w-4" />
                            )}
                        </span>
                        <span className="min-w-0 flex-1">
                            {renderOption ? (
                                renderOption(option, {
                                    selected,
                                    disabled: optionDisabled,
                                })
                            ) : (
                                <span className="flex min-w-0 flex-col gap-0.5">
                                    <span
                                        className={`${textOverflow === 'wrap' ? 'whitespace-normal break-words' : 'truncate'} ${classNames.optionLabel ?? 'leading-5'}`}
                                    >
                                        {option.label}
                                    </span>
                                    {option.subOption && (
                                        <span
                                            className={`${textOverflow === 'wrap' ? 'whitespace-normal break-words' : 'truncate'} ${classNames.optionDescription ?? 'text-xs leading-4 text-select-muted'}`}
                                        >
                                            {option.subOption}
                                        </span>
                                    )}
                                </span>
                            )}
                        </span>
                    </div>
                )
            })}
        </>
    )
}

export default memo(SelectOptionsTemplate) as typeof SelectOptionsTemplate
