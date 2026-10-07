import {
    SelectContext,
    useSelectProviderLogic,
} from '../Hooks/useSelectContext.js'
import type { SelectProviderProps } from '../Types/select.types.js'
export type { SelectProviderProps } from '../Types/select.types.js'
export { useSelectDefaults } from '../Hooks/useSelectContext.js'

export function SelectProvider({ children, ...props }: SelectProviderProps) {
    const { state } = useSelectProviderLogic(props)
    return (
        <SelectContext.Provider value={state.contextValue}>
            {children}
        </SelectContext.Provider>
    )
}
