import { useCallback, useMemo } from 'react'
import type {
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

const EMPTY_ARRAY: ReadonlyArray<never> = []

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
    const needsIndex = multiple && isOptionEqualToValue === Object.is
    const optionIndex = useMemo(
        () => (needsIndex ? indexOptions(options) : null),
        [needsIndex, options],
    )

    const { selectedValues, matchedPositions } = useMemo(() => {
        const findPosition = (target: TValue) =>
            optionIndex
                ? (optionIndex.get(getOptionKey(target)) ?? -1)
                : options.findIndex((o) =>
                      isOptionEqualToValue(o.value, target),
                  )
        if (multiple) {
            if (!Array.isArray(value) || value.length === 0)
                return {
                    selectedValues: EMPTY_ARRAY,
                    matchedPositions: EMPTY_ARRAY,
                }
            const nextValues: TValue[] = []
            const positions: number[] = []
            for (const item of value) {
                const pos = findPosition(item)
                if (pos >= 0) {
                    nextValues.push(item)
                    positions.push(pos)
                }
            }
            return nextValues.length
                ? { selectedValues: nextValues, matchedPositions: positions }
                : { selectedValues: EMPTY_ARRAY, matchedPositions: EMPTY_ARRAY }
        }
        if (
            isSingleValueEmpty(value) ||
            (emptyValue !== undefined && Object.is(value, emptyValue))
        ) {
            return {
                selectedValues: EMPTY_ARRAY,
                matchedPositions: EMPTY_ARRAY,
            }
        }
        const pos = findPosition(value)
        return pos < 0
            ? { selectedValues: EMPTY_ARRAY, matchedPositions: EMPTY_ARRAY }
            : { selectedValues: [value], matchedPositions: [pos] }
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
            selectedValues.length === 0
                ? EMPTY_ARRAY
                : selectedValues.map((selectedValue, i) => {
                      const position = matchedPositions[i] ?? -1
                      const formValue = getFormValue(selectedValue)
                      return {
                          key:
                              position >= 0
                                  ? `option-${position}`
                                  : `${typeof selectedValue}-${formValue}`,
                          value: formValue,
                      }
                  }),
        [getFormValue, matchedPositions, selectedValues],
    )

    const handleSelectValue = useCallback(
        (nextValue: TValue) => {
            if (multiple) {
                const nextValues = toggleSelectedValue(
                    selectedValues,
                    nextValue,
                    isOptionEqualToValue,
                    maxSelection,
                )
                if (nextValues) onValueChange(nextValues)
                return
            }
            onValueChange(nextValue)
        },
        [
            multiple,
            selectedValues,
            isOptionEqualToValue,
            maxSelection,
            onValueChange,
        ],
    )

    const handleClearValues = useCallback(() => {
        if (onClear) {
            onClear()
            return
        }
        if (multiple) onValueChange([])
        else (onValueChange as (v: TValue | null) => void)(emptyValue ?? null)
    }, [onClear, multiple, onValueChange, emptyValue])

    return {
        state: { selectedValues, formEntries },
        handler: { handleSelectValue, handleClearValues },
    }
}
