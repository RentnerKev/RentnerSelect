export interface Option<TValue = string> {
    value: TValue
    label: string
    subOption?: string
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
