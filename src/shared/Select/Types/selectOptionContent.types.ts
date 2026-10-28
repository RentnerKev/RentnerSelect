import type { SelectOptionsProps } from './select.types.ts'
import type { Option } from '../../../lib/Select/Types/selectOptions.types.ts'

export interface SelectOptionContentProps<TValue> {
    option: Option<TValue>
    label: string
    subOption: string | undefined
    value: TValue
    selected: boolean
    disabled: boolean
    renderOption: SelectOptionsProps<TValue>['renderOption']
    classNames: SelectOptionsProps<TValue>['classNames']
    textOverflow: SelectOptionsProps<TValue>['textOverflow']
    indicatorAriaHidden?: true
}
