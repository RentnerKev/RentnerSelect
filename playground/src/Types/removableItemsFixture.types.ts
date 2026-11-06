import type { FormEvent } from 'react'
import type { Option } from '../../../src/shared/Select/Types/select.types.ts'
import type { SelectLocale } from '../../../src/lib/Messages/Types/i18n.types.ts'

export interface RemovableItemsFixtureLogicResult {
    state: {
        options: Array<Option<string>>
        value: Array<string>
        changes: number
        blurCount: number
        focusedDuringChange: boolean
        submitted: Array<string>
        locale: SelectLocale
        enabled: boolean
        disabled: boolean
        readOnly: boolean
        custom: boolean
        required: boolean
        override: boolean
    }
    handler: {
        handleValueChange: (value: Array<string>) => void
        handleSubmit: (event: FormEvent<HTMLFormElement>) => void
        handleBlur: () => void
    }
}
