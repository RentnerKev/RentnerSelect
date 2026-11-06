import {
    useEffect,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import type {
    ChangeEvent,
    CSSProperties,
    FocusEvent,
    KeyboardEvent,
    InvalidEvent,
    MouseEvent,
} from 'react'
import { useSelectDefaults } from '../../Select/Hooks/useSelectContext.ts'
import useComposedRefs from '../../Select/Hooks/useComposedRefs.ts'
import useDeferredModule from '../../VirtualList/Hooks/useDeferredModule.ts'

let virtualOptionsPromise:
    | Promise<typeof import('../Components/VirtualComboboxOptions.tsx')>
    | undefined
function loadVirtualOptions() {
    return (virtualOptionsPromise ??=
        import('../Components/VirtualComboboxOptions.tsx'))
}
import { resolveComboboxMessages } from '../../../lib/Messages/comboboxMessages.ts'
import { mergeAriaIds } from '../../../lib/Field/selectField.ts'
import { resolveSelectVirtualization } from '../../../lib/Select/selectVirtualization.ts'
import { groupSelectEntries } from '../../../lib/Select/selectGroups.ts'
import type {
    ComboboxEntry,
    ComboboxLogicResult,
    ComboboxProps,
} from '../Types/combobox.types.ts'

function handleKeepFocus(event: MouseEvent<HTMLElement>) {
    event.preventDefault()
}

export default function useComboboxLogic<T>(
    props: ComboboxProps<T>,
): ComboboxLogicResult<T> {
    const defaults = useSelectDefaults()
    const generatedId = useId()
    const inputId = props.id ?? 'combobox-' + generatedId
    const listId = inputId + '-listbox'
    const labelId = inputId + '-label'
    const hasLabel =
        props.label !== undefined &&
        props.label !== null &&
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
    const [position, setPosition] = useState<CSSProperties>({})
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
    const messages = resolveComboboxMessages(props.locale ?? defaults.locale, {
        ...defaults.messages,
        ...props.messages,
    })
    const controlSize = props.controlSize ?? defaults.controlSize
    const textOverflow =
        props.textOverflow ?? defaults.textOverflow ?? 'truncate'
    const contentWidth =
        props.contentWidth ?? defaults.contentWidth ?? 'trigger'
    const virtualization = resolveSelectVirtualization(
        props.virtualized ?? defaults.virtualized,
        props.options.length,
        'combobox',
    )
    const {
        state: { module: virtualOptionsModule },
    } = useDeferredModule({
        enabled: open && Boolean(virtualization),
        load: loadVirtualOptions,
    })
    const classNames = { ...defaults.classNames, ...props.classNames }
    const portalContainer =
        props.portalContainer === undefined
            ? defaults.portalContainer
            : props.portalContainer
    const portalClassName = props.portalClassName ?? defaults.portalClassName
    const portalZIndex = props.portalZIndex ?? defaults.portalZIndex
    const error =
        props.error === undefined &&
        touched &&
        props.required &&
        props.value === null
            ? messages.required
            : props.error
    const hasError = Boolean(error) && !props.disabled
    const {
        options,
        filterMode,
        getOptionLabel,
        getOptionGroup,
        searchValue,
        getOptionKey,
        getOptionDescription,
        isOptionDisabled,
        value,
        isOptionEqualToValue,
    } = props
    const entries = useMemo(
        () =>
            groupSelectEntries(options, (option) => getOptionGroup?.(option))
                .flatMap((group) => group.entries)
                .filter(
                    (option) =>
                        filterMode !== 'local' ||
                        getOptionLabel(option)
                            .toLocaleLowerCase()
                            .includes(searchValue.toLocaleLowerCase()) ||
                        Boolean(
                            getOptionGroup?.(option)
                                ?.toLocaleLowerCase()
                                .includes(searchValue.toLocaleLowerCase()),
                        ),
                )
                .map((option, index) => {
                    const key = getOptionKey(option)
                    return {
                        option,
                        key,
                        id: listId + '-' + encodeURIComponent(key),
                        label: getOptionLabel(option),
                        group: getOptionGroup?.(option) || undefined,
                        position: index + 1,
                        description: getOptionDescription?.(option),
                        disabled: isOptionDisabled?.(option) ?? false,
                        selected:
                            value !== null &&
                            (isOptionEqualToValue
                                ? isOptionEqualToValue(option, value)
                                : getOptionKey(option) === getOptionKey(value)),
                    }
                }),
        [
            options,
            filterMode,
            getOptionLabel,
            getOptionGroup,
            searchValue,
            getOptionKey,
            getOptionDescription,
            isOptionDisabled,
            value,
            isOptionEqualToValue,
            listId,
        ],
    )
    const enabledEntries = props.loading
        ? []
        : entries.filter((entry) => !entry.disabled)
    const createQuery = props.searchValue.trim()
    const canCreate = Boolean(
        props.onCreateOption &&
        createQuery &&
        !interactionDisabled &&
        !props.loading &&
        !props.options.some(
            (option) =>
                props.getOptionLabel(option).trim().toLocaleLowerCase() ===
                createQuery.toLocaleLowerCase(),
        ),
    )
    const createActive = open && canCreate && requestedCreateActive
    const createId = inputId + '-create-option'
    const createLabel =
        props.createOptionLabel?.(createQuery) ??
        messages.createOption?.(createQuery) ??
        createQuery
    const activeEntry =
        open && !createActive
            ? enabledEntries.find((entry) => entry.key === activeKey)
            : undefined

    const validationMessage =
        props.disabled || props.readOnly
            ? ''
            : props.error !== undefined
              ? (props.error ?? '')
              : props.required && props.value === null
                ? messages.required
                : ''
    useEffect(() => {
        validation.current?.setCustomValidity(validationMessage)
    }, [validationMessage])

    useEffect(() => {
        if (!open) return
        const document = input.current?.ownerDocument
        function handleOutside(event: globalThis.PointerEvent) {
            const target = event.target
            const path = event.composedPath()
            if (
                target instanceof Node &&
                !path.some(
                    (node) => node === root.current || node === content.current,
                ) &&
                !root.current?.contains(target) &&
                !content.current?.contains(target)
            )
                setOpen(false)
        }
        document?.addEventListener('pointerdown', handleOutside)
        return () => document?.removeEventListener('pointerdown', handleOutside)
    }, [open])

    useLayoutEffect(() => {
        if (!open) return
        const element = root.current
        const view = element?.ownerDocument.defaultView
        function updatePosition() {
            if (!element || !view) return
            const rect =
                input.current?.getBoundingClientRect() ??
                element.getBoundingClientRect()
            const availableBelow = view.innerHeight - rect.bottom - 8
            const above = availableBelow < 160 && rect.top > availableBelow
            const available = Math.max(
                48,
                above ? rect.top - 8 : availableBelow,
            )
            const left = Math.max(
                4,
                Math.min(rect.left, view.innerWidth - rect.width - 4),
            )
            const availableWidth = Math.max(0, view.innerWidth - left - 4)
            setPosition({
                position: 'fixed',
                left,
                ...(above
                    ? { bottom: view.innerHeight - rect.top + 4 }
                    : { top: rect.bottom + 4 }),
                width:
                    contentWidth === 'trigger'
                        ? Math.min(rect.width, availableWidth)
                        : 'max-content',
                minWidth: Math.min(rect.width, availableWidth),
                maxWidth: availableWidth,
                maxHeight: Math.min(256, available),
            })
        }
        updatePosition()
        view?.addEventListener('resize', updatePosition)
        view?.addEventListener('scroll', updatePosition, true)
        const observer =
            typeof ResizeObserver === 'undefined'
                ? undefined
                : new ResizeObserver(updatePosition)
        if (element) observer?.observe(element)
        return () => {
            view?.removeEventListener('resize', updatePosition)
            view?.removeEventListener('scroll', updatePosition, true)
            observer?.disconnect()
        }
    }, [open, contentWidth])

    const activeId = createActive ? createId : activeEntry?.id
    useEffect(() => {
        if (!activeId || (virtualization && !createActive)) return
        const activeOption = Array.from(
            content.current?.querySelectorAll<HTMLElement>('[role="option"]') ??
                [],
        ).find((option) => option.id === activeId)
        activeOption?.scrollIntoView?.({ block: 'nearest' })
    }, [activeId, virtualization, createActive])

    function handleFocus() {
        if (!props.disabled && !props.readOnly) setOpen(true)
    }
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        if (props.disabled || props.readOnly) return
        props.onSearchValueChange(event.target.value)
        setActiveKey(null)
        setCreateActive(false)
        setOpen(true)
    }
    function handleOptionSelect(entry: ComboboxEntry<T>) {
        if (props.disabled || props.readOnly || props.loading || entry.disabled)
            return
        props.onValueChange(entry.option)
        setOpen(false)
        setActiveKey(null)
        setCreateActive(false)
        input.current?.focus()
    }
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
    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (props.disabled || props.readOnly || event.nativeEvent.isComposing)
            return
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
                (createActive || enabledEntries.length === 0)
            ) {
                event.preventDefault()
                handleCreateOption()
            }
            return
        }
        if (
            !['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key) ||
            (['Home', 'End'].includes(event.key) && !open)
        )
            return
        event.preventDefault()
        setOpen(true)
        const count = enabledEntries.length + (canCreate ? 1 : 0)
        if (!count) return
        const index = createActive
            ? enabledEntries.length
            : enabledEntries.findIndex(
                  (entry) => entry.key === activeEntry?.key,
              )
        const nextIndex =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? count - 1
                  : event.key === 'ArrowDown'
                    ? Math.min(index + 1, count - 1)
                    : index < 0
                      ? count - 1
                      : Math.max(0, index - 1)
        setNavigationVersion((version) => version + 1)
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
        if (props.disabled || props.readOnly) return
        props.onValueChange(null)
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
    function handleOptionActivate(key: string) {
        setCreateActive(false)
        setActiveKey(key)
    }
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
                props.description !== undefined && props.description !== null
                    ? descriptionId
                    : undefined,
                hasError ? errorId : undefined,
            ),
            open,
            activeId,
            activeEntry,
            activeIndex: activeEntry ? entries.indexOf(activeEntry) : -1,
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
                ...position,
                zIndex: portalZIndex ?? 'var(--rentner-overlay-z, 9998)',
            },
            formValue:
                props.value === null
                    ? ''
                    : (props.getFormValue?.(props.value) ??
                      props.getOptionKey(props.value)),
            hasError,
            error,
            loadingText: props.loadingText ?? messages.loading,
            emptyText:
                props.emptyText ??
                (props.searchValue ? messages.noResults : messages.noOptions),
            showClear: Boolean(
                props.clearable &&
                !props.disabled &&
                !props.readOnly &&
                (props.value !== null || props.searchValue),
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
            handleInvalid,
            handleCreateOption,
            handleCreateActivate,
        },
        refs: { root, content, validation, input: inputRef },
    }
}
