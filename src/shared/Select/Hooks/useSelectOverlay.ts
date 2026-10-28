import { useEffect, useLayoutEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import {
    ancestorShadowRoots,
    containsTarget,
    fixedContainingBlock,
    getActiveElement,
} from '../../../lib/DOM/selectOverlay.ts'
import type {
    SelectOverlayOptions,
    SelectOverlayResult,
} from '../Types/selectOverlay.types.ts'

export default function useSelectOverlay({
    open,
    contentWidth,
    portalTarget,
    rootRef,
    contentRef,
    triggerRef,
    onDismiss,
}: SelectOverlayOptions): SelectOverlayResult {
    const [popupStyle, setPopupStyle] = useState<CSSProperties>({})

    useEffect(() => {
        if (!open || !portalTarget) return
        const document = triggerRef.current?.ownerDocument
        function handleOutside(event: globalThis.PointerEvent) {
            const path = event.composedPath()
            if (
                path.includes(rootRef.current!) ||
                path.includes(contentRef.current!)
            )
                return
            const target = path[0] ?? event.target
            if (
                target &&
                'nodeType' in target &&
                (containsTarget(rootRef.current, target as Node) ||
                    containsTarget(contentRef.current, target as Node))
            )
                return
            // Blur before unmounting so whole-field onBlur also runs when the
            // outside pointer lands on an element that cannot receive focus.
            const active = document && getActiveElement(document)
            if (
                active &&
                'blur' in active &&
                (containsTarget(rootRef.current, active) ||
                    containsTarget(contentRef.current, active))
            )
                (active as HTMLElement).blur()
            onDismiss()
        }
        document?.addEventListener('pointerdown', handleOutside, true)
        return () =>
            document?.removeEventListener('pointerdown', handleOutside, true)
    }, [open, rootRef, contentRef, triggerRef, onDismiss, portalTarget])

    useLayoutEffect(() => {
        if (!open || !portalTarget) return
        const trigger = triggerRef.current
        const popup = contentRef.current
        const view = trigger?.ownerDocument.defaultView
        if (!trigger || !popup || !view) return
        let frame = 0
        let disposed = false
        let moveObserver: IntersectionObserver | undefined
        let observedAnchor:
            | { left: number; top: number; width: number; height: number }
            | undefined

        function schedulePosition() {
            if (disposed || frame || !view) return
            frame = view.requestAnimationFrame(() => {
                frame = 0
                updatePosition()
            })
        }
        function handleScroll(event: Event) {
            const target = event.composedPath()[0] ?? event.target
            if (
                target &&
                'nodeType' in target &&
                containsTarget(popup, target as Node)
            )
                return
            schedulePosition()
        }
        function updatePosition() {
            if (disposed || !trigger || !popup || !view) return
            const rect = trigger.getBoundingClientRect()
            const viewport = view.visualViewport
            const viewportLeft = viewport?.offsetLeft ?? 0
            const viewportTop = viewport?.offsetTop ?? 0
            const viewportWidth = viewport?.width ?? view.innerWidth
            const viewportHeight = viewport?.height ?? view.innerHeight
            const gutter = 4
            const triggerWidth = Math.min(
                Math.max(rect.width, 180),
                Math.max(0, viewportWidth - gutter * 2),
            )
            const measured = popup.getBoundingClientRect()
            const width =
                contentWidth === 'trigger'
                    ? triggerWidth
                    : Math.max(
                          triggerWidth,
                          Math.min(measured.width, viewportWidth - gutter * 2),
                      )
            const availableBelow = Math.max(
                0,
                viewportTop + viewportHeight - rect.bottom - gutter * 2,
            )
            const availableAbove = Math.max(
                0,
                rect.top - viewportTop - gutter * 2,
            )
            const above =
                availableBelow < Math.min(popup.scrollHeight || 320, 320) &&
                availableAbove > availableBelow
            const availableHeight = above ? availableAbove : availableBelow
            const left = Math.max(
                viewportLeft + gutter,
                Math.min(
                    rect.left,
                    viewportLeft + viewportWidth - width - gutter,
                ),
            )
            const top = above
                ? Math.max(
                      viewportTop + gutter,
                      rect.top -
                          gutter -
                          Math.min(measured.height, availableHeight),
                  )
                : rect.bottom + gutter
            const block = fixedContainingBlock(popup)
            const blockRect = block?.getBoundingClientRect()
            const scaleX =
                block && block.offsetWidth
                    ? blockRect!.width / block.offsetWidth || 1
                    : 1
            const scaleY =
                block && block.offsetHeight
                    ? blockRect!.height / block.offsetHeight || 1
                    : 1
            // Fixed children inside a transformed portal use that ancestor's
            // padding box, not the viewport, as their coordinate system.
            const next: CSSProperties = {
                position: 'fixed',
                left:
                    block && blockRect
                        ? (left - blockRect.left) / scaleX -
                          block.clientLeft +
                          block.scrollLeft
                        : left,
                top:
                    block && blockRect
                        ? (top - blockRect.top) / scaleY -
                          block.clientTop +
                          block.scrollTop
                        : top,
                width:
                    contentWidth === 'trigger' ? width / scaleX : 'max-content',
                minWidth: triggerWidth / scaleX,
                maxWidth: Math.max(0, viewportWidth - gutter * 2) / scaleX,
                maxHeight: availableHeight / scaleY,
            }
            setPopupStyle((previous) =>
                Object.keys(next).length === Object.keys(previous).length &&
                Object.entries(next).every(
                    ([key, value]) =>
                        previous[key as keyof CSSProperties] === value,
                )
                    ? previous
                    : next,
            )
            if (
                view.IntersectionObserver &&
                (!observedAnchor ||
                    observedAnchor.left !== rect.left ||
                    observedAnchor.top !== rect.top ||
                    observedAnchor.width !== rect.width ||
                    observedAnchor.height !== rect.height)
            ) {
                moveObserver?.disconnect()
                observedAnchor = {
                    left: rect.left,
                    top: rect.top,
                    width: rect.width,
                    height: rect.height,
                }
                if (rect.width > 0 && rect.height > 0) {
                    const root = trigger.ownerDocument.documentElement
                    // A tight observer root detects anchor movement even when
                    // neither the trigger nor the popup changes dimensions.
                    moveObserver = new view.IntersectionObserver(
                        (entries) => {
                            if (entries[0]?.intersectionRatio !== 1)
                                schedulePosition()
                        },
                        {
                            rootMargin: [
                                -Math.floor(rect.top),
                                -Math.floor(root.clientWidth - rect.right),
                                -Math.floor(root.clientHeight - rect.bottom),
                                -Math.floor(rect.left),
                            ]
                                .map((value) => `${value}px`)
                                .join(' '),
                            threshold: 1,
                        },
                    )
                    moveObserver.observe(trigger)
                }
            }
        }
        updatePosition()
        view.addEventListener('resize', schedulePosition)
        view.addEventListener('scroll', handleScroll, true)
        view.visualViewport?.addEventListener('resize', schedulePosition)
        view.visualViewport?.addEventListener('scroll', schedulePosition)
        const shadowRoots = new Set([
            ...ancestorShadowRoots(trigger),
            ...ancestorShadowRoots(popup),
        ])
        for (const root of shadowRoots)
            root.addEventListener('scroll', handleScroll, true)
        const observer =
            typeof view.ResizeObserver === 'undefined'
                ? undefined
                : new view.ResizeObserver(schedulePosition)
        observer?.observe(trigger)
        observer?.observe(popup)
        return () => {
            disposed = true
            view.cancelAnimationFrame(frame)
            view.removeEventListener('resize', schedulePosition)
            view.removeEventListener('scroll', handleScroll, true)
            view.visualViewport?.removeEventListener('resize', schedulePosition)
            view.visualViewport?.removeEventListener('scroll', schedulePosition)
            for (const root of shadowRoots)
                root.removeEventListener('scroll', handleScroll, true)
            observer?.disconnect()
            moveObserver?.disconnect()
        }
    }, [open, contentWidth, contentRef, triggerRef, portalTarget])

    return { state: { popupStyle } }
}
