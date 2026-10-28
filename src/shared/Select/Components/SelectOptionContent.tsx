import { memo } from 'react'
import { Check } from 'lucide-react'
import type { SelectOptionContentProps } from '../Types/selectOptionContent.types.ts'

function SelectOptionContentTemplate<TValue>({
    option,
    label,
    subOption,
    selected,
    disabled,
    renderOption,
    classNames,
    textOverflow,
    indicatorAriaHidden,
}: SelectOptionContentProps<TValue>) {
    return (
        <>
            <span
                className={`absolute left-3 flex items-center justify-center ${classNames.optionIndicator ?? 'h-3.5 w-3.5'}`}
            >
                {selected && (
                    <Check
                        aria-hidden={indicatorAriaHidden}
                        className="h-4 w-4"
                    />
                )}
            </span>
            <span className="min-w-0 flex-1">
                {renderOption ? (
                    renderOption(option, { selected, disabled })
                ) : (
                    <span className="flex min-w-0 flex-col gap-0.5">
                        <span
                            className={`${textOverflow === 'wrap' ? 'whitespace-normal break-words' : 'truncate'} ${classNames.optionLabel ?? 'leading-5'}`}
                        >
                            {label}
                        </span>
                        {subOption && (
                            <span
                                className={`${textOverflow === 'wrap' ? 'whitespace-normal break-words' : 'truncate'} ${classNames.optionDescription ?? 'text-xs leading-4 text-select-muted'}`}
                            >
                                {subOption}
                            </span>
                        )}
                    </span>
                )}
            </span>
        </>
    )
}

// Event handlers stay on the live DOM shell. Only pure visual work is memoized,
// so descendant layout focus never depends on a parent's latest-handler ref.
export default memo(
    SelectOptionContentTemplate,
) as typeof SelectOptionContentTemplate
