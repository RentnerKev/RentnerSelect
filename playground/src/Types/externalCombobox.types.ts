export interface RemoteCustomer {
    id: string
    name: string
    detail: string
}
export interface ExternalComboboxFixtureLogicResult {
    state: {
        options: RemoteCustomer[]
        searchValue: string
        value: RemoteCustomer | null
        loading: boolean
        blurs: number
        getOptionKey: (option: RemoteCustomer) => string
        getOptionLabel: (option: RemoteCustomer) => string
        getOptionDescription: (option: RemoteCustomer) => string
        isOptionDisabled: (option: RemoteCustomer) => boolean
    }
    handler: {
        handleValueChange: (value: RemoteCustomer | null) => void
        handleBlur: () => void
        handleLoading: () => void
        handleEmpty: () => void
    }
    setter: { setSearchValue: (value: string) => void }
}
