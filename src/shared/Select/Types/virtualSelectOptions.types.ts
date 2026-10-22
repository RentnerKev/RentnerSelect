import type { RefObject, PointerEvent, MouseEvent, KeyboardEvent } from 'react'
import type { VirtualOptionsResult } from '../../VirtualList/Types/virtualList.types.ts'
import type {
    SelectOptionsProps,
    SelectVirtualizationOptions,
    SelectVirtualNavigation,
} from './select.types.ts'

export interface VirtualSelectOptionsProps<
    TValue,
> extends SelectOptionsProps<TValue> {
    searchable: boolean
    virtualization: boolean | SelectVirtualizationOptions
    navigationRef: RefObject<SelectVirtualNavigation | null>
    pendingNavigationRef: RefObject<Array<KeyboardEvent<HTMLDivElement>>>
    scrollRef: RefObject<HTMLDivElement | null>
    contentRef: RefObject<HTMLDivElement | null>
    searchInputRef: RefObject<HTMLInputElement | null>
    onValueChange: (radixValue: string) => void
    onClose: () => void
}

export interface VirtualSelectOptionsLogicResult {
    state: VirtualOptionsResult['state'] & { activeRadixValue: string | null }
    handler: {
        handleRowFocus: (radixValue: string) => void
        handleRowPointerDown: (event: PointerEvent<HTMLDivElement>) => void
        handleRowPointerUp: (
            event: PointerEvent<HTMLDivElement>,
            radixValue: string,
        ) => void
        handleRowPointerMove: (
            event: PointerEvent<HTMLDivElement>,
            radixValue: string,
        ) => void
        handleRowClick: (
            event: MouseEvent<HTMLDivElement>,
            radixValue: string,
        ) => void
    }
    refs: { rows: RefObject<Map<string, HTMLDivElement>> }
    virtualizer: VirtualOptionsResult['virtualizer']
}
