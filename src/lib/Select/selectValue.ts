import type { SelectValueComparator } from './Types/selectValue.types.ts'
export type { SelectValueComparator } from './Types/selectValue.types.ts'

export function isSingleValueEmpty(
    value: unknown,
): value is '' | null | undefined {
    return value === null || value === undefined || value === ''
}

export function toggleSelectedValue<TValue>(
    selectedValues: ReadonlyArray<TValue>,
    nextValue: TValue,
    isEqual: SelectValueComparator<TValue>,
    maxSelection?: number,
): Array<TValue> | null {
    const len = selectedValues.length
    let selectedIndex = -1
    for (let i = 0; i < len; i += 1) {
        if (isEqual(nextValue, selectedValues[i]!)) {
            selectedIndex = i
            break
        }
    }

    if (selectedIndex >= 0) {
        const result = selectedValues.slice(0, selectedIndex)
        for (let i = selectedIndex + 1; i < len; i += 1) {
            const candidate = selectedValues[i]!
            if (!isEqual(nextValue, candidate)) result.push(candidate)
        }
        return result
    }

    if (maxSelection !== undefined && len >= maxSelection) {
        return null
    }

    return [...selectedValues, nextValue]
}
