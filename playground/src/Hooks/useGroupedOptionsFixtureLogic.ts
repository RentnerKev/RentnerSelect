import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Option } from '../../../src/shared/Select/Types/select.types.ts'

import type { GroupedOptionsFixtureLogicResult } from '../Types/groupedOptionsFixture.types.ts'

export function useGroupedOptionsFixtureLogic(): GroupedOptionsFixtureLogicResult {
    const params = new URLSearchParams(location.search)
    const kind = params.get('grouped-options')
    const virtualized = params.has('virtual')
    const [options, setOptions] = useState<Array<Option<string>>>(() =>
        params.has('empty')
            ? []
            : Array.from({ length: virtualized ? 200 : 4 }, (_, index) => ({
                  value: String(index),
                  label: `Choice ${String(index).padStart(3, '0')}`,
                  group: index % 2 === 0 ? 'North' : 'South',
                  disabled: index === 2 || (virtualized && index === 199),
              })),
    )
    const [value, setValue] = useState<Option<string> | null>(
        () => options[0] ?? null,
    )
    const [searchValue, setSearchValue] = useState('')
    const [createdQuery, setCreatedQuery] = useState('')
    const [submittedValue, setSubmittedValue] = useState('')
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSubmittedValue(
            String(new FormData(event.currentTarget).get('choice') ?? ''),
        )
    }
    function handleAcceptCreation() {
        if (!createdQuery) return
        const option = {
            value: 'created-1',
            label: createdQuery,
            group: 'Created',
            disabled: false,
        }
        setOptions((current) => [...current, option])
        setValue(option)
        setSearchValue(option.label)
    }
    return {
        state: {
            kind,
            options,
            value,
            searchValue,
            virtualized,
            createdQuery,
            submittedValue,
            loading: params.has('loading'),
            disabled: params.has('disabled'),
            readOnly: params.has('readonly'),
            local: params.has('local'),
        },
        handler: {
            handleValueChange: setValue,
            handleSearchChange: setSearchValue,
            handleCreate: setCreatedQuery,
            handleAcceptCreation,
            handleSubmit,
            handleSelectChange: (next: string) =>
                setValue(
                    options.find((option) => option.value === next) ?? null,
                ),
        },
    }
}
