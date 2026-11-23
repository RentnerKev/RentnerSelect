import { useCallback, useLayoutEffect } from 'react'
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual'
import type { Range } from '@tanstack/react-virtual'
import type {
    VirtualOptionsProps,
    VirtualOptionsResult,
} from '../Types/virtualList.types.ts'

const DEFAULT_INITIAL_RECT = { width: 0, height: 256 }

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
    const getScrollElement = useCallback(() => scrollRef.current, [scrollRef])
    const estimateSizeFn = useCallback(() => estimateSize, [estimateSize])
    const rangeExtractor = useCallback(
        (range: Range) => {
            const indexes = defaultRangeExtractor(range)
            if (activeIndex >= 0 && activeIndex < count) {
                const len = indexes.length
                if (len === 0) {
                    indexes.push(activeIndex)
                } else if (activeIndex < indexes[0]!) {
                    indexes.unshift(activeIndex)
                } else if (activeIndex > indexes[len - 1]!) {
                    indexes.push(activeIndex)
                }
            }
            return indexes
        },
        [activeIndex, count],
    )
    // oxlint-disable-next-line react/incompatible-library -- TanStack Virtual exposes a mutable instance; this hook intentionally opts out of compiler memoization.
    const virtualizer = useVirtualizer<HTMLElement, HTMLElement>({
        count,
        getScrollElement,
        getItemKey,
        estimateSize: estimateSizeFn,
        gap: 2,
        overscan,
        rangeExtractor,
        initialRect: DEFAULT_INITIAL_RECT,
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
