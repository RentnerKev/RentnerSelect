import type { OptionEntry } from './selectOptions.types.ts'

export interface SelectNavigationPosition<TValue> {
    entry: OptionEntry<TValue>
    index: number
}

export interface SelectNavigationIndex<TValue> {
    positions: ReadonlyMap<string, SelectNavigationPosition<TValue>>
}
