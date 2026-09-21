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

`required` ist standardmäßig deaktiviert. Wenn du es setzt und beim Submit noch kein Wert ausgewählt wurde, wird der Select rot, das linke Icon wird durch ein Ausrufezeichen ersetzt und der Fehlertext wird im Tooltip angezeigt. Das ist das praktisch, wenn der Placeholder wie "Bereich auswählen" nur ein Hinweis und keine echte Auswahl sein soll.

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

| Parameter        | Typ                       | Beschreibung                                                             |
| ---------------- | ------------------------- | ------------------------------------------------------------------------ |
| `id`             | `string`                  | (Optional) ID für den sichtbaren Trigger, nützlich für Labels.           |
| `name`           | `string`                  | (Optional) Name für Formular-Submit und native Validierung.              |
| `value`          | `string`                  | Der aktuell ausgewählte Wert.                                            |
| `onValueChange`  | `(value: string) => void` | Callback-Funktion, die bei Änderung aufgerufen wird.                     |
| `options`        | `Option[]`                | Ein Array von Optionen (siehe unten).                                    |
| `required`       | `boolean`                 | (Optional) Aktiviert Pflichtfeld-Validierung. Default ist `false`.       |
| `className`      | `string`                  | (Optional) Überträgt classes an die Select-Komponente.                   |
| `placeholder`    | `string`                  | (Optional) Text, der angezeigt wird, wenn nichts ausgewählt ist.         |
| `icon`           | `React.ReactNode`         | (Optional) Ein Icon, das links im Select angezeigt wird.                 |
| `fallbackOption` | `string`                  | (Optional) Text, der angezeigt wird, wenn keine Optionen vorhanden sind. |
| `multiple`       | `boolean`                 | (Optional) Aktiviert die Mehrfachauswahl. Default ist false.             |
| `minSelection`   | `number`                  | (Optional) Bestimmt die Mindestanzahl an auszuwählenden Optionen.        |
| `maxSelection`   | `number`                  | (Optional) Bestimmt die maximale Anzahl an auszuwählenden Optionen.      |
| `locale`         | `'de' \| 'en'`            | (Optional) Sprache der Standardtexte, standardmäßig `'de'`.              |
| `messages`       | `Partial<SelectMessages>` | (Optional) Überschreibt einzelne Standard- und ARIA-Texte.               |

### Option

```ts
interface Option {
    value: string
    label: string
    subOption?: string
}
```

`subOption` ist optional und wird kleiner unter dem Label angezeigt. Das funktioniert sowohl in der geöffneten Auswahl als auch im geschlossenen Select. Das ist das nützlich für Zusatzinfos wie Adressen, Kundennummern oder Rollen.

## CSS-Integration

Füge die folgenden Zeilen in deine Haupt-CSS-Datei ein, um die Stile zu konfigurieren.

```css
@import 'tailwindcss';
@source "../node_modules/@rentnerkev/select";
```

## Entwicklung

```bash
bun install
bun run verify
bun run playground:dev
```

`bun run verify` prüft Typen, Oxlint, Oxfmt, den Paket-Build und den
veröffentlichten Paketinhalt per Dry Run.
