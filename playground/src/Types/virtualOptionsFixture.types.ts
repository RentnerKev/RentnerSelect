import type { FormEvent } from 'react'
import type {
    Option,
    SelectCustomizationProps,
} from '../../../src/shared/Select/Types/select.types.ts'
export interface VirtualOptionsFixtureLogicResult {
    state: {
        kind: 'select' | 'combobox'
        shadow: boolean
        multiple: boolean
        searchable: boolean
        virtualized: SelectCustomizationProps['virtualized']
        contentWidth: 'trigger' | 'content'
        options: ReadonlyArray<Option<string>>
        selectedValues: Array<string>
        selectedOption: Option<string> | null
        searchValue: string
        portalContainer: HTMLDivElement | undefined
    }
    refs: { portalHost: (host: HTMLDivElement | null) => void }
    handler: {
        handleSingleChange: (value: string) => void
        handleMultipleChange: (value: Array<string>) => void
        handleComboboxChange: (value: Option<string> | null) => void
        handleSearchChange: (value: string) => void
        handleSubmit: (event: FormEvent<HTMLFormElement>) => void
    }
}
