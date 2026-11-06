export type SelectLocale = 'de' | 'en' | 'es' | 'fr'

export interface SelectMessages {
    loading?: string
    createOption?: (value: string) => string
    clickToRemove?: string
    removeSelectedItem?: (label: string) => string
    required: string
    minSelection: (count: number) => string
    maxSelection: (count: number) => string
    searchOptions: string
    searchPlaceholder: string
    noResults: string
    noOptions: string
    clearSelection: string
}

export type ComboboxMessages = Omit<
    SelectMessages,
    'clickToRemove' | 'removeSelectedItem'
>
