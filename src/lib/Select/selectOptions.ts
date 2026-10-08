import type {
    OptionEntry,
    OptionIdentity,
} from './Types/selectOptions.types.ts'
import type { Option } from './Types/selectOptions.types.ts'

const negativeZero = Symbol('negative-zero')

// Map uses SameValueZero; Object.is additionally distinguishes signed zero.
export function getOptionKey(value: unknown): unknown {
    return Object.is(value, -0) ? negativeZero : value
}

export function reconcileOptionEntries<TValue>(
    options: ReadonlyArray<Option<TValue>>,
    previous: OptionIdentity<TValue>,
    isEqual: (left: TValue, right: TValue) => boolean,
): OptionIdentity<TValue> {
    let nextRadixValue = previous.nextRadixValue
    const queues = new Map<
        unknown,
        { entries: Array<OptionEntry<TValue>>; cursor: number }
    >()
    const used = new Set<number>()
    if (isEqual === Object.is) {
        for (const entry of previous.optionEntries) {
            const key = getOptionKey(entry.option.value)
            const queue = queues.get(key)
            if (queue) queue.entries.push(entry)
            else queues.set(key, { entries: [entry], cursor: 0 })
        }
    }
    const optionEntries = options.map((option) => {
        let prior: OptionEntry<TValue> | undefined
        if (isEqual === Object.is) {
            const queue = queues.get(getOptionKey(option.value))
            if (queue) prior = queue.entries[queue.cursor++]
        } else {
            const index = previous.optionEntries.findIndex(
                (entry, position) =>
                    !used.has(position) &&
                    isEqual(option.value, entry.option.value),
            )
            if (index >= 0) {
                used.add(index)
                prior = previous.optionEntries[index]
            }
        }
        if (prior?.option === option) return prior
        return {
            option,
            radixValue: prior?.radixValue ?? `option-${nextRadixValue++}`,
        }
    })
    return { optionEntries, nextRadixValue }
}

export function indexOptions<TValue>(options: ReadonlyArray<Option<TValue>>) {
    const index = new Map<unknown, number>()
    options.forEach((option, position) => {
        const key = getOptionKey(option.value)
        if (!index.has(key)) index.set(key, position)
    })
    return index
}
