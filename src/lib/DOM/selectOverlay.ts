export function getActiveElement(root: Document | ShadowRoot): Element | null {
    let element = root.activeElement
    while (element?.shadowRoot?.activeElement)
        element = element.shadowRoot.activeElement
    return element
}

export function containsTarget(element: Element | null, target: Node | null) {
    let current: Node | null = target
    while (current) {
        if (current === element) return true
        current =
            current.nodeType === 11 && 'host' in current
                ? (current.host as Element)
                : current.parentNode
    }
    return false
}

export function ancestorShadowRoots(element: Element | null) {
    const roots: ShadowRoot[] = []
    let root = element?.getRootNode()
    while (root?.nodeType === 11 && 'host' in root) {
        roots.push(root as ShadowRoot)
        root = (root.host as Element).getRootNode()
    }
    return roots
}

export function fixedContainingBlock(element: HTMLElement) {
    const view = element.ownerDocument.defaultView
    let parent: Node | null = element.parentNode
    while (parent && parent !== element.ownerDocument) {
        if (parent.nodeType === 1) {
            const ancestor = parent as HTMLElement
            const style = view?.getComputedStyle(ancestor)
            if (
                style &&
                ((style.transform && style.transform !== 'none') ||
                    (style.translate && style.translate !== 'none') ||
                    (style.scale && style.scale !== 'none') ||
                    (style.rotate && style.rotate !== 'none') ||
                    (style.perspective && style.perspective !== 'none') ||
                    (style.filter && style.filter !== 'none') ||
                    (style.backdropFilter && style.backdropFilter !== 'none') ||
                    /paint|layout|strict|content/.test(style.contain) ||
                    /transform|translate|scale|rotate|perspective|filter/.test(
                        style.willChange,
                    ) ||
                    style.contentVisibility === 'auto')
            )
                return ancestor
        }
        parent =
            parent.nodeType === 11 && 'host' in parent
                ? (parent.host as Element)
                : parent.parentNode
    }
    return null
}

export function scrollOptionIntoView(
    option: HTMLElement,
    viewport: HTMLElement | null,
) {
    if (!viewport) return
    const row = option.getBoundingClientRect()
    const box = viewport.getBoundingClientRect()
    const scale = viewport.offsetHeight
        ? box.height / viewport.offsetHeight || 1
        : 1
    const top = box.top + viewport.clientTop * scale
    const bottom = top + viewport.clientHeight * scale
    if (row.top < top) viewport.scrollTop -= (top - row.top) / scale
    else if (row.bottom > bottom)
        viewport.scrollTop += (row.bottom - bottom) / scale
}

export function focusAdjacentControl(
    trigger: HTMLButtonElement,
    popup: HTMLDivElement | null,
    backwards: boolean,
) {
    const controls: HTMLElement[] = []
    function visit(root: ParentNode) {
        for (const child of root.children) {
            const element = child as HTMLElement
            if (
                element.tabIndex >= 0 &&
                !element.matches(':disabled, [hidden], [inert]') &&
                !element.closest('[hidden], [inert]') &&
                !containsTarget(popup, element)
            ) {
                const style =
                    trigger.ownerDocument.defaultView?.getComputedStyle(element)
                if (style?.display !== 'none' && style?.visibility !== 'hidden')
                    controls.push(element)
            }
            const style =
                trigger.ownerDocument.defaultView?.getComputedStyle(element)
            if (
                element.matches('[hidden], [inert]') ||
                style?.display === 'none' ||
                style?.visibility === 'hidden'
            )
                continue
            if (element.shadowRoot) visit(element.shadowRoot)
            else visit(element)
        }
    }
    visit(trigger.ownerDocument)
    controls.sort((left, right) => {
        const first = left.tabIndex > 0 ? left.tabIndex : Infinity
        const second = right.tabIndex > 0 ? right.tabIndex : Infinity
        return first === second ? 0 : first - second
    })
    const index = controls.indexOf(trigger)
    const next = controls[index + (backwards ? -1 : 1)]
    if (next) next.focus()
    else {
        const active = getActiveElement(trigger.ownerDocument)
        if (active && 'blur' in active) (active as HTMLElement).blur()
    }
}
