import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, MouseEvent } from 'react'
import { findTypeaheadEntry } from '../../../lib/Select/selectNavigation.ts'
import useVirtualOptions from '../../VirtualList/Hooks/useVirtualOptions.ts'
import type {
    VirtualSelectOptionsProps,
    VirtualSelectOptionsLogicResult,
} from '../Types/virtualSelectOptions.types.ts'

export default function useVirtualSelectOptionsLogic<TValue>({
    entries,
    isSelected,
    isOptionDisabled,
    multiple,
    searchable,
    virtualization,
    navigationRef,
    pendingNavigationRef,
    scrollRef,
    contentRef,
    searchInputRef,
    onValueChange,
    onClose,
    handler: optionHandler,
}: VirtualSelectOptionsProps<TValue>): VirtualSelectOptionsLogicResult {
    const entryIndexByRadixValue = useMemo(() => {
        const index = new Map<string, number>()
        for (let i = 0; i < entries.length; i += 1) {
            index.set(entries[i]!.radixValue, i)
        }
        return index
    }, [entries])

    const [storedActiveRadixValue, setActiveRadixValue] = useState<
        string | null
    >(() => {
        let firstEnabled: string | null = null
        for (let i = 0; i < entries.length; i += 1) {
            const entry = entries[i]!
            if (isOptionDisabled(entry.option)) continue
            if (isSelected(entry.option.value)) return entry.radixValue
            if (firstEnabled === null) firstEnabled = entry.radixValue
        }
        return firstEnabled
    })

    const storedIndex =
        storedActiveRadixValue !== null
            ? (entryIndexByRadixValue.get(storedActiveRadixValue) ?? -1)
            : -1
    const validActiveEntry =
        storedIndex >= 0 && !isOptionDisabled(entries[storedIndex]!.option)
            ? entries[storedIndex]
            : undefined

    let fallbackActiveRadixValue: string | null = null
    if (!validActiveEntry && !searchable) {
        for (let i = 0; i < entries.length; i += 1) {
            const entry = entries[i]!
            if (!isOptionDisabled(entry.option)) {
                fallbackActiveRadixValue = entry.radixValue
                break
            }
        }
    }
    const activeRadixValue =
        validActiveEntry?.radixValue ?? fallbackActiveRadixValue

    if (storedActiveRadixValue !== activeRadixValue)
        setActiveRadixValue(activeRadixValue)
    const [replayTick, requestReplay] = useState(0)
    const previousActiveRadixValue = useRef(activeRadixValue)
    const rowRefs = useRef(new Map<string, HTMLDivElement>())
    const focusRequested = useRef(false)
    const typeahead = useRef({ search: '', time: 0 })
    const pointerType = useRef('mouse')
    const activeIndex =
        activeRadixValue !== null
            ? (entryIndexByRadixValue.get(activeRadixValue) ?? -1)
            : -1
    const getItemKey = useCallback(
        (index: number) => entries[index]!.radixValue,
        [entries],
    )
    const { state: virtualState, virtualizer } = useVirtualOptions({
        count: entries.length,
        activeIndex,
        scrollRef,
        getItemKey,
        virtualization,
    })

    const findFirstEnabled = useCallback(() => {
        for (let i = 0; i < entries.length; i += 1) {
            if (!isOptionDisabled(entries[i]!.option)) return entries[i]
        }
        return undefined
    }, [entries, isOptionDisabled])

    const findLastEnabled = useCallback(() => {
        for (let i = entries.length - 1; i >= 0; i -= 1) {
            if (!isOptionDisabled(entries[i]!.option)) return entries[i]
        }
        return undefined
    }, [entries, isOptionDisabled])

    const getActiveElement = useCallback(() => {
        const root = contentRef.current?.getRootNode()
        return root && 'activeElement' in root ? root.activeElement : null
    }, [contentRef])

    const focusRow = useCallback(
        (radixValue: string) => {
            const index = entryIndexByRadixValue.get(radixValue) ?? -1
            if (index >= 0) virtualizer.scrollToIndex(index, { align: 'auto' })
            focusRequested.current = true
            setActiveRadixValue(radixValue)
            const row = rowRefs.current.get(radixValue)
            if (row) {
                row.focus({ preventScroll: true })
                focusRequested.current = false
            }
        },
        [entryIndexByRadixValue, virtualizer],
    )

    const handleContentFocus = useCallback(() => {
        if (searchable) {
            searchInputRef.current?.focus({ preventScroll: true })
            return
        }
        let target: (typeof entries)[number] | undefined
        if (
            activeIndex >= 0 &&
            !isOptionDisabled(entries[activeIndex]!.option)
        ) {
            target = entries[activeIndex]
        } else {
            let firstEnabled: (typeof entries)[number] | undefined
            for (let i = 0; i < entries.length; i += 1) {
                const entry = entries[i]!
                if (isOptionDisabled(entry.option)) continue
                if (isSelected(entry.option.value)) {
                    target = entry
                    break
                }
                if (!firstEnabled) firstEnabled = entry
            }
            target ??= firstEnabled
        }
        if (target) focusRow(target.radixValue)
        else if (entries.length === 0) onClose()
    }, [
        activeIndex,
        entries,
        focusRow,
        isOptionDisabled,
        isSelected,
        onClose,
        searchable,
        searchInputRef,
    ])

    const handleSelect = useCallback(
        (radixValue: string) => {
            const index = entryIndexByRadixValue.get(radixValue)
            if (index === undefined) return
            const entry = entries[index]!
            if (isOptionDisabled(entry.option)) return
            onValueChange(radixValue)
            if (!multiple) onClose()
        },
        [
            entries,
            entryIndexByRadixValue,
            isOptionDisabled,
            multiple,
            onClose,
            onValueChange,
        ],
    )

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLDivElement>): boolean => {
            if (
                event.defaultPrevented ||
                event.nativeEvent.isComposing ||
                event.ctrlKey ||
                event.altKey ||
                event.metaKey
            )
                return false
            const fromSearch = event.target === searchInputRef.current
            let next: (typeof entries)[number] | undefined
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                const direction = event.key === 'ArrowDown' ? 1 : -1
                if (fromSearch) {
                    next =
                        direction > 0 ? findFirstEnabled() : findLastEnabled()
                } else if (activeIndex < 0) {
                    next =
                        direction > 0 ? findFirstEnabled() : findLastEnabled()
                } else {
                    for (
                        let i = activeIndex + direction;
                        i >= 0 && i < entries.length;
                        i += direction
                    ) {
                        if (!isOptionDisabled(entries[i]!.option)) {
                            next = entries[i]
                            break
                        }
                    }
                    if (
                        !next &&
                        !isOptionDisabled(entries[activeIndex]!.option)
                    ) {
                        next = entries[activeIndex]
                    }
                }
            } else if (
                !fromSearch &&
                (event.key === 'Home' || event.key === 'End')
            ) {
                next =
                    event.key === 'Home'
                        ? findFirstEnabled()
                        : findLastEnabled()
            } else if (
                !fromSearch &&
                (event.key === 'Enter' ||
                    (event.key === ' ' &&
                        !(
                            !searchable &&
                            typeahead.current.search &&
                            Date.now() - typeahead.current.time < 1000
                        )))
            ) {
                if (activeRadixValue) handleSelect(activeRadixValue)
            } else if (!fromSearch && !searchable && event.key.length === 1) {
                const now = Date.now()
                const search =
                    (now - typeahead.current.time < 1000
                        ? typeahead.current.search
                        : '') + event.key
                typeahead.current = { search, time: now }
                next = findTypeaheadEntry(
                    entries,
                    activeRadixValue ?? undefined,
                    search,
                    isOptionDisabled,
                )
            } else return false
            event.preventDefault()
            event.stopPropagation()
            if (next) focusRow(next.radixValue)
            return true
        },
        [
            activeIndex,
            activeRadixValue,
            entries,
            findFirstEnabled,
            findLastEnabled,
            focusRow,
            handleSelect,
            isOptionDisabled,
            searchable,
            searchInputRef,
        ],
    )

    const handleRowFocus = useCallback(
        (radixValue: string) => {
            const index = entryIndexByRadixValue.get(radixValue)
            if (index === undefined) return
            const entry = entries[index]!
            if (isOptionDisabled(entry.option)) return
            setActiveRadixValue(radixValue)
            optionHandler.handleOptionFocus(entry.option.value)
        },
        [entries, entryIndexByRadixValue, isOptionDisabled, optionHandler],
    )

    const handleRowPointerDown = useCallback(
        (event: PointerEvent<HTMLDivElement>) => {
            pointerType.current = event.pointerType
        },
        [],
    )

    const handleRowPointerUp = useCallback(
        (event: PointerEvent<HTMLDivElement>, radixValue: string) => {
            pointerType.current = event.pointerType
            if (
                event.pointerType !== 'mouse' ||
                event.defaultPrevented ||
                event.button !== 0
            )
                return
            handleSelect(radixValue)
        },
        [handleSelect],
    )

    const handleRowPointerMove = useCallback(
        (event: PointerEvent<HTMLDivElement>, radixValue: string) => {
            if (event.pointerType !== 'mouse' || event.defaultPrevented) return
            const index = entryIndexByRadixValue.get(radixValue)
            if (
                index !== undefined &&
                !isOptionDisabled(entries[index]!.option)
            )
                event.currentTarget.focus({ preventScroll: true })
        },
        [entries, entryIndexByRadixValue, isOptionDisabled],
    )

    const handleRowClick = useCallback(
        (event: MouseEvent<HTMLDivElement>, radixValue: string) => {
            if (
                event.defaultPrevented ||
                (pointerType.current === 'mouse' && event.detail !== 0)
            )
                return
            handleSelect(radixValue)
        },
        [handleSelect],
    )

    const firstVirtualIndex = virtualState.items[0]?.index ?? -1
    const lastVirtualIndex =
        virtualState.items[virtualState.items.length - 1]?.index ?? -1

    useLayoutEffect(() => {
        navigationRef.current = { handleKeyDown, handleContentFocus }
        const focused = getActiveElement()
        if (contentRef.current && focused === contentRef.current)
            handleContentFocus()
        if (
            firstVirtualIndex >= 0 &&
            lastVirtualIndex >= 0 &&
            focusRequested.current &&
            activeRadixValue
        ) {
            const row = rowRefs.current.get(activeRadixValue)
            if (row) {
                row.focus({ preventScroll: true })
                focusRequested.current = false
            }
        }
        return () => {
            navigationRef.current = null
        }
    }, [
        activeRadixValue,
        contentRef,
        firstVirtualIndex,
        getActiveElement,
        handleContentFocus,
        handleKeyDown,
        lastVirtualIndex,
        navigationRef,
    ])

    useLayoutEffect(() => {
        if (replayTick < 0 || pendingNavigationRef.current.length === 0) return
        const lifecycle = { cancelled: false }
        queueMicrotask(() => {
            if (lifecycle.cancelled) return
            const event = pendingNavigationRef.current.shift()
            if (!event) return
            const focused = getActiveElement()
            const replayEvent =
                (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
                focused instanceof Element &&
                focused.getAttribute('role') === 'option'
                    ? { ...event, target: focused }
                    : event
            navigationRef.current?.handleKeyDown(replayEvent)
            if (pendingNavigationRef.current.length > 0)
                requestReplay((revision) => revision + 1)
        })
        return () => {
            lifecycle.cancelled = true
        }
    }, [getActiveElement, navigationRef, pendingNavigationRef, replayTick])

    useLayoutEffect(() => {
        const previous = previousActiveRadixValue.current
        previousActiveRadixValue.current = activeRadixValue
        if (previous === null) return
        const prevIndex = entryIndexByRadixValue.get(previous)
        if (
            prevIndex !== undefined &&
            !isOptionDisabled(entries[prevIndex]!.option)
        )
            return
        if (searchable) searchInputRef.current?.focus({ preventScroll: true })
        else if (activeRadixValue) {
            const row = rowRefs.current.get(activeRadixValue)
            focusRequested.current = !row
            row?.focus({ preventScroll: true })
        } else if (entries.length === 0) onClose()
        else contentRef.current?.focus({ preventScroll: true })
    }, [
        activeRadixValue,
        contentRef,
        entries,
        entryIndexByRadixValue,
        isOptionDisabled,
        onClose,
        searchable,
        searchInputRef,
    ])

    return {
        state: {
            items: virtualState.items,
            totalSize: virtualState.totalSize,
            activeRadixValue,
        },
        handler: {
            handleRowFocus,
            handleRowPointerDown,
            handleRowPointerUp,
            handleRowPointerMove,
            handleRowClick,
        },
        refs: { rows: rowRefs },
        virtualizer,
    }
}
