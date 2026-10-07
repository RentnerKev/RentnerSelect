import { useState } from 'react'
import { reconcileOptionEntries } from '../../../lib/Select/selectOptions.js'
import type {
    Option,
    SelectOptionIdentityResult,
} from '../Types/select.types.js'

export default function useSelectOptionIdentity<TValue>(
    options: ReadonlyArray<Option<TValue>>,
    isOptionEqualToValue: (optionValue: TValue, value: TValue) => boolean,
): SelectOptionIdentityResult<TValue> {
    const [optionIdentity, setOptionIdentity] = useState(() => ({
        ...reconcileOptionEntries(
            options,
            { optionEntries: [], nextRadixValue: 0 },
            isOptionEqualToValue,
        ),
        options,
        isOptionEqualToValue,
    }))
    const identityIsCurrent =
        optionIdentity.options === options &&
        optionIdentity.isOptionEqualToValue === isOptionEqualToValue
    const optionEntriesResult = identityIsCurrent
        ? optionIdentity
        : {
              ...reconcileOptionEntries(
                  options,
                  optionIdentity,
                  isOptionEqualToValue,
              ),
              options,
              isOptionEqualToValue,
          }
    if (!identityIsCurrent) setOptionIdentity(optionEntriesResult)
    return { state: { optionEntries: optionEntriesResult.optionEntries } }
}
