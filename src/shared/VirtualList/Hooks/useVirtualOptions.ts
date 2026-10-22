import { useCallback, useLayoutEffect } from 'react'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import type { Range } from '@tanstack/react-virtual'
import type {
    VirtualOptionsProps,
    VirtualOptionsResult,
} from '../Types/virtualList.types.ts'

export default function useVirtualOptions({
    count,
    activeIndex,
    navigationVersion,
    scrollRef,
    getItemKey,
    virtualization,
}: VirtualOptionsProps): VirtualOptionsResult {
    const settings =
        typeof virtualization === 'object' ? virtualization : undefined
    const requestedEstimate = settings?.estimateSize ?? 44
    const requestedOverscan = settings?.overscan ?? 5
    const estimateSize = Number.isFinite(requestedEstimate)
        ? Math.max(1, requestedEstimate)
        : 44
    const overscan = Number.isFinite(requestedOverscan)
        ? Math.max(0, Math.floor(requestedOverscan))
        : 5
    const rangeExtractor = useCallback(
        (range: Range) => {
            const indexes = defaultRangeExtractor(range)
            if (
                activeIndex >= 0 &&
                activeIndex < count &&
                !indexes.includes(activeIndex)
            )
                indexes.push(activeIndex)
            return indexes.toSorted((left, right) => left - right)
        },
        [activeIndex, count],
    )
    // oxlint-disable-next-line react/incompatible-library -- TanStack Virtual exposes a mutable instance; this hook intentionally opts out of compiler memoization.
    const virtualizer = useVirtualizer<HTMLElement, HTMLElement>({
        count,
        getScrollElement: () => scrollRef.current,
        getItemKey,
        estimateSize: () => estimateSize,
        overscan,
        rangeExtractor,
        initialRect: { width: 0, height: 256 },
        useFlushSync: false,
        useAnimationFrameWithResizeObserver: true,
    })
    useLayoutEffect(() => {
        if (activeIndex >= 0)
            virtualizer.scrollToIndex(activeIndex, { align: 'auto' })
    }, [activeIndex, navigationVersion, virtualizer])
    return {
        state: {
            items: virtualizer.getVirtualItems(),
            totalSize: virtualizer.getTotalSize(),
        },
        virtualizer,
    }
}
