import type { CSSProperties, RefObject, RefCallback } from 'react'

export interface SelectOverlayOptions {
    layoutVersion?: unknown
    open: boolean
    maxHeight?: number
    contentWidth: 'trigger' | 'content'
    portalTarget: Element | DocumentFragment | null
    rootRef: RefObject<HTMLDivElement | null>
    contentRef: RefObject<HTMLDivElement | null>
    triggerRef: RefObject<HTMLElement | null>
    onDismiss: () => void
}

export interface SelectOverlayResult {
    state: { popupStyle: CSSProperties; positioned: boolean }
    refs: { content: RefCallback<HTMLDivElement> }
}
