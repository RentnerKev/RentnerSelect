export type SelectValueComparator<TValue> = (
    optionValue: TValue,
    value: TValue,
) => boolean

export function isSingleValueEmpty(
    value: unknown,
): value is '' | null | undefined {
    return value === null || value === undefined || value === ''
}

export function parseLegacyMultipleValue(value: string): Array<string> {
    return value ? value.split(',') : []
}

export function toggleSelectedValue<TValue>(
    selectedValues: ReadonlyArray<TValue>,
    nextValue: TValue,
    isEqual: SelectValueComparator<TValue>,
    maxSelection?: number,
): Array<TValue> | null {
    const selectedIndex = selectedValues.findIndex((value) =>
        isEqual(nextValue, value),
    )

    if (selectedIndex >= 0) {
        return selectedValues.filter((value) => !isEqual(nextValue, value))
    }

    if (maxSelection !== undefined && selectedValues.length >= maxSelection) {
        return null
    }

    return [...selectedValues, nextValue]
}
