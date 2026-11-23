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
    const prev = previous.optionEntries
    if (prev.length === 0) {
        return {
            optionEntries: options.map((option) => ({
                option,
                radixValue: `option-${nextRadixValue++}`,
            })),
            nextRadixValue,
        }
    }
    const slots =
        isEqual === Object.is
            ? new Map<
                  unknown,
                  | OptionEntry<TValue>
                  | { entries: Array<OptionEntry<TValue>>; cursor: number }
              >()
            : null
    if (slots) {
        for (const entry of prev) {
            const key = getOptionKey(entry.option.value)
            const slot = slots.get(key)
            if (!slot) slots.set(key, entry)
            else if ('radixValue' in slot)
                slots.set(key, { entries: [slot, entry], cursor: 0 })
            else slot.entries.push(entry)
        }
    }
    const used = slots ? null : new Uint8Array(prev.length)
    let firstUnused = 0
    const optionEntries = options.map((option) => {
        let prior: OptionEntry<TValue> | undefined
        if (slots) {
            const key = getOptionKey(option.value)
            const slot = slots.get(key)
            if (slot) {
                if ('radixValue' in slot) {
                    prior = slot
                    slots.delete(key)
                } else prior = slot.entries[slot.cursor++]
            }
        } else {
            for (let j = firstUnused; j < prev.length; j += 1) {
                if (used![j] || !isEqual(option.value, prev[j]!.option.value))
                    continue
                used![j] = 1
                prior = prev[j]
                if (j === firstUnused) {
                    while (firstUnused < prev.length && used![firstUnused])
                        firstUnused += 1
                }
                break
            }
        }
        return prior?.option === option
            ? prior
            : {
                  option,
                  radixValue: prior?.radixValue ?? `option-${nextRadixValue++}`,
              }
    })
    return { optionEntries, nextRadixValue }
}

export function indexOptions<TValue>(options: ReadonlyArray<Option<TValue>>) {
    const index = new Map<unknown, number>()
    for (let i = 0; i < options.length; i += 1) {
        const key = getOptionKey(options[i]!.value)
        if (!index.has(key)) index.set(key, i)
    }
    return index
}
