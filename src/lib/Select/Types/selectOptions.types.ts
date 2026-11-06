export interface Option<TValue = string> {
    value: TValue
    label: string
    subOption?: string
    group?: string
    disabled?: boolean
}

export interface OptionEntry<TValue> {
    option: Option<TValue>
    radixValue: string
}

export interface OptionIdentity<TValue> {
    optionEntries: ReadonlyArray<OptionEntry<TValue>>
    nextRadixValue: number
}

export interface SelectOptionGroup<TEntry> {
    label: string | undefined
    entries: TEntry[]
}
