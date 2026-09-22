export type SelectLocale = 'de' | 'en'

export interface SelectMessages {
    required: string
    minSelection: (count: number) => string
    maxSelection: (count: number) => string
    searchOptions: string
    searchPlaceholder: string
    noResults: string
    noOptions: string
}

const germanMessages: SelectMessages = {
    required: 'Dieses Feld ist erforderlich',
    minSelection: (count) => `Mindestens ${count} Optionen auswählen`,
    maxSelection: (count) => `Maximal ${count} Optionen auswählen`,
    searchOptions: 'Optionen suchen',
    searchPlaceholder: 'Suchen…',
    noResults: 'Keine Ergebnisse',
    noOptions: 'Keine Optionen',
}

const englishMessages: SelectMessages = {
    required: 'This field is required',
    minSelection: (count) => `Select at least ${count} options`,
    maxSelection: (count) => `Select at most ${count} options`,
    searchOptions: 'Search options',
    searchPlaceholder: 'Search…',
    noResults: 'No results',
    noOptions: 'No options',
}

export const selectMessageCatalog: Record<SelectLocale, SelectMessages> = {
    de: germanMessages,
    en: englishMessages,
}

export function resolveSelectMessages(
    locale: SelectLocale = 'de',
    messages?: Partial<SelectMessages>,
): SelectMessages {
    return {
        ...selectMessageCatalog[locale],
        ...messages,
    }
}
