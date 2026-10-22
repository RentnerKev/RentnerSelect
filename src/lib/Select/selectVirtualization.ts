import type { SelectCustomizationProps } from '../../shared/Select/Types/select.types.ts'

export function resolveSelectVirtualization(
    virtualized: SelectCustomizationProps['virtualized'],
    optionCount: number,
    control: 'select' | 'combobox',
) {
    if (virtualized !== undefined && virtualized !== 'auto') return virtualized
    return optionCount >= (control === 'select' ? 250 : 1000)
}
