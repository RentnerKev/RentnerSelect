import { useCallback, useEffect, useState } from 'react'
import type { Option } from '../../../src/shared/Select/Types/select.types.ts'
import type { VirtualOptionsFixtureLogicResult } from '../Types/virtualOptionsFixture.types.ts'
export function useVirtualOptionsFixtureLogic(): VirtualOptionsFixtureLogicResult {
    const query = new URLSearchParams(window.location.search)
    const kind =
        query.get('virtual-list') === 'combobox' ? 'combobox' : 'select'
    const multiple = query.has('multiple')
    const searchable = !query.has('no-search')
    const mutation = query.get('mutation')
    const shadow = query.has('shadow')
    const initial = query.get('initial')
    const count = Math.max(
        10,
        Math.min(10000, Number(query.get('count')) || 10000),
    )
    const virtualized = query.has('full-list')
        ? false
        : query.has('auto')
          ? undefined
          : { estimateSize: 64, overscan: 4 }
    const contentWidth =
        query.get('content-width') === 'content' ? 'content' : 'trigger'
    const [mountStartedAt] = useState(() => performance.now())
    useEffect(() => {
        let cancelled = false
        requestAnimationFrame(() =>
            requestAnimationFrame(() => {
                if (cancelled) return
                performance.measure('virtual-fixture-mount', {
                    start: mountStartedAt,
                    end: performance.now(),
                })
                document.documentElement.dataset.fixtureReady = 'true'
            }),
        )
        return () => {
            cancelled = true
        }
    }, [mountStartedAt])
    const [options, setOptions] = useState<Array<Option<string>>>(() =>
        Array.from({ length: count }, (_, index) => ({
            value: String(index),
            label: 'Option ' + String(index).padStart(5, '0'),
            subOption:
                index % 3 === 0
                    ? 'A longer description that wraps across several lines when the popup is narrow.'
                    : undefined,
            disabled: index === 2 || index === 9999,
        })),
    )
    const [selectedValues, setSelectedValues] = useState<Array<string>>(() =>
        initial ? [initial] : [],
    )
    const [searchValue, setSearchValue] = useState('')
    const [portalContainer, setPortalContainer] = useState<HTMLDivElement>()
    const handlePortalHostRef = useCallback(
        (host: HTMLDivElement | null) => {
            if (!host || !shadow) return
            const root = host.shadowRoot ?? host.attachShadow({ mode: 'open' })
            for (const style of document.head.querySelectorAll(
                'style,link[rel="stylesheet"]',
            ))
                root.append(style.cloneNode(true))
            const portal = document.createElement('div')
            root.append(portal)
            setPortalContainer(portal)
        },
        [shadow],
    )
    function handleMultipleChange(values: Array<string>) {
        setSelectedValues(values)
        if (mutation === 'reorder')
            setOptions((previous) => previous.toReversed())
        if (mutation === 'remove')
            setOptions((previous) =>
                previous.filter((option) => !values.includes(option.value)),
            )
        if (mutation === 'empty') setOptions([])
        if (mutation === 'grow')
            setOptions((previous) => [
                ...previous,
                {
                    value: String(previous.length),
                    label: 'Option ' + String(previous.length).padStart(5, '0'),
                },
            ])
    }
    function handleSingleChange(value: string) {
        handleMultipleChange([value])
    }
    function handleComboboxChange(value: Option<string> | null) {
        handleMultipleChange(value ? [value.value] : [])
        setSearchValue(value?.label ?? '')
    }
    return {
        state: {
            kind,
            shadow,
            multiple,
            searchable,
            virtualized,
            contentWidth,
            options,
            selectedValues,
            selectedOption:
                options.find((option) => option.value === selectedValues[0]) ??
                null,
            searchValue,
            portalContainer,
        },
        refs: { portalHost: handlePortalHostRef },
        handler: {
            handleSingleChange,
            handleMultipleChange,
            handleComboboxChange,
            handleSearchChange: setSearchValue,
            handleSubmit: (event) => event.preventDefault(),
        },
    }
}
