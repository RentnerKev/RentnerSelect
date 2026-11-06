import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type {
    SelectedItemRemoveLogicResult,
    SelectedItemRemoveProps,
} from '../Types/selectedItemRemove.types.ts'

export function useSelectedItemRemoveLogic({
    optionKey,
    onRemove,
}: Pick<
    SelectedItemRemoveProps,
    'optionKey' | 'onRemove'
>): SelectedItemRemoveLogicResult {
    const [hovered, setHovered] = useState(false)
    const [focused, setFocused] = useState(false)
    const [dismissed, setDismissed] = useState(false)
    const button = useRef<HTMLButtonElement>(null)
    const setButton = useCallback((node: HTMLButtonElement | null) => {
        button.current = node
    }, [])
    const descriptionId = useId()
    const open = (hovered || focused) && !dismissed

    useEffect(() => {
        if (!open) return
        const ownerDocument = button.current?.ownerDocument
        if (!ownerDocument) return
        function handleEscape(event: KeyboardEvent) {
            if (event.key !== 'Escape' || event.isComposing) return
            event.preventDefault()
            setDismissed(true)
        }
        ownerDocument.addEventListener('keydown', handleEscape, true)
        return () =>
            ownerDocument.removeEventListener('keydown', handleEscape, true)
    }, [open])

    return {
        state: { open, descriptionId },
        refs: { button: setButton },
        handler: {
            handleMouseEnter: () => {
                setHovered(true)
                setDismissed(false)
            },
            handleMouseLeave: () => setHovered(false),
            handleFocus: () => {
                setFocused(true)
                setDismissed(false)
            },
            handleBlur: () => setFocused(false),
            handleClick: () => onRemove(optionKey),
        },
    }
}
