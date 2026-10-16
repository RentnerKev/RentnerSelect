import { useState } from 'react'
import type {
    ExternalComboboxFixtureLogicResult,
    RemoteCustomer,
} from '../Types/externalCombobox.types.ts'
const customers: RemoteCustomer[] = [
    {
        id: 'a',
        name: 'Alba',
        detail: 'A very long customer description that wraps across several lines in a narrow popup.',
    },
    { id: 'b', name: 'Blocked', detail: 'Disabled' },
    { id: 'c', name: 'Charlie', detail: 'Available' },
]
function getOptionKey(option: RemoteCustomer) {
    return option.id
}
function getOptionLabel(option: RemoteCustomer) {
    return option.name
}
function getOptionDescription(option: RemoteCustomer) {
    return option.detail
}
function isOptionDisabled(option: RemoteCustomer) {
    return option.id === 'b'
}
export function useExternalComboboxFixtureLogic(): ExternalComboboxFixtureLogicResult {
    const [searchValue, setSearchValue] = useState('')
    const [value, setValue] = useState<RemoteCustomer | null>(null)
    const [loading, setLoading] = useState(false)
    const [empty, setEmpty] = useState(false)
    const [blurs, setBlurs] = useState(0)
    function handleValueChange(next: RemoteCustomer | null) {
        setValue(next)
        setSearchValue(next?.name ?? '')
    }
    function handleBlur() {
        setBlurs((current) => current + 1)
    }
    function handleLoading() {
        setLoading((current) => !current)
    }
    function handleEmpty() {
        setEmpty((current) => !current)
    }
    return {
        state: {
            options: empty ? [] : customers,
            searchValue,
            value,
            loading,
            blurs,
            getOptionKey,
            getOptionLabel,
            getOptionDescription,
            isOptionDisabled,
        },
        handler: { handleValueChange, handleBlur, handleLoading, handleEmpty },
        setter: { setSearchValue },
    }
}
