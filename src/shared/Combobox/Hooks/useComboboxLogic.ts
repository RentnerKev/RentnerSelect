import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
} from 'react'
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

let virtualOptionsPromise:
    | Promise<typeof import('../Components/VirtualComboboxOptions.tsx')>
    | undefined
function loadVirtualOptions() {
    return (virtualOptionsPromise ??=
        import('../Components/VirtualComboboxOptions.tsx'))
}
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
    const { multiple, value: controlledValue, getOptionKey: selectedKey } = props
    const selectedValues = useMemo(() => {
        const values = multiple ? controlledValue : controlledValue === null ? [] : [controlledValue]
        const keys = new Set<string>()
        return values.filter((item) => {
            const key = selectedKey(item)
            if (keys.has(key)) return false
            keys.add(key)
            return true
        })
    }, [multiple, controlledValue, selectedKey])
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
    const messages = resolveSelectMessages(props.locale ?? defaults.locale, {
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
        emptySelection
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
        isOptionEqualToValue,
    } = props
    const entries = useMemo(
        () =>
            groupSelectEntries(Array.from(new Map(options.map((option) => [getOptionKey(option), option])).values()), (option) => getOptionGroup?.(option))
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
                            selectedValues.some((value) =>
                                isOptionEqualToValue
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
                isOptionEqualToValue,
            selectedValues,
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

    const { state: { popupStyle }, refs: { content: overlayContent } } = useSelectOverlay({
        layoutVersion: virtualOptionsModule,
        maxHeight: 256,
        open,
        contentWidth,
        portalTarget: portalContainer ?? (typeof document === 'undefined' ? null : document.body),
        rootRef: root,
        contentRef: content,
        triggerRef: input,
        onDismiss: () => setOpen(false),
    })

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
        if (!interactionDisabled) setOpen(true)
    }
    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        if (interactionDisabled) return
        props.onSearchValueChange(event.target.value)
        setActiveKey(null)
        setCreateActive(false)
        setOpen(true)
    }
    function handleOptionSelect(entry: ComboboxEntry<T>) {
        if (interactionDisabled || props.loading || entry.disabled) return
        if (props.multiple) {
            props.onValueChange(entry.selected
                ? selectedValues.filter((value) => !(props.isOptionEqualToValue
                    ? props.isOptionEqualToValue(entry.option, value)
                    : props.getOptionKey(value) === entry.key))
                : [...selectedValues, entry.option])
        } else props.onValueChange(entry.option)
        setOpen(Boolean(props.multiple))
        if (!props.multiple) setActiveKey(null)
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
        if (interactionDisabled || event.nativeEvent.isComposing) return
        if (event.key === 'Backspace' && props.multiple && !props.searchValue && input.current?.selectionStart === 0) {
            const last = selectedValues.findLast((item) => !props.isOptionDisabled?.(item))
            if (last !== undefined && !props.isOptionDisabled?.(last)) {
                event.preventDefault()
                handleRemoveSelectedItem(props.getOptionKey(last))
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
        if (interactionDisabled) return
        if (props.multiple) props.onValueChange([])
        else props.onValueChange(null)
        props.onSearchValueChange('')
        setActiveKey(null)
        setCreateActive(false)
        input.current?.focus()
        setOpen(false)
    }
    function handleRemoveSelectedItem(key: string) {
        if (!props.multiple || interactionDisabled) return
        const item = selectedValues.find((value) => props.getOptionKey(value) === key)
        if (item === undefined || props.isOptionDisabled?.(item)) return
        props.onValueChange(selectedValues.filter((value) => props.getOptionKey(value) !== key))
        input.current?.focus({ preventScroll: true })
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
                props.description != null ? descriptionId : undefined,
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
                ...popupStyle,
                zIndex: portalZIndex ?? 'var(--rentner-overlay-z, 9998)',
            },
            multiple: Boolean(props.multiple),
            selectedItems: selectedValues.map((value) => ({
                key: props.getOptionKey(value),
                label: props.getOptionLabel(value),
                disabled: interactionDisabled || Boolean(props.isOptionDisabled?.(value)),
                removeLabel: messages.removeSelectedItem?.(props.getOptionLabel(value)) ?? props.getOptionLabel(value),
            })),
            formValues: selectedValues.map((value) => ({ key: props.getOptionKey(value), value: props.getFormValue?.(value) ?? props.getOptionKey(value) })),
            emptySelection,
            formValue: selectedValues.length ? (props.getFormValue?.(selectedValues[0]!) ?? props.getOptionKey(selectedValues[0]!)) : '',
            hasError,
            error,
            loadingText: props.loadingText ?? messages.loading,
            emptyText:
                props.emptyText ??
                (props.searchValue ? messages.noResults : messages.noOptions),
            showClear: Boolean(
                props.clearable &&
                !interactionDisabled &&
                (!emptySelection || props.searchValue),
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
        refs: { root, content, popupContent: overlayContent, validation, input: inputRef },
    }
}
