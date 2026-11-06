import type { SelectLocale, SelectMessages } from './Types/i18n.types.ts'
import { baseMessageCatalog } from './comboboxMessages.ts'
export type { SelectLocale, SelectMessages } from './Types/i18n.types.ts'
export const selectMessageCatalog: Record<SelectLocale, SelectMessages> =
    /* @__PURE__ */ (() => ({
        de: {
            ...baseMessageCatalog.de,
            minSelection: (count) => `Mindestens ${count} Optionen auswählen`,
            maxSelection: (count) => `Maximal ${count} Optionen auswählen`,
            clickToRemove: 'Zum Entfernen klicken',
            removeSelectedItem: (label) => `${label} entfernen`,
        },
        en: {
            ...baseMessageCatalog.en,
            minSelection: (count) => `Select at least ${count} options`,
            maxSelection: (count) => `Select at most ${count} options`,
            clickToRemove: 'Click to remove',
            removeSelectedItem: (label) => `Remove ${label}`,
        },
        es: {
            ...baseMessageCatalog.es,
            minSelection: (count) => `Selecciona al menos ${count} opciones`,
            maxSelection: (count) => `Selecciona como máximo ${count} opciones`,
            clickToRemove: 'Haz clic para eliminar',
            removeSelectedItem: (label) => `Eliminar ${label}`,
        },
        fr: {
            ...baseMessageCatalog.fr,
            minSelection: (count) => `Sélectionnez au moins ${count} options`,
            maxSelection: (count) => `Sélectionnez au maximum ${count} options`,
            clickToRemove: 'Cliquez pour supprimer',
            removeSelectedItem: (label) => `Supprimer ${label}`,
        },
    }))()

export function resolveSelectMessages(
    locale: SelectLocale = 'de',
    messages?: Partial<SelectMessages>,
): SelectMessages {
    return {
        ...selectMessageCatalog[locale],
        ...messages,
    }
}
