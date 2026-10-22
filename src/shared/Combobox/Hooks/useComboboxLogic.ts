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
import { resolveSelectMessages } from '../../../lib/Messages/i18n.ts'
import { mergeAriaIds } from '../../../lib/Field/selectField.ts'
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
    const messages = resolveSelectMessages(props.locale ?? defaults.locale, {
        ...defaults.messages,
        ...props.messages,
    })
    const controlSize = props.controlSize ?? defaults.controlSize
    const textOverflow =
        props.textOverflow ?? defaults.textOverflow ?? 'truncate'
    const contentWidth =
        props.contentWidth ?? defaults.contentWidth ?? 'trigger'
    const virtualization = props.virtualized ?? defaults.virtualized ?? false
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
        searchValue,
        getOptionKey,
        getOptionDescription,
        isOptionDisabled,
        value,
        isOptionEqualToValue,
    } = props
    const entries = useMemo(
        () =>
            options
                .filter(
                    (option) =>
                        filterMode !== 'local' ||
                        getOptionLabel(option)
                            .toLocaleLowerCase()
                            .includes(searchValue.toLocaleLowerCase()),
                )
                .map((option) => {
                    const key = getOptionKey(option)
                    return {
                        option,
                        key,
                        id: listId + '-' + encodeURIComponent(key),
                        label: getOptionLabel(option),
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
    const activeEntry = open
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

    const activeId = activeEntry?.id
    useEffect(() => {
        if (!activeId || virtualization) return
        const activeOption = Array.from(
            content.current?.querySelectorAll<HTMLElement>('[role="option"]') ??
                [],
        ).find((option) => option.id === activeId)
        activeOption?.scrollIntoView?.({ block: 'nearest' })
    }, [activeId, virtualization])

    function handleFocus() {
        if (!props.disabled && !props.readOnly) setOpen(true)
    }
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        if (props.disabled || props.readOnly) return
        props.onSearchValueChange(event.target.value)
        setActiveKey(null)
        setOpen(true)
    }
    function handleOptionSelect(entry: ComboboxEntry<T>) {
        if (props.disabled || props.readOnly || props.loading || entry.disabled)
            return
        props.onValueChange(entry.option)
        setOpen(false)
        setActiveKey(null)
        input.current?.focus()
    }
    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
        if (props.disabled || props.readOnly || event.nativeEvent.isComposing)
            return
        if (event.key === 'Escape') {
            if (open) {
                event.preventDefault()
                setOpen(false)
                setActiveKey(null)
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
        if (!enabledEntries.length) return
        const index = enabledEntries.findIndex(
            (entry) => entry.key === activeEntry?.key,
        )
        const nextIndex =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? enabledEntries.length - 1
                  : event.key === 'ArrowDown'
                    ? Math.min(index + 1, enabledEntries.length - 1)
                    : index < 0
                      ? enabledEntries.length - 1
                      : Math.max(0, index - 1)
        setNavigationVersion((version) => version + 1)
        setActiveKey(enabledEntries[nextIndex]!.key)
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
        props.onBlur?.(event)
    }
    function handleClear() {
        if (props.disabled || props.readOnly) return
        props.onValueChange(null)
        props.onSearchValueChange('')
        setActiveKey(null)
        input.current?.focus()
        setOpen(false)
    }
    function handleInvalid(event: InvalidEvent<HTMLInputElement>) {
        event.preventDefault()
        setTouched(true)
        input.current?.focus()
    }
    function handleOptionActivate(key: string) {
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
            activeId: activeEntry?.id,
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
        },
        refs: { root, content, validation, input: inputRef },
    }
}
