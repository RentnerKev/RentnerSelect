// Virtual options use focusable divs for recycling; Select.Content captures keyboard navigation.
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events */
import { memo } from 'react'
import { Check } from 'lucide-react'
import useVirtualSelectOptionsLogic from '../Hooks/useVirtualSelectOptionsLogic.ts'
import type { VirtualSelectOptionsProps } from '../Types/virtualSelectOptions.types.ts'

function VirtualSelectOptionsTemplate<TValue>(
    props: VirtualSelectOptionsProps<TValue>,
) {
    const {
        entries,
        isSelected,
        isOptionDisabled,
        renderOption,
        className,
        classNames,
        textOverflow,
    } = props
    const { state, handler, refs, virtualizer } =
        useVirtualSelectOptionsLogic(props)

    return (
        <div
            className="relative grid w-full grid-rows-[0px]"
            style={{ height: state.totalSize }}
        >
            {state.items.map((item) => {
                const entry = entries[item.index]
                if (!entry) return null
                const { option, radixValue } = entry
                const selected = isSelected(option.value)
                const disabled = isOptionDisabled(option)
                return (
                    <div
                        key={radixValue}
                        ref={(element) => {
                            if (element)
                                refs.rows.current.set(radixValue, element)
                            else refs.rows.current.delete(radixValue)
                            virtualizer.measureElement(element)
                        }}
                        data-index={item.index}
                        role="option"
                        aria-posinset={item.index + 1}
                        aria-setsize={entries.length}
                        aria-selected={selected}
                        aria-disabled={disabled || undefined}
                        data-disabled={disabled ? '' : undefined}
                        data-highlighted={
                            state.activeRadixValue === radixValue
                                ? ''
                                : undefined
                        }
                        data-state={selected ? 'checked' : 'unchecked'}
                        tabIndex={-1}
                        onFocus={() => handler.handleRowFocus(radixValue)}
                        onBlur={props.handler.handleOptionBlur}
                        onPointerDown={handler.handleRowPointerDown}
                        onPointerMove={(event) =>
                            handler.handleRowPointerMove(event, radixValue)
                        }
                        onPointerUp={(event) =>
                            handler.handleRowPointerUp(event, radixValue)
                        }
                        onClick={(event) =>
                            handler.handleRowClick(event, radixValue)
                        }
                        className={`col-start-1 row-start-1 flex w-full self-start cursor-pointer select-none items-center outline-none data-disabled:cursor-not-allowed data-disabled:opacity-40 ${className ?? 'min-h-11 rounded-lg py-2 pl-9 pr-3 text-sm font-medium tracking-normal normal-case text-select-foreground transition-colors data-[highlighted]:bg-select-hover data-[highlighted]:text-select-foreground data-[state=checked]:bg-select-hover'}`}
                        style={{ transform: `translateY(${item.start}px)` }}
                    >
                        <span
                            className={`absolute left-3 flex items-center justify-center ${classNames.optionIndicator ?? 'h-3.5 w-3.5'}`}
                        >
                            {selected && <Check className="h-4 w-4" />}
                        </span>
                        <span className="min-w-0 flex-1">
                            {renderOption ? (
                                renderOption(option, { selected, disabled })
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
        </div>
    )
}

export default memo(
    VirtualSelectOptionsTemplate,
) as typeof VirtualSelectOptionsTemplate
