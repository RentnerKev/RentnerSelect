import {
    SelectContext,
    useSelectProviderLogic,
} from '../Hooks/useSelectContext.ts'
import type { SelectProviderProps } from '../Types/select.types.ts'

export function SelectProvider({ children, ...props }: SelectProviderProps) {
    const { state } = useSelectProviderLogic(props)
    return (
        <SelectContext.Provider value={state.contextValue}>
            {children}
        </SelectContext.Provider>
    )
}
