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
                        className={`relative flex min-h-11 w-full cursor-pointer select-none items-center rounded-lg py-2 pl-9 pr-3 text-sm font-medium tracking-normal normal-case text-select-foreground outline-none transition-colors data-[highlighted]:bg-select-hover data-[highlighted]:text-select-foreground data-[state=checked]:bg-select-hover data-disabled:cursor-not-allowed data-disabled:opacity-40 ${className || ''}`}
                    >
                        <span className="absolute left-3 flex h-3.5 w-3.5 items-center justify-center">
                            {multiple ? (
                                selected && <Check className="h-4 w-4" />
                            ) : (
                                <SelectPrimitive.ItemIndicator>
                                    <Check className="h-4 w-4" />
                                </SelectPrimitive.ItemIndicator>
                            )}
                        </span>
                        <SelectPrimitive.ItemText>
                            {renderOption ? (
                                renderOption(option, {
                                    selected,
                                    disabled: optionDisabled,
                                })
                            ) : (
                                <span className="flex min-w-0 flex-col gap-0.5">
                                    <span className="truncate leading-5">
                                        {option.label}
                                    </span>
                                    {option.subOption && (
                                        <span className="truncate text-xs leading-4 text-select-muted">
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
