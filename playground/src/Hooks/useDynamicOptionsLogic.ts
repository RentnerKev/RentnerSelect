import { useState } from 'react'
import type { Option } from '../../../src/shared/Select/Types/select.types'
import type {
    DynamicChoice,
    DynamicOptionsMode,
} from '../Types/playground.types'

function isOptionEqualToValue(
    optionValue: DynamicChoice,
    selectedValue: DynamicChoice,
) {
    return optionValue.id === selectedValue.id
}

export function useDynamicOptionsLogic(mode: DynamicOptionsMode) {
    const [options, setOptions] = useState<Array<Option<DynamicChoice>>>([
        { value: { id: 'north' }, label: 'North' },
        { value: { id: 'south' }, label: 'South' },
    ])
    const [value, setValue] = useState<Array<DynamicChoice>>([])

    function handleValueChange(nextValue: Array<DynamicChoice>) {
        setValue(nextValue)
        if (mode === 'reorder') {
            setOptions((current) =>
                current.toReversed().map((option) => ({
                    label: option.label,
                    subOption: option.subOption,
                    disabled: option.disabled,
                    value: { id: option.value.id },
                })),
            )
        } else if (mode === 'remove-static-remaining') {
            const removedValue = nextValue.at(-1)
            setOptions((current) =>
                current.filter(
                    (option) => option.value.id !== removedValue?.id,
                ),
            )
        } else {
            setOptions([])
        }
    }
    return {
        state: {
            options,
            value,
            searchable:
                mode !== 'remove-static' && mode !== 'remove-static-remaining',
            isOptionEqualToValue,
        },
        handler: { handleValueChange },
    }
}
