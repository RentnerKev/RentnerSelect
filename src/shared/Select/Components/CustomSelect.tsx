import type { ReactElement } from 'react'
import SelectView from './SelectView.js'
import type {
    CustomSelectProps,
    ConfiguredClearableSingleSelectProps,
    DefaultSingleSelectProps,
    DirectClearableSingleSelectProps,
    LegacySingleSelectProps,
    MultipleSelectProps,
} from '../Types/select.types.js'

import useCustomSelectLogic from '../Hooks/useCustomSelectLogic.js'

export function CustomSelect<TValue = string>(
    props: LegacySingleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: DirectClearableSingleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: ConfiguredClearableSingleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: DefaultSingleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: MultipleSelectProps<TValue>,
): ReactElement
export function CustomSelect<TValue = string>(
    props: CustomSelectProps<TValue>,
): ReactElement
export function CustomSelect(props: CustomSelectProps<string>): ReactElement
export function CustomSelect<TValue = string>(
    props: CustomSelectProps<TValue>,
) {
    const { state, handler, refs } = useCustomSelectLogic(props)
    return <SelectView state={state} handler={handler} refs={refs} />
}
