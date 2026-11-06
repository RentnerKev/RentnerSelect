import type {
    ComboboxEntry,
    ComboboxLogicResult,
    VirtualComboboxOptionsProps,
} from '../../shared/Combobox/Types/combobox.types.ts'
import type {
    CustomSelectLogicResult,
    SelectMessages,
} from '../../shared/Select/Types/select.types.ts'

// These fields match the v6 public constructors and adapter contracts.
export const legacyEntry: ComboboxEntry<string> = {
    option: 'one',
    key: 'one',
    id: 'one',
    label: 'One',
    description: undefined,
    disabled: false,
    selected: false,
}

type CreateState = 'canCreate' | 'createLabel' | 'createId' | 'createActive'
type CreateHandlers = 'handleCreateOption' | 'handleCreateActivate'
type LegacyComboboxResult = Omit<
    ComboboxLogicResult<string>,
    'state' | 'handler'
> & {
    state: Omit<ComboboxLogicResult<string>['state'], CreateState>
    handler: Omit<ComboboxLogicResult<string>['handler'], CreateHandlers>
}
declare const previousCombobox: LegacyComboboxResult
export const compatibleCombobox: ComboboxLogicResult<string> = previousCombobox
export const completeMessages: SelectMessages =
    compatibleCombobox.state.messages
export const minimumMessage: string =
    compatibleCombobox.state.messages.minSelection(2)
export const maximumMessage: string =
    compatibleCombobox.state.messages.maxSelection(4)

type LegacyVirtualOptions = Omit<
    VirtualComboboxOptionsProps<string>,
    'state' | 'handler'
> & {
    state: Omit<VirtualComboboxOptionsProps<string>['state'], CreateState>
    handler: Omit<
        VirtualComboboxOptionsProps<string>['handler'],
        CreateHandlers
    >
}
declare const previousVirtualOptions: LegacyVirtualOptions
export const compatibleVirtualOptions: VirtualComboboxOptionsProps<string> =
    previousVirtualOptions

type LegacySelectResult = Omit<
    CustomSelectLogicResult<string>,
    'state' | 'handler'
> & {
    state: Omit<
        CustomSelectLogicResult<string>['state'],
        'showRemovableSelectedItems'
    >
    handler: Omit<
        CustomSelectLogicResult<string>['handler'],
        'handleRemoveSelectedItem'
    >
}
declare const previousSelect: LegacySelectResult
export const compatibleSelect: CustomSelectLogicResult<string> = previousSelect
