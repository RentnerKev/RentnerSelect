# @rentnerkev/select

Eine flexible React-Select-Komponente mit Einzel- und Mehrfachauswahl, Formularvalidierung und anpassbarem Tailwind-Design.

## Installation

Installiere das Paket mit npm oder Bun:

```bash
npm install @rentnerkev/select
```

## Schnellstart

### 1. Komponente verwenden

Importiere `CustomSelect` und nutze es in deinen Komponenten.

```tsx
import { CustomSelect } from '@rentnerkev/select'
import { useState } from 'react'
import { User } from 'lucide-react'

function MyComponent() {
    const [selectedValue, setSelectedValue] = useState('')

    const options = [
        {
            value: 'max-mustermann',
            label: 'Max - Mustermann',
            subOption: 'Musterstraße 12, 10115 Berlin',
        },
        {
            value: 'erika-musterfrau',
            label: 'Erika - Musterfrau',
            subOption: 'Hafenweg 4, 20457 Hamburg',
        },
        {
            value: 'tim-schneider',
            label: 'Tim - Schneider',
            subOption: 'Königsallee 22, 40212 Düsseldorf',
        },
    ]

    return (
        <div className="w-64">
            <CustomSelect
                id="fruit"
                name="fruit"
                value={selectedValue}
                onValueChange={setSelectedValue}
                options={options}
                placeholder="Kontakt auswählen"
                required
                className="w-30 h-10"
                fallbackOption="Du hast noch keine Früchte angelegt!"
                icon={<User className="h-4 w-4" />}
            />
        </div>
    )
}
```

## Generische Werte

`CustomSelect<TValue>` leitet den Werttyp in der Regel direkt aus `value` und
`options` ab. Dadurch bleibt der Callback typisiert, ohne dass ein Cast nötig
ist.

```tsx
import { CustomSelect, type Option } from '@rentnerkev/select'
import { useState } from 'react'

const statuses = ['todo', 'done'] as const
type Status = (typeof statuses)[number]

const statusOptions = statuses.map((status) => ({
    value: status,
    label: status === 'todo' ? 'Offen' : 'Erledigt',
})) satisfies ReadonlyArray<Option<Status>>

function StatusSelect() {
    const [status, setStatus] = useState<Status>('todo')

    return (
        <CustomSelect
            value={status}
            onValueChange={setStatus}
            options={statusOptions}
        />
    )
}
```

Zahlen, Booleans und Objektwerte werden ebenfalls unterstützt. Für
Objektwerte kann `isOptionEqualToValue` die Vergleichslogik festlegen.
`getFormValue` serialisiert einen Wert für das native Formularfeld; ohne
Angabe verwendet die Komponente `String(value)`.

## Mehrfachauswahl

Die aktuelle Multiple-API verwendet ein Array und behält deshalb auch Werte
mit Kommas verlustfrei bei:

```tsx
import { CustomSelect } from '@rentnerkev/select'
import { useState } from 'react'

function RegionSelect() {
    const [regions, setRegions] = useState<Array<string>>([])

    return (
        <CustomSelect
            name="regions"
            multiple
            value={regions}
            onValueChange={setRegions}
            options={[
                { value: 'north,west', label: 'Nord-West' },
                { value: 'south', label: 'Süd' },
            ]}
        />
    )
}
```

Mit `name` wird pro ausgewähltem Array-Eintrag ein Formularwert unter
demselben Namen übertragen. Verwende beispielsweise
`new FormData(form).getAll('regions')`, um alle Werte auszulesen.

Der bisherige Aufruf mit `multiple`, einem kommagetrennten `string` und einem
String-Callback bleibt in Version 1 kompatibel, ist aber als `@deprecated`
markiert. Er kann Werte mit eigenen Kommas nicht eindeutig abbilden und wird
erst in Version 2.0 entfernt.

## Lokalisierung

Die deutschen Meldungen und ARIA-Texte sind standardmäßig aktiv. Mit
`locale="en"` werden die vollständigen englischen Standardtexte verwendet.
Einzelne Texte können über ein typisiertes `Partial<SelectMessages>`-Objekt
überschrieben werden. Der Katalog und der Resolver sind ebenfalls als
`selectMessageCatalog` und `resolveSelectMessages` exportiert.

```tsx
import {
    CustomSelect,
    type SelectMessages,
} from '@rentnerkev/select'

const messages: Partial<SelectMessages> = {
    searchPlaceholder: 'Find an option',
    noResults: 'Nothing found',
    minSelection: (count) => `Choose at least ${count}`,
}

<CustomSelect
    value={selectedValue}
    onValueChange={setSelectedValue}
    options={options}
    locale="en"
    messages={messages}
/>
```

### 2. In Formularen mit required

`required` ist standardmäßig deaktiviert. Wenn du es setzt und beim Submit noch kein Wert ausgewählt wurde, wird der Select rot, das linke Icon wird durch ein Ausrufezeichen ersetzt und der Fehlertext wird im Tooltip angezeigt. Das ist praktisch, wenn der Placeholder wie "Bereich auswählen" nur ein Hinweis und keine echte Auswahl sein soll.

```tsx
import { CustomSelect } from '@rentnerkev/select'
import { BriefcaseBusiness } from 'lucide-react'
import { useState } from 'react'

function RequiredSelectForm() {
    const [department, setDepartment] = useState('')

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                event.currentTarget.reportValidity()
            }}
        >
            <CustomSelect
                id="department"
                name="department"
                value={department}
                onValueChange={setDepartment}
                options={[
                    { value: 'beratung', label: 'Beratung' },
                    { value: 'support', label: 'Support' },
                    { value: 'vertrieb', label: 'Vertrieb' },
                ]}
                placeholder="Bereich auswählen"
                required
                icon={<BriefcaseBusiness className="h-4 w-4" />}
            />

            <button type="submit">Absenden</button>
        </form>
    )
}
```

## Typdefinitionen

### `CustomSelect`-Props

Die Komponente nimmt folgende Parameter entgegen:

| Parameter              | Typ                                                        | Beschreibung                                                               |
| ---------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| `id`                   | `string`                                                   | (Optional) ID für den sichtbaren Trigger, nützlich für Labels.             |
| `name`                 | `string`                                                   | (Optional) Name für Formular-Submit und native Validierung.                |
| `value`                | `TValue \| null \| undefined` oder `ReadonlyArray<TValue>` | Kontrollierter Single- beziehungsweise Multiple-Wert.                      |
| `onValueChange`        | `(value: TValue) => void` oder `(value: TValue[]) => void` | Typisierter Callback passend zum Auswahlmodus.                             |
| `options`              | `ReadonlyArray<Option<TValue>>`                            | Ein Array von Optionen (siehe unten).                                      |
| `required`             | `boolean`                                                  | (Optional) Aktiviert Pflichtfeld-Validierung. Default ist `false`.         |
| `label`                | `ReactNode`                                                | (Optional) Sichtbare Beschriftung mit stabiler Zuordnung zum Trigger.      |
| `description`          | `ReactNode`                                                | (Optional) Zusatzbeschreibung, die per `aria-describedby` verknüpft wird.  |
| `error`                | `string \| null`                                           | (Optional) Externer Fehler; `null` löscht interne und native Validierung.  |
| `disabled`             | `boolean`                                                  | (Optional) Deaktiviert Trigger, Auswahl und Formularvalidierung.           |
| `readOnly`             | `boolean`                                                  | (Optional) Verhindert Öffnen und Änderungen, behält aber den Formularwert. |
| `className`            | `string`                                                   | (Optional) Überträgt classes an die Select-Komponente.                     |
| `placeholder`          | `string`                                                   | (Optional) Text, der angezeigt wird, wenn nichts ausgewählt ist.           |
| `icon`                 | `React.ReactNode`                                          | (Optional) Ein Icon, das links im Select angezeigt wird.                   |
| `fallbackOption`       | `string`                                                   | (Optional) Text, der angezeigt wird, wenn keine Optionen vorhanden sind.   |
| `multiple`             | `true`                                                     | (Optional) Aktiviert die arraybasierte Mehrfachauswahl.                    |
| `minSelection`         | `number`                                                   | (Optional) Bestimmt die Mindestanzahl an auszuwählenden Optionen.          |
| `maxSelection`         | `number`                                                   | (Optional) Bestimmt die maximale Anzahl an auszuwählenden Optionen.        |
| `isOptionEqualToValue` | `(optionValue, value) => boolean`                          | (Optional) Vergleicht insbesondere komplexe Werte.                         |
| `getFormValue`         | `(value: TValue) => string`                                | (Optional) Serialisiert Werte für native Formularfelder.                   |
| `locale`               | `'de' \| 'en'`                                             | (Optional) Sprache der Standardtexte, standardmäßig `'de'`.                |
| `messages`             | `Partial<SelectMessages>`                                  | (Optional) Überschreibt einzelne Standard- und ARIA-Texte.                 |
| `aria-label`           | `string`                                                   | (Optional) Eigene zugängliche Beschriftung des sichtbaren Triggers.        |
| `aria-labelledby`      | `string`                                                   | (Optional) Externe ID(s) für die zugängliche Beschriftung.                 |
| `aria-describedby`     | `string`                                                   | (Optional) Externe ID(s), zusätzlich zu Beschreibung und Fehlertext.       |
| `triggerRef`           | `Ref<HTMLButtonElement>`                                   | (Optional) Ref auf den sichtbaren, fokussierbaren Trigger.                 |

Weitere React-`aria-*`-Attribute werden direkt an den sichtbaren Trigger
weitergegeben.

### Option

```ts
interface Option<TValue = string> {
    value: TValue
    label: string
    subOption?: string
}
```

`subOption` ist optional und wird kleiner unter dem Label angezeigt. Das funktioniert sowohl in der geöffneten Auswahl als auch im geschlossenen Select. Das ist das nützlich für Zusatzinfos wie Adressen, Kundennummern oder Rollen.

## CSS-Integration

Importiere den Paket-Einstieg nach Tailwind CSS in deine Haupt-CSS-Datei:

```css
@import 'tailwindcss';
@import '@rentnerkev/select/tailwind.css';
```

Der Paket-Einstieg scannt ausschließlich die veröffentlichten JavaScript-Dateien
unter `dist`. Er stellt die gemeinsamen Theme-Tokens `primary`, `primary-hover`,
`background-dark`, `surface-dark`, `input-dark`, `border-dark`, `secondary-text`
und `muted-foreground` bereit. Eigene Werte können danach mit einem weiteren
`@theme`-Block überschrieben werden.

## Entwicklung

```bash
bun install
bun run verify
bun run playground:dev
```

`bun run verify` prüft Typen, Oxlint, Oxfmt, den Paket-Build und den
veröffentlichten Paketinhalt per Dry Run.
