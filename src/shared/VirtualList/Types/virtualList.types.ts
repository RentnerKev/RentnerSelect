import type { RefObject } from 'react'
import type { ReactVirtualizer, VirtualItem } from '@tanstack/react-virtual'
import type { SelectVirtualizationOptions } from '../../Select/Types/select.types.ts'

export interface VirtualOptionsProps {
    count: number
    activeIndex: number
    navigationVersion?: number
    scrollRef: RefObject<HTMLElement | null>
    getItemKey: (index: number) => string
    virtualization: boolean | SelectVirtualizationOptions
}

export interface VirtualOptionsResult {
    state: {
        items: ReadonlyArray<VirtualItem>
        totalSize: number
    }
    virtualizer: ReactVirtualizer<HTMLElement, HTMLElement>
}

export interface DeferredModuleProps<TModule extends object> {
    enabled: boolean
    load: () => Promise<TModule>
}
