import { memo } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check } from 'lucide-react'
import type { SelectOptionsProps } from '../Types/select.types.ts'

function SelectOptionsTemplate<TValue>({
    entries,
    isSelected,
    isOptionDisabled,
    multiple,
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
                    <SelectPrimitive.Item
                        key={radixValue}
                        value={radixValue}
                        textValue={option.label}
                        disabled={optionDisabled}
                        aria-selected={selected}
                        data-state={selected ? 'checked' : 'unchecked'}
                        onPointerDown={handler.handleOptionPointerDown}
                        onFocus={() => handler.handleOptionFocus(option.value)}
                        onBlur={handler.handleOptionBlur}
                        onKeyDown={handler.handleOptionKeyDown}
                        className={`relative flex w-full cursor-pointer select-none items-center outline-none data-disabled:cursor-not-allowed data-disabled:opacity-40 ${className ?? 'min-h-11 rounded-lg py-2 pl-9 pr-3 text-sm font-medium tracking-normal normal-case text-select-foreground transition-colors data-[highlighted]:bg-select-hover data-[highlighted]:text-select-foreground data-[state=checked]:bg-select-hover'}`}
                    >
                        <span
                            className={`absolute left-3 flex items-center justify-center ${classNames.optionIndicator ?? 'h-3.5 w-3.5'}`}
                        >
                            {multiple ? (
                                selected && <Check className="h-4 w-4" />
                            ) : (
                                <SelectPrimitive.ItemIndicator>
                                    <Check className="h-4 w-4" />
                                </SelectPrimitive.ItemIndicator>
                            )}
                        </span>
                        <SelectPrimitive.ItemText className="min-w-0 flex-1">
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
                        </SelectPrimitive.ItemText>
                    </SelectPrimitive.Item>
                )
            })}
        </>
    )
}

export default memo(SelectOptionsTemplate) as typeof SelectOptionsTemplate
