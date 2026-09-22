import type { ReactElement } from 'react'
import SelectView from './Components/SelectView.js'
import { isSingleValueEmpty, toggleSelectedValue } from './selectValue.js'
import type {
    CustomSelectProps,
    MultipleSelectProps,
    SingleSelectProps,
} from './types.js'

type TypedCustomSelectProps<TValue> =
    | SingleSelectProps<TValue>
    | MultipleSelectProps<TValue>

function defaultGetFormValue(value: unknown) {
    return String(value)
}

function TypedCustomSelect<TValue>({
    value,
    onValueChange,
    multiple,
    getFormValue = defaultGetFormValue,
    ...viewProps
}: TypedCustomSelectProps<TValue>) {
    const isOptionEqualToValue = viewProps.isOptionEqualToValue ?? Object.is
    const multipleValues: ReadonlyArray<TValue> =
        multiple && Array.isArray(value) ? value : []
    const selectedValues: ReadonlyArray<TValue> = multiple
        ? multipleValues
        : isSingleValueEmpty(value)
          ? []
          : [value]
    const formEntries = selectedValues.map((selectedValue) => {
        const optionIndex = viewProps.options.findIndex((option) =>
            isOptionEqualToValue(option.value, selectedValue),
        )
        const formValue = getFormValue(selectedValue)

        return {
            key:
                optionIndex >= 0
                    ? `option-${optionIndex}`
                    : `${typeof selectedValue}-${formValue}`,
            value: formValue,
        }
    })

    function handleSelectValue(nextValue: TValue) {
        if (multiple) {
            const nextValues = toggleSelectedValue(
                multipleValues,
                nextValue,
                isOptionEqualToValue,
                viewProps.maxSelection,
            )

            if (nextValues) {
                onValueChange(nextValues)
            }
            return
        }

        onValueChange(nextValue)
    }

    return (
        <SelectView
            {...viewProps}
            selectedValues={selectedValues}
            formEntries={formEntries}
            multiple={multiple === true}
            onSelectValue={handleSelectValue}
        />
    )
}

export function CustomSelect<TValue = string>(
    props: SingleSelectProps<TValue>,
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
    return <TypedCustomSelect {...props} />
}
