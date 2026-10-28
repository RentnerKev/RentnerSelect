import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent, MouseEvent } from 'react'
import { findTypeaheadEntry } from '../../../lib/Select/selectNavigation.ts'
import {
    indexSelectNavigation,
    findEnabledSelectEntry,
} from '../../../lib/Select/selectNavigationIndex.ts'
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
    // Only internal ID positions are stable. Caller-owned options can change
    // availability between commits, so focus and navigation check them live.
    const navigation = useMemo(() => indexSelectNavigation(entries), [entries])
    const [storedActiveRadixValue, setActiveRadixValue] = useState<
        string | null
    >(() => {
        const entry =
            entries.find(
                ({ option }) =>
                    isSelected(option.value) && !isOptionDisabled(option),
            ) ?? findEnabledSelectEntry(entries, isOptionDisabled, 0, 1)
        return entry?.radixValue ?? null
    })
    const activePosition =
        storedActiveRadixValue === null
            ? undefined
            : navigation.positions.get(storedActiveRadixValue)
    const validActiveEntry =
        activePosition && !isOptionDisabled(activePosition.entry.option)
            ? activePosition.entry
            : undefined
    const activeRadixValue =
        validActiveEntry?.radixValue ??
        (searchable
            ? null
            : (findEnabledSelectEntry(entries, isOptionDisabled, 0, 1)
                  ?.radixValue ?? null))
    if (storedActiveRadixValue !== activeRadixValue)
        setActiveRadixValue(activeRadixValue)
    const [, requestReplay] = useState(0)
    const previousActiveRadixValue = useRef(activeRadixValue)
    const rowRefs = useRef(new Map<string, HTMLDivElement>())
    const focusRequested = useRef(false)
    const typeahead = useRef({ search: '', time: 0 })
    const pointerType = useRef('mouse')
    const activeIndex =
        activeRadixValue === null
            ? -1
            : (navigation.positions.get(activeRadixValue)?.index ?? -1)
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

    function getActiveElement() {
        const root = contentRef.current?.getRootNode()
        return root && 'activeElement' in root ? root.activeElement : null
    }

    function focusRow(radixValue: string) {
        const index = navigation.positions.get(radixValue)?.index ?? -1
        if (index >= 0) virtualizer.scrollToIndex(index, { align: 'auto' })
        focusRequested.current = true
        setActiveRadixValue(radixValue)
        const row = rowRefs.current.get(radixValue)
        if (row) {
            row.focus({ preventScroll: true })
            focusRequested.current = false
        }
    }

    function handleContentFocus() {
        if (searchable) {
            searchInputRef.current?.focus({ preventScroll: true })
            return
        }
        const active =
            activeRadixValue === null
                ? undefined
                : navigation.positions.get(activeRadixValue)?.entry
        const entry =
            (active && !isOptionDisabled(active.option) ? active : undefined) ??
            entries.find(
                ({ option }) =>
                    isSelected(option.value) && !isOptionDisabled(option),
            ) ??
            findEnabledSelectEntry(entries, isOptionDisabled, 0, 1)
        if (entry) focusRow(entry.radixValue)
        else if (entries.length === 0) onClose()
    }

    function handleSelect(radixValue: string) {
        const entry = navigation.positions.get(radixValue)?.entry
        if (!entry || isOptionDisabled(entry.option)) return
        onValueChange(radixValue)
        if (!multiple) onClose()
    }

    function handleKeyDown(event: KeyboardEvent<HTMLDivElement>): boolean {
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
            const current =
                activeRadixValue === null
                    ? undefined
                    : navigation.positions.get(activeRadixValue)
            if (
                fromSearch ||
                !current ||
                isOptionDisabled(current.entry.option)
            )
                next = findEnabledSelectEntry(
                    entries,
                    isOptionDisabled,
                    direction > 0 ? 0 : entries.length - 1,
                    direction,
                )
            else
                next =
                    findEnabledSelectEntry(
                        entries,
                        isOptionDisabled,
                        current.index + direction,
                        direction,
                    ) ?? current.entry
        } else if (
            !fromSearch &&
            (event.key === 'Home' || event.key === 'End')
        ) {
            const direction = event.key === 'Home' ? 1 : -1
            next = findEnabledSelectEntry(
                entries,
                isOptionDisabled,
                direction > 0 ? 0 : entries.length - 1,
                direction,
            )
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
    }

    function handleRowFocus(radixValue: string) {
        const entry = navigation.positions.get(radixValue)?.entry
        if (!entry || isOptionDisabled(entry.option)) return
        setActiveRadixValue(radixValue)
        optionHandler.handleOptionFocus(entry.option.value)
    }

    function handleRowPointerDown(event: PointerEvent<HTMLDivElement>) {
        pointerType.current = event.pointerType
    }

    function handleRowPointerUp(
        event: PointerEvent<HTMLDivElement>,
        radixValue: string,
    ) {
        pointerType.current = event.pointerType
        if (
            event.pointerType !== 'mouse' ||
            event.defaultPrevented ||
            event.button !== 0
        )
            return
        handleSelect(radixValue)
    }

    function handleRowPointerMove(
        event: PointerEvent<HTMLDivElement>,
        radixValue: string,
    ) {
        if (event.pointerType !== 'mouse' || event.defaultPrevented) return
        const entry = navigation.positions.get(radixValue)?.entry
        if (entry && !isOptionDisabled(entry.option))
            event.currentTarget.focus({ preventScroll: true })
    }

    function handleRowClick(
        event: MouseEvent<HTMLDivElement>,
        radixValue: string,
    ) {
        if (
            event.defaultPrevented ||
            (pointerType.current === 'mouse' && event.detail !== 0)
        )
            return
        handleSelect(radixValue)
    }

    useLayoutEffect(() => {
        navigationRef.current = { handleKeyDown, handleContentFocus }
        const focused = getActiveElement()
        if (contentRef.current && focused === contentRef.current)
            handleContentFocus()
        if (focusRequested.current && activeRadixValue) {
            const row = rowRefs.current.get(activeRadixValue)
            if (row) {
                row.focus({ preventScroll: true })
                focusRequested.current = false
            }
        }
        return () => {
            navigationRef.current = null
        }
    })

    useLayoutEffect(() => {
        if (pendingNavigationRef.current.length === 0) return
        let cancelled = false
        queueMicrotask(() => {
            if (cancelled) return
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
            cancelled = true
        }
    })

    useLayoutEffect(() => {
        const previous = previousActiveRadixValue.current
        previousActiveRadixValue.current = activeRadixValue
        if (
            previous === null ||
            (navigation.positions.has(previous) &&
                !isOptionDisabled(
                    navigation.positions.get(previous)!.entry.option,
                ))
        )
            return
        if (searchable) searchInputRef.current?.focus({ preventScroll: true })
        else if (activeRadixValue) {
            const row = rowRefs.current.get(activeRadixValue)
            focusRequested.current = !row
            row?.focus({ preventScroll: true })
        } else if (entries.length === 0) onClose()
        else contentRef.current?.focus({ preventScroll: true })
    })

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
