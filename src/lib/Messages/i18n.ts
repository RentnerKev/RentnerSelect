import type { SelectLocale, SelectMessages } from './Types/i18n.types.ts'
import { baseMessageCatalog } from './comboboxMessages.ts'
export type { SelectLocale, SelectMessages } from './Types/i18n.types.ts'
export const selectMessageCatalog: Record<SelectLocale, SelectMessages> =
    /* @__PURE__ */ (() => ({
        de: {
            ...baseMessageCatalog.de,
            clickToRemove: 'Zum Entfernen klicken',
            removeSelectedItem: (label) => `${label} entfernen`,
        },
        en: {
            ...baseMessageCatalog.en,
            clickToRemove: 'Click to remove',
            removeSelectedItem: (label) => `Remove ${label}`,
        },
        es: {
            ...baseMessageCatalog.es,
            clickToRemove: 'Haz clic para eliminar',
            removeSelectedItem: (label) => `Eliminar ${label}`,
        },
        fr: {
            ...baseMessageCatalog.fr,
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
