import type { ReactVirtualizer, VirtualItem } from '@tanstack/react-virtual'
import type {
    AriaAttributes,
    ChangeEvent,
    CSSProperties,
    FocusEvent,
    KeyboardEvent,
    InvalidEvent,
    MouseEvent,
    ReactNode,
    Ref,
    RefCallback,
    RefObject,
} from 'react'
import type {
    SelectClassNames,
    SelectCustomizationProps,
    SelectLocale,
    SelectMessages,
    SelectVirtualizationOptions,
} from '../../Select/Types/select.types.ts'
export interface ComboboxProps<T>
    extends AriaAttributes, SelectCustomizationProps {
    options: ReadonlyArray<T>
    value: T | null
    onValueChange: (value: T | null) => void
    searchValue: string
    onSearchValueChange: (value: string) => void
    getOptionKey: (option: T) => string
    getOptionLabel: (option: T) => string
    getOptionDescription?: (option: T) => ReactNode
    isOptionDisabled?: (option: T) => boolean
    isOptionEqualToValue?: (option: T, value: T) => boolean
    renderOption?: (
        option: T,
        state: { selected: boolean; active: boolean; disabled: boolean },
    ) => ReactNode
    filterMode?: 'external' | 'local'
    loading?: boolean
    loadingText?: ReactNode
    emptyText?: ReactNode
    clearable?: boolean
    id?: string
    name?: string
    getFormValue?: (value: T) => string
    label?: ReactNode
    description?: ReactNode
    error?: string | null
    required?: boolean
    disabled?: boolean
    readOnly?: boolean
    placeholder?: string
    inputRef?: Ref<HTMLInputElement>
    onBlur?: (event: FocusEvent<HTMLDivElement>) => void
    className?: string
    classNames?: SelectClassNames
    locale?: SelectLocale
    messages?: Partial<SelectMessages>
}
export interface ComboboxEntry<T> {
    option: T
    key: string
    id: string
    label: string
    description: ReactNode
    disabled: boolean
    selected: boolean
}
export interface ComboboxLogicResult<T> {
    state: {
        virtualOptionsModule:
            | typeof import('../Components/VirtualComboboxOptions.tsx')
            | null
        inputId: string
        listId: string
        hasLabel: boolean
        labelId: string
        descriptionId: string
        errorId: string
        labelledBy: string | undefined
        describedBy: string | undefined
        open: boolean
        activeId: string | undefined
        activeEntry: ComboboxEntry<T> | undefined
        activeIndex: number
        navigationVersion: number
        virtualization: boolean | SelectVirtualizationOptions
        entries: ReadonlyArray<ComboboxEntry<T>>
        messages: SelectMessages
        classNames: SelectClassNames
        controlSize: SelectCustomizationProps['controlSize']
        textOverflow: 'truncate' | 'wrap'
        portalContainer: Element | DocumentFragment | null | undefined
        portalClassName: string | undefined
        popupStyle: CSSProperties
        formValue: string
        hasError: boolean
        error: string | null | undefined
        loadingText: ReactNode
        emptyText: ReactNode
        showClear: boolean
    }
    handler: {
        handleChange: (event: ChangeEvent<HTMLInputElement>) => void
        handleFocus: () => void
        handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
        handleFieldBlur: (event: FocusEvent<HTMLDivElement>) => void
        handleOptionSelect: (entry: ComboboxEntry<T>) => void
        handleOptionActivate: (key: string) => void
        handleKeepFocus: (event: MouseEvent<HTMLElement>) => void
        handleClear: () => void
        handleInvalid: (event: InvalidEvent<HTMLInputElement>) => void
    }
    refs: {
        root: RefObject<HTMLDivElement | null>
        content: RefObject<HTMLDivElement | null>
        validation: RefObject<HTMLInputElement | null>
        input: RefCallback<HTMLInputElement>
    }
}

export interface ComboboxOptionProps<T> {
    entry: ComboboxEntry<T>
    state: Pick<
        ComboboxLogicResult<T>['state'],
        'activeId' | 'classNames' | 'textOverflow'
    >
    handler: Pick<
        ComboboxLogicResult<T>['handler'],
        'handleKeepFocus' | 'handleOptionActivate' | 'handleOptionSelect'
    >
    renderOption: ComboboxProps<T>['renderOption']
    index?: number
    setSize?: number
    measureElement?: RefCallback<HTMLDivElement>
    style?: CSSProperties
}

export interface VirtualComboboxOptionsProps<T> {
    state: Pick<
        ComboboxLogicResult<T>['state'],
        | 'listId'
        | 'labelledBy'
        | 'entries'
        | 'activeId'
        | 'activeIndex'
        | 'navigationVersion'
        | 'virtualization'
        | 'classNames'
        | 'textOverflow'
        | 'popupStyle'
    >
    handler: ComboboxOptionProps<T>['handler']
    renderOption: ComboboxProps<T>['renderOption']
    loading?: boolean
    ariaLabel: string
}

export interface VirtualComboboxOptionsLogicResult<T> {
    state: {
        rows: ReadonlyArray<{ item: VirtualItem; entry: ComboboxEntry<T> }>
        totalSize: number
        height: number
    }
    refs: { viewport: RefObject<HTMLDivElement | null> }
    virtualizer: ReactVirtualizer<HTMLElement, HTMLElement>
}
