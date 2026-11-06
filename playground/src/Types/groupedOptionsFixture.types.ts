import type { FormEvent } from 'react'
import type { Option } from '../../../src/shared/Select/Types/select.types.ts'

export interface GroupedOptionsFixtureLogicResult {
    state: {
        kind: string | null
        options: Array<Option<string>>
        value: Option<string> | null
        searchValue: string
        virtualized: boolean
        createdQuery: string
        submittedValue: string
        loading: boolean
        disabled: boolean
        readOnly: boolean
        local: boolean
    }
    handler: {
        handleValueChange: (value: Option<string> | null) => void
        handleSearchChange: (query: string) => void
        handleCreate: (query: string) => void
        handleAcceptCreation: () => void
        handleSubmit: (event: FormEvent<HTMLFormElement>) => void
        handleSelectChange: (value: string) => void
    }
}
