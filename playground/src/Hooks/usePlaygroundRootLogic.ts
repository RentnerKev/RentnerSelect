import type { DynamicOptionsMode } from '../Types/playground.types'
export function usePlaygroundRootLogic() {
    const mode = new URLSearchParams(window.location.search).get(
        'dynamic-focus',
    )
    const dynamicMode: DynamicOptionsMode | null =
        mode === 'reorder' ||
        mode === 'remove-searchable' ||
        mode === 'remove-static' ||
        mode === 'remove-static-remaining'
            ? mode
            : null
    return { state: { dynamicMode } }
}
