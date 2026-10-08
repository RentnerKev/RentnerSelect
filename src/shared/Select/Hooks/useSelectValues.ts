import { useMemo } from 'react'
import type {
    Option,
    SelectValueOptions,
    SelectValuesResult,
} from '../Types/select.types.ts'
import {
    getOptionKey,
    indexOptions,
} from '../../../lib/Select/selectOptions.ts'
import {
    isSingleValueEmpty,
    toggleSelectedValue,
} from '../../../lib/Select/selectValue.ts'

function defaultGetFormValue(value: unknown) {
    return String(value)
}

export default function useSelectValues<TValue>({
    value,
    onValueChange,
    multiple,
    options,
    emptyValue,
    onClear,
    getFormValue = defaultGetFormValue,
    isOptionEqualToValue = Object.is,
    ...rest
}: SelectValueOptions<TValue>): SelectValuesResult<TValue> {
    const maxSelection = 'maxSelection' in rest ? rest.maxSelection : undefined
    const optionIndex = useMemo(() => indexOptions(options), [options])
    const selectedValues = useMemo<ReadonlyArray<TValue>>(() => {
        const isAvailableValue = (selectedValue: TValue) =>
            isOptionEqualToValue === Object.is
                ? optionIndex.has(getOptionKey(selectedValue))
                : options.some((option: Option<TValue>) =>
                      isOptionEqualToValue(option.value, selectedValue),
                  )
        if (multiple)
            return Array.isArray(value) ? value.filter(isAvailableValue) : []
        return isSingleValueEmpty(value) ||
            (emptyValue !== undefined && Object.is(value, emptyValue)) ||
            !isAvailableValue(value)
            ? []
            : [value]
    }, [
        emptyValue,
        isOptionEqualToValue,
        multiple,
        optionIndex,
        value,
        options,
    ])
    const formEntries = useMemo(
        () =>
            selectedValues.map((selectedValue) => {
                const position =
                    isOptionEqualToValue === Object.is
                        ? (optionIndex.get(getOptionKey(selectedValue)) ?? -1)
                        : options.findIndex((option: Option<TValue>) =>
                              isOptionEqualToValue(option.value, selectedValue),
                          )
                const formValue = getFormValue(selectedValue)
                return {
                    key:
                        position >= 0
                            ? `option-${position}`
                            : `${typeof selectedValue}-${formValue}`,
                    value: formValue,
                }
            }),
        [
            getFormValue,
            isOptionEqualToValue,
            optionIndex,
            selectedValues,
            options,
        ],
    )
    function handleSelectValue(nextValue: TValue) {
        if (multiple) {
            const nextValues = toggleSelectedValue(
                selectedValues,
                nextValue,
                isOptionEqualToValue,
                maxSelection,
            )

            if (nextValues) {
                onValueChange(nextValues)
            }
            return
        }

        onValueChange(nextValue)
    }

    function handleClearValues() {
        const legacyOnClear = onClear
        if (legacyOnClear) {
            legacyOnClear()
            return
        }

        if (multiple) {
            onValueChange([])
        } else {
            const clearSingleValue = onValueChange as (
                value: TValue | null,
            ) => void
            clearSingleValue(emptyValue ?? null)
        }
    }

    return {
        state: { selectedValues, formEntries },
        handler: { handleSelectValue, handleClearValues },
    }
}
