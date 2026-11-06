import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Option } from '../../../src/shared/Select/Types/select.types.ts'
import type { SelectLocale } from '../../../src/lib/Messages/Types/i18n.types.ts'
import type { RemovableItemsFixtureLogicResult } from '../Types/removableItemsFixture.types.ts'

export function useRemovableItemsFixtureLogic(): RemovableItemsFixtureLogicResult {
    const params = new URLSearchParams(location.search)
    const localeParam = params.get('locale')
    const locale: SelectLocale =
        localeParam === 'de' || localeParam === 'es' || localeParam === 'fr'
            ? localeParam
            : 'en'
    const options: Array<Option<string>> = [
        {
            value: 'alpha,west',
            label: params.has('long')
                ? 'Alpha, a very long selected label that wraps onto several lines'
                : 'Alpha, West',
        },
        { value: 'beta', label: 'Beta' },
        { value: 'locked', label: 'Locked', disabled: true },
    ]
    const [value, setValue] = useState<Array<string>>(() =>
        params.has('one')
            ? ['alpha,west']
            : params.has('pinned')
              ? ['alpha,west', 'locked']
              : ['alpha,west', 'beta'],
    )
    const [changes, setChanges] = useState(0)
    const [blurCount, setBlurCount] = useState(0)
    const [focusedDuringChange, setFocusedDuringChange] = useState(false)
    const [submitted, setSubmitted] = useState<Array<string>>([])
    function handleValueChange(next: Array<string>) {
        setFocusedDuringChange(
            document.activeElement?.getAttribute('role') === 'combobox',
        )
        setChanges((count) => count + 1)
        setValue(next)
    }
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setSubmitted(
            new FormData(event.currentTarget).getAll('choice').map(String),
        )
    }
    return {
        state: {
            options,
            value,
            changes,
            blurCount,
            focusedDuringChange,
            submitted,
            locale,
            enabled: !params.has('default-off'),
            disabled: params.has('disabled'),
            readOnly: params.has('readonly'),
            custom: params.has('custom'),
            required: params.has('required'),
            override: params.has('override'),
        },
        handler: {
            handleValueChange,
            handleSubmit,
            handleBlur: () => setBlurCount((count) => count + 1),
        },
    }
}
