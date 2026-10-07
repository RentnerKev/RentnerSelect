import type { Option } from '../../../shared/Select/Types/select.types.js'

export interface OptionEntry<TValue> {
    option: Option<TValue>
    radixValue: string
}

export interface OptionIdentity<TValue> {
    optionEntries: ReadonlyArray<OptionEntry<TValue>>
    nextRadixValue: number
}
