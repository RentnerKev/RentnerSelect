export type SelectLocale = 'de' | 'en' | 'es' | 'fr'

export interface SelectMessages {
    loading?: string
    required: string
    minSelection: (count: number) => string
    maxSelection: (count: number) => string
    searchOptions: string
    searchPlaceholder: string
    noResults: string
    noOptions: string
    clearSelection: string
}
