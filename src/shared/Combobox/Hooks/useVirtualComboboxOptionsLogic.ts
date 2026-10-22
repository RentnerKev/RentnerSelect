import { useCallback, useRef } from 'react'
import useVirtualOptions from '../../VirtualList/Hooks/useVirtualOptions.ts'
import type {
    VirtualComboboxOptionsLogicResult,
    VirtualComboboxOptionsProps,
} from '../Types/combobox.types.ts'

export default function useVirtualComboboxOptionsLogic<T>({
    state,
    loading,
}: VirtualComboboxOptionsProps<T>): VirtualComboboxOptionsLogicResult<T> {
    const viewport = useRef<HTMLDivElement>(null)
    const getItemKey = useCallback(
        (index: number) => state.entries[index]!.key,
        [state.entries],
    )
    const { state: virtualState, virtualizer } = useVirtualOptions({
        count: loading ? 0 : state.entries.length,
        activeIndex: state.activeIndex,
        navigationVersion: state.navigationVersion,
        scrollRef: viewport,
        getItemKey,
        virtualization: state.virtualization,
    })
    return {
        state: {
            rows: virtualState.items.map((item) => ({
                item,
                entry: state.entries[item.index]!,
            })),
            totalSize: virtualState.totalSize,
            height: Math.min(
                virtualState.totalSize,
                Number(state.popupStyle.maxHeight) || 256,
            ),
        },
        refs: { viewport },
        virtualizer,
    }
}
