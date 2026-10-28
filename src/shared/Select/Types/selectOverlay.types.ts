import type { CSSProperties, RefObject } from 'react'

export interface SelectOverlayOptions {
    open: boolean
    contentWidth: 'trigger' | 'content'
    portalTarget: Element | DocumentFragment | null
    rootRef: RefObject<HTMLDivElement | null>
    contentRef: RefObject<HTMLDivElement | null>
    triggerRef: RefObject<HTMLButtonElement | null>
    onDismiss: () => void
}

export interface SelectOverlayResult {
    state: { popupStyle: CSSProperties }
}
