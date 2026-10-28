import { createElement, useCallback, useMemo, useState } from 'react'
import type { Option } from '../../../src/shared/Select/Types/select.types.ts'
import type { SelectOptimizationFixtureProps } from '../Types/selectOptimizationFixture.types.ts'

export function useSelectOptimizationFixtureLogic({
    count = 249,
    work = 1000,
    initialIndex,
    onRenderOption,
}: SelectOptimizationFixtureProps) {
    const options = useMemo(
        () =>
            Array.from({ length: count }, (_, index) => ({
                value: String(index),
                label: `Option ${String(index).padStart(5, '0')}`,
            })),
        [count],
    )
    const [values, setValues] = useState<string[]>(() =>
        initialIndex === undefined ? [] : [String(initialIndex)],
    )
    const renderOption = useCallback(
        (option: Option<string>) => {
            let checksum = 0
            for (let index = 0; index < work; index++)
                checksum = (checksum * 33 + index + option.label.length) >>> 0
            onRenderOption?.(option.value)
            return createElement(
                'span',
                { 'data-work': checksum },
                option.label,
            )
        },
        [work, onRenderOption],
    )
    const handleSingleValue = useCallback(
        (value: string) => setValues([value]),
        [],
    )
    return {
        state: { options, values },
        handler: {
            renderOption,
            handleMultipleValue: setValues,
            handleSingleValue,
        },
    }
}
