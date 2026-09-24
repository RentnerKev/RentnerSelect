export type SelectLocale = 'de' | 'en' | 'es' | 'fr'

export interface SelectMessages {
    required: string
    minSelection: (count: number) => string
    maxSelection: (count: number) => string
    searchOptions: string
    searchPlaceholder: string
    noResults: string
    noOptions: string
    clearSelection: string
}

const germanMessages: SelectMessages = {
    required: 'Dieses Feld ist erforderlich',
    minSelection: (count) => `Mindestens ${count} Optionen auswählen`,
    maxSelection: (count) => `Maximal ${count} Optionen auswählen`,
    searchOptions: 'Optionen suchen',
    searchPlaceholder: 'Suchen…',
    noResults: 'Keine Ergebnisse',
    noOptions: 'Keine Optionen',
    clearSelection: 'Auswahl löschen',
}

const englishMessages: SelectMessages = {
    required: 'This field is required',
    minSelection: (count) => `Select at least ${count} options`,
    maxSelection: (count) => `Select at most ${count} options`,
    searchOptions: 'Search options',
    searchPlaceholder: 'Search…',
    noResults: 'No results',
    noOptions: 'No options',
    clearSelection: 'Clear selection',
}

const spanishMessages: SelectMessages = {
    required: 'Este campo es obligatorio',
    minSelection: (count) => `Selecciona al menos ${count} opciones`,
    maxSelection: (count) => `Selecciona como máximo ${count} opciones`,
    searchOptions: 'Buscar opciones',
    searchPlaceholder: 'Buscar…',
    noResults: 'Sin resultados',
    noOptions: 'No hay opciones',
    clearSelection: 'Borrar selección',
}

const frenchMessages: SelectMessages = {
    required: 'Ce champ est obligatoire',
    minSelection: (count) => `Sélectionnez au moins ${count} options`,
    maxSelection: (count) => `Sélectionnez au maximum ${count} options`,
    searchOptions: 'Rechercher des options',
    searchPlaceholder: 'Rechercher…',
    noResults: 'Aucun résultat',
    noOptions: 'Aucune option',
    clearSelection: 'Effacer la sélection',
}

export const selectMessageCatalog: Record<SelectLocale, SelectMessages> = {
    de: germanMessages,
    en: englishMessages,
    es: spanishMessages,
    fr: frenchMessages,
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
