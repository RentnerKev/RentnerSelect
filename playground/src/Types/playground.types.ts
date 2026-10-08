import type { Option } from '../../../src/shared/Select/Types/select.types.ts'
import type { FormEvent } from 'react'
import type {
    FormValidateOrFn,
    FormAsyncValidateOrFn,
    ReactFormExtendedApi,
} from '@tanstack/react-form'
import type { requiredValidator } from '../lib/Form/validation.ts'

export type PlaygroundFormValues = {
    firstName: string
    email: string
    department: Array<string>
    message: string
}

export type DynamicChoice = { id: string }
export type DynamicOptionsMode =
    | 'reorder'
    | 'remove-searchable'
    | 'remove-static'
    | 'remove-static-remaining'

export interface DynamicOptionsFixtureProps {
    mode: DynamicOptionsMode
}
export interface FieldErrorProps {
    errors: Array<unknown>
}
export interface PlaygroundRootLogicResult {
    state: { dynamicMode: DynamicOptionsMode | null }
}
type FormValidator = undefined | FormValidateOrFn<PlaygroundFormValues>
type AsyncFormValidator =
    | undefined
    | FormAsyncValidateOrFn<PlaygroundFormValues>
type FieldValidator = ReturnType<typeof requiredValidator>
export interface PlaygroundFieldValidators {
    firstName: { onSubmit: FieldValidator }
    email: { onSubmit: FieldValidator }
    department: { onBlur: FieldValidator }
    message: { onSubmit: FieldValidator }
}
export interface PlaygroundLogicResult {
    state: {
        submittedValues: PlaygroundFormValues | null
        fieldValidators: PlaygroundFieldValidators
    }
    handler: { handleSubmit: (event: FormEvent<HTMLFormElement>) => void }
    form: ReactFormExtendedApi<
        PlaygroundFormValues,
        FormValidator,
        FormValidator,
        AsyncFormValidator,
        FormValidator,
        AsyncFormValidator,
        FormValidator,
        AsyncFormValidator,
        FormValidator,
        AsyncFormValidator,
        AsyncFormValidator,
        unknown
    >
}
export interface DynamicOptionsLogicResult {
    state: {
        options: Array<Option<DynamicChoice>>
        value: Array<DynamicChoice>
        searchable: boolean
        isOptionEqualToValue: (
            optionValue: DynamicChoice,
            selectedValue: DynamicChoice,
        ) => boolean
    }
    handler: { handleValueChange: (nextValue: Array<DynamicChoice>) => void }
}
