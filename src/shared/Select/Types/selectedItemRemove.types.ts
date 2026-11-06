import type { ReactElement, RefCallback } from 'react'

export interface SelectedItemRemoveProps {
    optionKey: string
    label: string
    removeLabel: string
    tooltipText: string
    className?: string
    onRemove: (optionKey: string) => void
}

export interface SelectedItemTooltipFallbackProps {
    children: ReactElement
}

export interface SelectedItemRemoveLogicResult {
    state: { open: boolean; descriptionId: string }
    refs: { button: RefCallback<HTMLButtonElement> }
    handler: {
        handleMouseEnter: () => void
        handleMouseLeave: () => void
        handleFocus: () => void
        handleBlur: () => void
        handleClick: () => void
    }
}
