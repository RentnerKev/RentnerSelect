import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type {
    ChangeEvent,
    FocusEvent,
    KeyboardEvent,
    InvalidEvent,
    MouseEvent,
} from 'react'
import { useSelectDefaults } from '../../Select/Hooks/useSelectContext.ts'
import useComposedRefs from '../../Select/Hooks/useComposedRefs.ts'
import useDeferredModule from '../../VirtualList/Hooks/useDeferredModule.ts'
import { resolveSelectMessages } from '../../../lib/Messages/i18n.ts'
import useSelectOverlay from '../../Select/Hooks/useSelectOverlay.ts'
import { mergeAriaIds } from '../../../lib/Field/selectField.ts'
import { resolveSelectVirtualization } from '../../../lib/Select/selectVirtualization.ts'
import { groupSelectEntries } from '../../../lib/Select/selectGroups.ts'
import type {
    ComboboxEntry,
    InternalComboboxLogicResult,
    ComboboxProps,
} from '../Types/combobox.types.ts'
import type { SelectClassNames } from '../../Select/Types/select.types.ts'

let virtualOptionsPromise:
    | Promise<typeof import('../Components/VirtualComboboxOptions.tsx')>
    | undefined
function loadVirtualOptions() {
    return (virtualOptionsPromise ??=
        import('../Components/VirtualComboboxOptions.tsx'))
}

const EMPTY_CLASS_NAMES: SelectClassNames = {}
const EMPTY_ARRAY: ReadonlyArray<never> = []

function handleKeepFocus(event: MouseEvent<HTMLElement>) {
    event.preventDefault()
}

export default function useComboboxLogic<T>(
    props: ComboboxProps<T>,
): InternalComboboxLogicResult<T> {
    const defaults = useSelectDefaults()
    const generatedId = useId()
    const inputId = props.id ?? 'combobox-' + generatedId
    const listId = inputId + '-listbox'
    const labelId = inputId + '-label'
    const hasLabel =
        props.label != null &&
        typeof props.label !== 'boolean' &&
        props.label !== ''
    const descriptionId = inputId + '-description'
    const errorId = inputId + '-error'
    const root = useRef<HTMLDivElement>(null)
    const content = useRef<HTMLDivElement>(null)
    const input = useRef<HTMLInputElement>(null)
    const validation = useRef<HTMLInputElement>(null)
    const inputRef = useComposedRefs(input, props.inputRef)
    const [requestedOpen, setOpen] = useState(false)
    const [activeKey, setActiveKey] = useState<string | null>(null)
    const [requestedCreateActive, setCreateActive] = useState(false)
    const [navigationVersion, setNavigationVersion] = useState(0)
    const [touched, setTouched] = useState(false)
    const {
        multiple,
        value: controlledValue,
        options,
        filterMode,
        getOptionLabel,
        getOptionGroup,
        searchValue,
        getOptionKey,
        getOptionDescription,
        isOptionDisabled,
        isOptionEqualToValue,
        loading,
        onValueChange,
    } = props

    const { selectedValues, selectedKeySet } = useMemo(() => {
        const keys = new Set<string>()
        const values: T[] = []
        const raw = multiple
            ? controlledValue
            : controlledValue === null
              ? EMPTY_ARRAY
              : [controlledValue]
        for (const item of raw) {
            const key = getOptionKey(item)
            if (!keys.has(key)) {
                keys.add(key)
                values.push(item)
            }
        }
        return { selectedValues: values, selectedKeySet: keys }
    }, [multiple, controlledValue, getOptionKey])

    const emptySelection = selectedValues.length === 0
    const interactionDisabled = Boolean(props.disabled || props.readOnly)
    const [previousInteractionDisabled, setPreviousInteractionDisabled] =
        useState(interactionDisabled)
    if (previousInteractionDisabled !== interactionDisabled) {
        setPreviousInteractionDisabled(interactionDisabled)
        if (interactionDisabled) {
            setOpen(false)
            setActiveKey(null)
        }
    }
    const open = requestedOpen && !interactionDisabled
    const locale = props.locale ?? defaults.locale
    const messages = useMemo(
        () =>
            resolveSelectMessages(
                locale,
                defaults.messages || props.messages
                    ? { ...defaults.messages, ...props.messages }
                    : undefined,
            ),
        [defaults.messages, locale, props.messages],
    )
    const controlSize = props.controlSize ?? defaults.controlSize
    const textOverflow =
        props.textOverflow ?? defaults.textOverflow ?? 'truncate'
    const contentWidth =
        props.contentWidth ?? defaults.contentWidth ?? 'trigger'
    const virtualization = resolveSelectVirtualization(
        props.virtualized ?? defaults.virtualized,
        options.length,
        'combobox',
    )
    const {
        state: { module: virtualOptionsModule },
    } = useDeferredModule({
        enabled: open && Boolean(virtualization),
        load: loadVirtualOptions,
    })
    const classNames = useMemo(
        () =>
            defaults.classNames || props.classNames
                ? { ...defaults.classNames, ...props.classNames }
                : EMPTY_CLASS_NAMES,
        [defaults.classNames, props.classNames],
    )
    const portalContainer =
        props.portalContainer === undefined
            ? defaults.portalContainer
            : props.portalContainer
    const portalClassName = props.portalClassName ?? defaults.portalClassName
    const portalZIndex = props.portalZIndex ?? defaults.portalZIndex
    const error =
        props.error === undefined && touched && props.required && emptySelection
            ? messages.required
            : props.error
    const hasError = Boolean(error) && !props.disabled

    const baseEntries = useMemo(() => {
        if (!options.length) return EMPTY_ARRAY
        const isLocal = filterMode === 'local'
        const byKey = new Map<
            string,
            {
                entry: Omit<ComboboxEntry<T>, 'selected'>
                l: string
                g: string
            }
        >()
        for (const option of options) {
            const key = getOptionKey(option)
            const label = getOptionLabel(option)
            const group = getOptionGroup?.(option) || undefined
            byKey.set(key, {
                entry: {
                    option,
                    key,
                    id: listId + '-' + encodeURIComponent(key),
                    label,
                    group,
                    description: getOptionDescription?.(option),
                    disabled: isOptionDisabled?.(option) ?? false,
                },
                l: isLocal ? label.toLocaleLowerCase() : '',
                g: isLocal && group ? group.toLocaleLowerCase() : '',
            })
        }
        const list = [...byKey.values()]
        return getOptionGroup
            ? groupSelectEntries(list, (item) => item.entry.group).flatMap(
                  (g) => g.entries,
              )
            : list
    }, [
        options,
        filterMode,
        getOptionKey,
        getOptionLabel,
        getOptionGroup,
        getOptionDescription,
        isOptionDisabled,
        listId,
    ])

    const entries = useMemo<
        ReadonlyArray<ComboboxEntry<T> & { position: number }>
    >(() => {
        if (!baseEntries.length) return EMPTY_ARRAY
        const q =
            filterMode === 'local' && searchValue
                ? searchValue.toLocaleLowerCase()
                : ''
        const result: Array<ComboboxEntry<T> & { position: number }> = []
        for (const item of baseEntries) {
            if (q && !item.l.includes(q) && !item.g.includes(q)) continue
            result.push({
                ...item.entry,
                position: result.length + 1,
                selected: isOptionEqualToValue
                    ? selectedValues.some((v) =>
                          isOptionEqualToValue(item.entry.option, v),
                      )
                    : selectedKeySet.has(item.entry.key),
            })
        }
        return result
    }, [
        baseEntries,
        filterMode,
        searchValue,
        selectedValues,
        selectedKeySet,
        isOptionEqualToValue,
    ])

    const { enabledEntries, enabledIndexByKey } = useMemo(() => {
        const list: Array<ComboboxEntry<T> & { position: number }> = []
        const indexByKey = new Map<string, number>()
        if (!loading) {
            for (const entry of entries) {
                if (entry.disabled) continue
                indexByKey.set(entry.key, list.length)
                list.push(entry)
            }
        }
        return { enabledEntries: list, enabledIndexByKey: indexByKey }
    }, [entries, loading])

    const createQuery = searchValue.trim()
    const normalizedCreate = createQuery ? createQuery.toLocaleLowerCase() : ''
    const canCreate = Boolean(
        props.onCreateOption &&
        createQuery &&
        !interactionDisabled &&
        !loading &&
        !baseEntries.some(
            (b) =>
                b.entry.label.trim().toLocaleLowerCase() === normalizedCreate,
        ),
    )

    const createActive = open && canCreate && requestedCreateActive
    const createId = inputId + '-create-option'
    const createLabel =
        props.createOptionLabel?.(createQuery) ??
        messages.createOption?.(createQuery) ??
        createQuery
    const activeEnabledIndex =
        open && !createActive && activeKey !== null
            ? (enabledIndexByKey?.get(activeKey) ?? -1)
            : -1
    const activeEntry =
        activeEnabledIndex >= 0 ? enabledEntries[activeEnabledIndex] : undefined
    const activeIndex = activeEntry ? activeEntry.position - 1 : -1

    const validationMessage = interactionDisabled
        ? ''
        : props.error !== undefined
          ? (props.error ?? '')
          : props.required && emptySelection
            ? messages.required
            : ''
    useEffect(() => {
        validation.current?.setCustomValidity(validationMessage)
    }, [validationMessage])

    const handleDismiss = useCallback(() => setOpen(false), [])
    const {
        state: { popupStyle: basePopupStyle },
        refs: { content: overlayContent },
    } = useSelectOverlay({
        layoutVersion: virtualOptionsModule,
        maxHeight: 256,
        open,
        contentWidth,
        portalTarget:
            portalContainer ??
            (typeof document === 'undefined' ? null : document.body),
        rootRef: root,
        contentRef: content,
        triggerRef: input,
        onDismiss: handleDismiss,
    })

    const activeId = createActive ? createId : activeEntry?.id
    useEffect(() => {
        if (!activeId || (virtualization && !createActive)) return
        const container = content.current
        const rootNode = container?.getRootNode() as
            | Document
            | ShadowRoot
            | undefined
        const byId = rootNode?.getElementById?.(activeId)
        if (byId && container?.contains(byId))
            byId.scrollIntoView?.({ block: 'nearest' })
    }, [activeId, virtualization, createActive])

    function handleFocus() {
        if (!interactionDisabled) setOpen(true)
    }
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        if (interactionDisabled) return
        props.onSearchValueChange(event.target.value)
        setActiveKey(null)
        setCreateActive(false)
        setOpen(true)
    }

    const handleOptionSelect = useCallback(
        (entry: ComboboxEntry<T>) => {
            if (interactionDisabled || loading || entry.disabled) return
            if (multiple) {
                ;(onValueChange as (v: T[]) => void)(
                    entry.selected
                        ? selectedValues.filter(
                              (v) =>
                                  !(isOptionEqualToValue
                                      ? isOptionEqualToValue(entry.option, v)
                                      : getOptionKey(v) === entry.key),
                          )
                        : [...selectedValues, entry.option],
                )
            } else (onValueChange as (v: T | null) => void)(entry.option)
            setOpen(Boolean(multiple))
            if (!multiple) setActiveKey(null)
            setCreateActive(false)
            input.current?.focus()
        },
        [
            interactionDisabled,
            loading,
            multiple,
            onValueChange,
            selectedValues,
            isOptionEqualToValue,
            getOptionKey,
        ],
    )

    function handleCreateOption() {
        if (!canCreate) return
        props.onCreateOption?.(createQuery)
        setOpen(false)
        setActiveKey(null)
        setCreateActive(false)
        input.current?.focus()
    }
    function handleCreateActivate() {
        if (!canCreate) return
        setActiveKey(null)
        setCreateActive(true)
    }
    function handleRemoveSelectedItem(key: string) {
        if (!multiple || interactionDisabled) return
        const item = selectedValues.find((v) => getOptionKey(v) === key)
        if (item === undefined || isOptionDisabled?.(item)) return
        ;(onValueChange as (v: T[]) => void)(
            selectedValues.filter((v) => getOptionKey(v) !== key),
        )
        input.current?.focus({ preventScroll: true })
    }
    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (interactionDisabled || event.nativeEvent.isComposing) return
        if (
            event.key === 'Backspace' &&
            multiple &&
            !searchValue &&
            input.current?.selectionStart === 0
        ) {
            const last = selectedValues.findLast((i) => !isOptionDisabled?.(i))
            if (last !== undefined) {
                event.preventDefault()
                handleRemoveSelectedItem(getOptionKey(last))
            }
            return
        }
        if (event.key === 'Escape') {
            if (open) {
                event.preventDefault()
                setOpen(false)
                setActiveKey(null)
                setCreateActive(false)
            }
            return
        }
        if (event.key === 'Tab') {
            setOpen(false)
            return
        }
        if (event.key === 'Enter') {
            if (open && activeEntry) {
                event.preventDefault()
                handleOptionSelect(activeEntry)
            } else if (
                open &&
                canCreate &&
                (createActive || !enabledEntries.length)
            ) {
                event.preventDefault()
                handleCreateOption()
            }
            return
        }
        const key = event.key
        const isArrow = key === 'ArrowDown' || key === 'ArrowUp'
        if (!isArrow && (!(key === 'Home' || key === 'End') || !open)) return
        event.preventDefault()
        setOpen(true)
        const count = enabledEntries.length + (canCreate ? 1 : 0)
        if (!count) return
        const index = createActive ? enabledEntries.length : activeEnabledIndex
        const nextIndex =
            key === 'Home'
                ? 0
                : key === 'End'
                  ? count - 1
                  : key === 'ArrowDown'
                    ? Math.min(index + 1, count - 1)
                    : index < 0
                      ? count - 1
                      : Math.max(0, index - 1)
        setNavigationVersion((v) => v + 1)
        setCreateActive(nextIndex === enabledEntries.length)
        setActiveKey(enabledEntries[nextIndex]?.key ?? null)
    }
    function handleFieldBlur(event: FocusEvent<HTMLDivElement>) {
        const target = event.relatedTarget
        if (
            target instanceof Node &&
            (root.current?.contains(target) ||
                content.current?.contains(target))
        )
            return
        setTouched(true)
        setOpen(false)
        setActiveKey(null)
        setCreateActive(false)
        props.onBlur?.(event)
    }
    function handleClear() {
        if (interactionDisabled) return
        if (multiple) (onValueChange as (v: T[]) => void)([])
        else (onValueChange as (v: T | null) => void)(null)
        props.onSearchValueChange('')
        setActiveKey(null)
        setCreateActive(false)
        input.current?.focus()
        setOpen(false)
    }
    function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
        event.preventDefault()
        setTouched(true)
        input.current?.focus()
    }
    const handleOptionActivate = useCallback((key: string) => {
        setCreateActive(false)
        setActiveKey(key)
    }, [])

    const selectedItems =
        !multiple || !selectedValues.length
            ? EMPTY_ARRAY
            : selectedValues.map((value) => {
                  const label = getOptionLabel(value)
                  return {
                      key: getOptionKey(value),
                      label,
                      disabled:
                          interactionDisabled ||
                          Boolean(isOptionDisabled?.(value)),
                      removeLabel:
                          messages.removeSelectedItem?.(label) ?? label,
                  }
              })

    const formValues = !selectedValues.length
        ? EMPTY_ARRAY
        : selectedValues.map((value) => {
              const key = getOptionKey(value)
              return { key, value: props.getFormValue?.(value) ?? key }
          })

    return {
        state: {
            virtualOptionsModule,
            inputId,
            listId,
            hasLabel,
            labelId,
            descriptionId,
            errorId,
            labelledBy: mergeAriaIds(
                props['aria-labelledby'],
                hasLabel ? labelId : undefined,
            ),
            describedBy: mergeAriaIds(
                props['aria-describedby'],
                props.description != null ? descriptionId : undefined,
                hasError ? errorId : undefined,
            ),
            open,
            activeId,
            activeEntry,
            activeIndex,
            virtualization,
            navigationVersion,
            entries,
            messages,
            classNames,
            controlSize,
            textOverflow,
            portalContainer,
            portalClassName,
            popupStyle: {
                ...basePopupStyle,
                zIndex: portalZIndex ?? 'var(--rentner-overlay-z, 9998)',
            },
            multiple: Boolean(multiple),
            selectedItems,
            formValues,
            emptySelection,
            formValue: formValues[0]?.value ?? '',
            hasError,
            error,
            loadingText: props.loadingText ?? messages.loading,
            emptyText:
                props.emptyText ??
                (searchValue ? messages.noResults : messages.noOptions),
            showClear: Boolean(
                props.clearable &&
                !interactionDisabled &&
                (!emptySelection || searchValue),
            ),
            canCreate,
            createLabel,
            createId,
            createActive,
        },
        handler: {
            handleChange,
            handleFocus,
            handleKeyDown,
            handleFieldBlur,
            handleOptionSelect,
            handleOptionActivate,
            handleKeepFocus,
            handleClear,
            handleRemoveSelectedItem,
            handleInvalid,
            handleCreateOption,
            handleCreateActivate,
        },
        refs: {
            root,
            content,
            popupContent: overlayContent,
            validation,
            input: inputRef,
        },
    }
}
