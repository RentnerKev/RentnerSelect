import { memo } from 'react'
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/click-events-have-key-events -- The owning popup captures keyboard navigation for its option collection. */
import SelectOptionContent from './SelectOptionContent.tsx'
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
                        <SelectOptionContent
                            option={option}
                            label={option.label}
                            subOption={option.subOption}
                            value={option.value}
                            selected={selected}
                            disabled={optionDisabled}
                            renderOption={renderOption}
                            classNames={classNames}
                            textOverflow={textOverflow}
                            indicatorAriaHidden
                        />
                    </div>
                )
            })}
        </>
    )
}

export default memo(SelectOptionsTemplate) as typeof SelectOptionsTemplate
