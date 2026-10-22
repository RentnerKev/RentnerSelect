import type {
    DynamicOptionsMode,
    PlaygroundRootLogicResult,
} from '../Types/playground.types.ts'
export function usePlaygroundRootLogic(): PlaygroundRootLogicResult {
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
    return {
        state: {
            virtualFixture: new URLSearchParams(window.location.search).has(
                'virtual-list',
            ),
            dynamicMode,
            externalCombobox: new URLSearchParams(window.location.search).has(
                'external-combobox',
            ),
        },
    }
}
