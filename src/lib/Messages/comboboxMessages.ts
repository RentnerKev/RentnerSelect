import type {
    ComboboxMessages,
    SelectLocale,
    SelectMessages,
} from './Types/i18n.types.ts'
const germanMessages: ComboboxMessages = {
    loading: 'Wird geladen…',
    createOption: (value) => `„${value}“ anlegen`,
    required: 'Dieses Feld ist erforderlich',
    minSelection: (count) => `Mindestens ${count} Optionen auswählen`,
    maxSelection: (count) => `Maximal ${count} Optionen auswählen`,
    searchOptions: 'Optionen suchen',
    searchPlaceholder: 'Suchen…',
    noResults: 'Keine Ergebnisse',
    noOptions: 'Keine Optionen',
    clearSelection: 'Auswahl löschen',
}

const englishMessages: ComboboxMessages = {
    loading: 'Loading…',
    createOption: (value) => `Create “${value}”`,
    required: 'This field is required',
    minSelection: (count) => `Select at least ${count} options`,
    maxSelection: (count) => `Select at most ${count} options`,
    searchOptions: 'Search options',
    searchPlaceholder: 'Search…',
    noResults: 'No results',
    noOptions: 'No options',
    clearSelection: 'Clear selection',
}

const spanishMessages: ComboboxMessages = {
    loading: 'Cargando…',
    createOption: (value) => `Crear «${value}»`,
    required: 'Este campo es obligatorio',
    minSelection: (count) => `Selecciona al menos ${count} opciones`,
    maxSelection: (count) => `Selecciona como máximo ${count} opciones`,
    searchOptions: 'Buscar opciones',
    searchPlaceholder: 'Buscar…',
    noResults: 'Sin resultados',
    noOptions: 'No hay opciones',
    clearSelection: 'Borrar selección',
}

const frenchMessages: ComboboxMessages = {
    loading: 'Chargement…',
    createOption: (value) => `Créer «${value}»`,
    required: 'Ce champ est obligatoire',
    minSelection: (count) => `Sélectionnez au moins ${count} options`,
    maxSelection: (count) => `Sélectionnez au maximum ${count} options`,
    searchOptions: 'Rechercher des options',
    searchPlaceholder: 'Rechercher…',
    noResults: 'Aucun résultat',
    noOptions: 'Aucune option',
    clearSelection: 'Effacer la sélection',
}

export const baseMessageCatalog: Record<SelectLocale, ComboboxMessages> = {
    de: germanMessages,
    en: englishMessages,
    es: spanishMessages,
    fr: frenchMessages,
}

/** Keep multi-select-only messages outside the lightweight combobox entry. */
export function resolveComboboxMessages(
    locale: SelectLocale = 'de',
    messages?: Partial<SelectMessages>,
): ComboboxMessages {
    return { ...baseMessageCatalog[locale], ...messages }
}
