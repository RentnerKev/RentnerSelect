import type {
    AriaAttributes,
    FocusEventHandler,
    ReactNode,
    Ref,
    RefObject,
    RefCallback,
    FocusEvent,
    KeyboardEvent,
    PointerEvent,
    ChangeEvent,
    InvalidEvent,
} from 'react'
import type {
    Option,
    OptionEntry,
} from '../../../lib/Select/Types/selectOptions.types.ts'
import type {
    SelectLocale,
    SelectMessages,
} from '../../../lib/Messages/Types/i18n.types.ts'

export type { Option } from '../../../lib/Select/Types/selectOptions.types.ts'
export interface SelectClassNames {
    root?: string
    trigger?: string
    content?: string
    search?: string
    viewport?: string
    option?: string
    empty?: string
    label?: string
    description?: string
    clear?: string
}

export interface SelectOptionState {
    selected: boolean
    disabled: boolean
}

interface SharedCustomSelectProps<TValue> extends AriaAttributes {
    id?: string
    name?: string
    options: ReadonlyArray<Option<TValue>>
    required?: boolean
    label?: ReactNode
    description?: ReactNode
    error?: string | null
    disabled?: boolean
    readOnly?: boolean
    triggerRef?: Ref<HTMLButtonElement>
    onBlur?: FocusEventHandler<HTMLDivElement>
    icon?: ReactNode
    placeholder?: string
    className?: string
    classNames?: SelectClassNames
    searchable?: boolean
    nonce?: string
    renderOption?: (
        option: Option<TValue>,
        state: SelectOptionState,
    ) => ReactNode
    renderValue?: (options: ReadonlyArray<Option<TValue>>) => ReactNode
    fallbackOption?: string
    locale?: SelectLocale
    messages?: Partial<SelectMessages>
    isOptionEqualToValue?: (optionValue: TValue, value: TValue) => boolean
    getFormValue?: (value: TValue) => string
}

type SingleSelectPropsBase<TValue> = SharedCustomSelectProps<TValue> & {
    value: TValue | null | undefined
    multiple?: false
}

type ClearableSelectProps =
    | { clearable: true; onClear?: () => void }
    | { clearable?: false; onClear?: never }

export type LegacySingleSelectProps<TValue = string> =
    SingleSelectPropsBase<TValue> & {
        clearable: true
        onClear: () => void
        emptyValue?: never
        onValueChange: (value: TValue) => void
    }

export type DirectClearableSingleSelectProps<TValue = string> =
    SingleSelectPropsBase<TValue> & {
        clearable: true
        onClear?: never
        emptyValue?: null
        onValueChange: (value: TValue | null) => void
    }

export type ConfiguredClearableSingleSelectProps<TValue = string> =
    SingleSelectPropsBase<TValue> & {
        clearable: true
        onClear?: never
        emptyValue: TValue
        onValueChange: (value: TValue) => void
    }

export type DefaultSingleSelectProps<TValue = string> =
    SingleSelectPropsBase<TValue> & {
        clearable?: false
        onClear?: never
        emptyValue?: never
        onValueChange: (value: TValue) => void
    }

export type SingleSelectProps<TValue = string> =
    | LegacySingleSelectProps<TValue>
    | DirectClearableSingleSelectProps<TValue>
    | ConfiguredClearableSingleSelectProps<TValue>
    | DefaultSingleSelectProps<TValue>

export type MultipleSelectProps<TValue = string> =
    SharedCustomSelectProps<TValue> &
        ClearableSelectProps & {
            value: ReadonlyArray<TValue>
            onValueChange: (value: Array<TValue>) => void
            multiple: true
            emptyValue?: never
            omitEmptyFormValue?: boolean
            minSelection?: number
            maxSelection?: number
        }

export type CustomSelectProps<TValue = string> =
    | SingleSelectProps<TValue>
    | MultipleSelectProps<TValue>

export type {
    SelectLocale,
    SelectMessages,
} from '../../../lib/Messages/Types/i18n.types.ts'

export interface SelectProviderProps {
    children: ReactNode
    locale?: SelectLocale
    messages?: Partial<SelectMessages>
    classNames?: SelectClassNames
    searchable?: boolean
    nonce?: string
}

export type SelectDefaults = Omit<SelectProviderProps, 'children'>

export interface SelectOptionHandlers<TValue> {
    handleOptionPointerDown: () => void
    handleOptionFocus: (value: TValue) => void
    handleOptionBlur: (event: FocusEvent<HTMLDivElement>) => void
    handleOptionKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
}

export interface SelectOptionsProps<TValue> {
    entries: ReadonlyArray<OptionEntry<TValue>>
    multiple: boolean
    renderOption: SharedCustomSelectProps<TValue>['renderOption']
    className: string | undefined
    isSelected: (value: TValue) => boolean
    isOptionDisabled: (option: Option<TValue>) => boolean
    handler: SelectOptionHandlers<TValue>
}

export interface CustomSelectLogicResult<TValue> {
    state: {
        name: string | undefined
        required: boolean
        disabled: boolean
        readOnly: boolean
        externalError: string | null | undefined
        label: ReactNode
        description: ReactNode
        icon: ReactNode
        placeholder: string | undefined
        className: string | undefined
        classNames: SelectClassNames
        searchable: boolean
        nonce: string | undefined
        renderOption: SharedCustomSelectProps<TValue>['renderOption']
        renderValue: SharedCustomSelectProps<TValue>['renderValue']
        fallbackOption: string | undefined
        multiple: boolean
        omitEmptyFormValue: boolean
        clearable: boolean
        selectedValues: ReadonlyArray<TValue>
        formEntries: ReadonlyArray<{ key: string; value: string }>
        ariaProps: AriaAttributes
        ariaLabel: string | undefined
        describedBy: string | undefined
        labelledBy: string | undefined
        showClear: boolean
        isOptionDisabled: (option: Option<TValue>) => boolean
        selectedOptions: ReadonlyArray<Option<TValue>>
        selectedLabel: string
        messages: SelectMessages
        triggerId: string
        labelId: string
        descriptionId: string
        errorId: string
        open: boolean
        searchValue: string
        optionEntries: ReadonlyArray<OptionEntry<TValue>>
        filteredOptions: ReadonlyArray<OptionEntry<TValue>>
        selectedEntries: ReadonlyArray<OptionEntry<TValue>>
        selectedRadixValue: string
        hasError: boolean
        resolvedError: string | null
        hasLeftIcon: boolean
        isOptionEqualToValue: (optionValue: TValue, value: TValue) => boolean
        isValueSelected: (value: TValue) => boolean
    }
    handler: {
        option: SelectOptionHandlers<TValue>
        handleTriggerPointerDown: (
            event: PointerEvent<HTMLButtonElement>,
        ) => void
        handleTriggerKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
        handleSearchChange: (event: ChangeEvent<HTMLInputElement>) => void
        handleSearchPointerDown: (event: PointerEvent<HTMLInputElement>) => void
        handleSearchKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
        handleFieldBlur: (event: FocusEvent<HTMLDivElement>) => void
        handleInvalid: (event: InvalidEvent<HTMLInputElement>) => void
        handleValueChange: (value: string) => void
        handleClear: () => void
        handleOpenChange: (open: boolean) => void
        closeAfterOptionRemoval: () => void
        handleContentKeyDownCapture: (
            event: KeyboardEvent<HTMLDivElement>,
        ) => void
    }
    refs: {
        root: RefObject<HTMLDivElement | null>
        content: RefObject<HTMLDivElement | null>
        trigger: RefCallback<HTMLButtonElement>
        searchInput: RefObject<HTMLInputElement | null>
        validationInput: RefObject<HTMLInputElement | null>
    }
}

export interface SelectProviderLogicResult {
    state: { contextValue: SelectDefaults }
}

type SelectValueKeys =
    | 'value'
    | 'onValueChange'
    | 'multiple'
    | 'options'
    | 'emptyValue'
    | 'onClear'
    | 'getFormValue'
    | 'isOptionEqualToValue'
export type SelectValueOptions<TValue> =
    | Pick<SingleSelectProps<TValue>, SelectValueKeys>
    | Pick<MultipleSelectProps<TValue>, SelectValueKeys | 'maxSelection'>

export interface SelectValuesResult<TValue> {
    state: {
        selectedValues: ReadonlyArray<TValue>
        formEntries: ReadonlyArray<{ key: string; value: string }>
    }
    handler: {
        handleSelectValue: (value: TValue) => void
        handleClearValues: () => void
    }
}

export interface SelectOptionIdentityResult<TValue> {
    state: { optionEntries: ReadonlyArray<OptionEntry<TValue>> }
}
