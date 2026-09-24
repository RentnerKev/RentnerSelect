# @rentnerkev/select

An accessible, searchable React select for typed single and multiple selection, native form integration, validation, localization, and Tailwind CSS styling.

## Requirements

Use React 19 with React DOM 19, an ESM-capable build, and Tailwind CSS 4 for
the documented styling. Import this package's `tailwind.css` entry into your
Tailwind stylesheet. It uses `@source` for published classes and `@theme` for
global tokens such as `--color-primary`. Check for token name collisions with
your app and override them in a later `@theme` block if needed.

In a React Server Components app, import and render the select from a module
beginning with `'use client'`; define its state and callbacks there. See the
[Tailwind directives](https://tailwindcss.com/docs/functions-and-directives)
and [React client boundary](https://react.dev/reference/rsc/use-client) guides.

## Installation

Install the package with npm:

```bash
npm install @rentnerkev/select
```

Or with Bun:

```bash
bun add @rentnerkev/select
```

## Quick start

`CustomSelect<TValue>` infers its value type from `value` and `options`, so the change handler remains typed without casts.

```tsx
import { CustomSelect, type Option } from '@rentnerkev/select'
import { useState } from 'react'

const contactOptions = [
    {
        value: 'alex-morgan',
        label: 'Alex Morgan',
        subOption: 'Customer success',
    },
    {
        value: 'sam-rivera',
        label: 'Sam Rivera',
        subOption: 'Technical support',
    },
] satisfies ReadonlyArray<Option<string>>

export function ContactSelect() {
    const [contact, setContact] = useState('')

    return (
        <CustomSelect
            id="contact"
            name="contact"
            label="Contact"
            value={contact}
            onValueChange={setContact}
            options={contactOptions}
            placeholder="Choose a contact"
            required
        />
    )
}
```

## Generic values

Strings, numbers, booleans, and objects are supported. Use `isOptionEqualToValue` to define equality for object values and `getFormValue` to serialize values for native form submission. Without `getFormValue`, the component uses `String(value)`.

```tsx
import { CustomSelect, type Option } from '@rentnerkev/select'
import { useState } from 'react'

const statuses = ['todo', 'done'] as const
type Status = (typeof statuses)[number]

const statusOptions = statuses.map((status) => ({
    value: status,
    label: status === 'todo' ? 'To do' : 'Done',
})) satisfies ReadonlyArray<Option<Status>>

export function StatusSelect() {
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

## Multiple selection

The current multiple-selection API uses an array, preserving values that contain commas:

```tsx
import { CustomSelect } from '@rentnerkev/select'
import { useState } from 'react'

export function RegionSelect() {
    const [regions, setRegions] = useState<Array<string>>([])

    return (
        <CustomSelect
            name="regions"
            multiple
            value={regions}
            onValueChange={setRegions}
            options={[
                { value: 'north,west', label: 'North West' },
                { value: 'south', label: 'South' },
            ]}
            minSelection={1}
            maxSelection={2}
        />
    )
}
```

When `name` is set, each selected array item is submitted under the same field name. Read all values with `new FormData(form).getAll('regions')`.

Multiple selection uses a typed array value and submits one native form entry per selected option. Values containing commas remain unambiguous.

For compatibility, an empty multiple selection submits one empty entry by
default. Set `omitEmptyFormValue` to submit no entry instead; then
`FormData.getAll('regions')` returns `[]`. Native `required` validation still
works when the empty entry is omitted.

## Clearing a selection

Use `clearable` to expose a keyboard-accessible clear button when a value is selected. Without `onClear`, clearing reports the empty value through `onValueChange`: `null` for a single select and an empty array for a multiple select. Passing `onClear` keeps the legacy clearing callback semantics and lets that callback update the controlled value. The clear button is hidden for disabled and read-only selects.

```tsx
const [status, setStatus] = useState<string | null>(null)

;<CustomSelect
    value={status}
    onValueChange={setStatus}
    clearable
    options={statusOptions}
    placeholder="All statuses"
/>
```

## Forms and accessibility

The visible trigger supports labels, descriptions, external errors, native validation, and forwarded `aria-*` attributes. Set `required` to participate in form validation. `disabled` removes the field from interaction and validation; `readOnly` prevents changes while retaining the submitted value.

```tsx
import { CustomSelect } from '@rentnerkev/select'
import { useState } from 'react'

export function DepartmentForm() {
    const [department, setDepartment] = useState('')

    return (
        <form>
            <CustomSelect
                id="department"
                name="department"
                label="Department"
                description="Choose the team that owns this request."
                value={department}
                onValueChange={setDepartment}
                options={[
                    { value: 'consulting', label: 'Consulting' },
                    { value: 'support', label: 'Support' },
                    { value: 'sales', label: 'Sales' },
                ]}
                placeholder="Choose a department"
                required
                locale="en"
            />

            <button type="submit">Submit</button>
        </form>
    )
}
```

## Localization

German messages remain the default for backward compatibility. Set `locale` to `de`, `en`, `es`, or `fr`, or override individual messages with a typed `Partial<SelectMessages>`. The catalog and resolver are available as `selectMessageCatalog` and `resolveSelectMessages`.

```tsx
import { CustomSelect, type SelectMessages } from '@rentnerkev/select'
import { useState } from 'react'

const messages: Partial<SelectMessages> = {
    searchPlaceholder: 'Find an option',
    noResults: 'Nothing found',
    minSelection: (count) => `Choose at least ${count}`,
}

export function LocalizedSelect() {
    const [selectedValue, setSelectedValue] = useState('')

    return (
        <CustomSelect
            value={selectedValue}
            onValueChange={setSelectedValue}
            options={[{ value: 'priority', label: 'Priority' }]}
            locale="en"
            messages={messages}
        />
    )
}
```

## Project-wide defaults

Use `SelectProvider` once near the root of your app to set locale, messages, search behavior, styling slots, and a CSP nonce. Any prop passed to an individual select overrides the corresponding provider default; `messages` and `classNames` are merged by key.

```tsx
import { CustomSelect, SelectProvider } from '@rentnerkev/select'

export function App({ cspNonce }: { cspNonce?: string }) {
    return (
        <SelectProvider
            locale="en"
            searchable={false}
            nonce={cspNonce}
            classNames={{ trigger: 'w-full', content: 'shadow-xl' }}
        >
            <CustomSelect
                value=""
                onValueChange={() => undefined}
                options={[{ value: 'one', label: 'One' }]}
                placeholder="Choose"
            />
        </SelectProvider>
    )
}
```

The nonce is forwarded to Radix's viewport style tag. The package CSS also contains the viewport scrollbar rules, so the scrollbar remains styled under strict CSP. Search is enabled by default for compatibility; set `searchable={false}` globally or per select for short menus.

## Custom option content

`renderOption` and `renderValue` allow icons, flags, or project-specific layouts without replacing the select's interaction logic. Keep decorative content `aria-hidden`; the plain `label` remains the searchable, accessible text. Individual options can be disabled.

```tsx
<CustomSelect
    value={language}
    onValueChange={setLanguage}
    options={[
        { value: 'de', label: 'Deutsch' },
        { value: 'en', label: 'English', disabled: true },
    ]}
    renderOption={(option) => <span>{option.label}</span>}
    renderValue={(selected) => <span>{selected[0]?.label}</span>}
    onBlur={handleBlur}
/>
```

## API

### `CustomSelect` props

| Prop                   | Type                                                                                         | Description                                                                                                      |
| ---------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `id`                   | `string`                                                                                     | ID for the visible trigger and associated labels.                                                                |
| `name`                 | `string`                                                                                     | Native form field name.                                                                                          |
| `value`                | `TValue \| null \| undefined` or `ReadonlyArray<TValue>`                                     | Controlled single or multiple value.                                                                             |
| `onValueChange`        | `(value: TValue) => void` or `(value: TValue \| null) => void` / `(value: TValue[]) => void` | Typed callback for the selected mode; clearing reports `null` for single selects and `[]` for multiple selects.  |
| `options`              | `ReadonlyArray<Option<TValue>>`                                                              | Available options.                                                                                               |
| `required`             | `boolean`                                                                                    | Enables required-field validation. Defaults to `false`.                                                          |
| `label`                | `ReactNode`                                                                                  | Visible label linked to the trigger.                                                                             |
| `description`          | `ReactNode`                                                                                  | Supporting text linked through `aria-describedby`.                                                               |
| `error`                | `string \| null`                                                                             | External validation message; `null` clears external and native errors.                                           |
| `disabled`             | `boolean`                                                                                    | Disables interaction and validation.                                                                             |
| `readOnly`             | `boolean`                                                                                    | Prevents changes while retaining the form value.                                                                 |
| `className`            | `string`                                                                                     | Additional Tailwind classes for the visible trigger.                                                             |
| `classNames`           | `SelectClassNames`                                                                           | Classes for root, trigger, clear button, content, search, viewport, option, empty state, label, and description. |
| `clearable`            | `true`                                                                                       | Shows a clear button when selected and reports the empty value through `onValueChange`.                          |
| `onClear`              | `() => void`                                                                                 | Optional legacy clearing callback; when provided, it handles clearing instead of `onValueChange`.                |
| `searchable`           | `boolean`                                                                                    | Show the search field. Defaults to `true`.                                                                       |
| `nonce`                | `string`                                                                                     | CSP nonce for Radix's generated viewport style.                                                                  |
| `onBlur`               | `FocusEventHandler<HTMLButtonElement>`                                                       | Blur handler on the visible trigger.                                                                             |
| `renderOption`         | `(option, state) => ReactNode`                                                               | Custom content for each menu item; `state` includes selected/disabled.                                           |
| `renderValue`          | `(selectedOptions) => ReactNode`                                                             | Custom content for the closed trigger.                                                                           |
| `placeholder`          | `string`                                                                                     | Text shown while no value is selected.                                                                           |
| `icon`                 | `ReactNode`                                                                                  | Icon rendered at the start of the trigger.                                                                       |
| `fallbackOption`       | `string`                                                                                     | Message shown when no options are available.                                                                     |
| `multiple`             | `true`                                                                                       | Enables array-based multiple selection.                                                                          |
| `omitEmptyFormValue`   | `boolean`                                                                                    | Multiple mode only: omits the form entry for an empty selection. Defaults to `false`.                            |
| `minSelection`         | `number`                                                                                     | Minimum number of selected options.                                                                              |
| `maxSelection`         | `number`                                                                                     | Maximum number of selected options.                                                                              |
| `isOptionEqualToValue` | `(optionValue, value) => boolean`                                                            | Compares option and selected values.                                                                             |
| `getFormValue`         | `(value: TValue) => string`                                                                  | Serializes a value for native form submission.                                                                   |
| `locale`               | `'de' \| 'en' \| 'es' \| 'fr'`                                                               | Selects the default message catalog. Defaults to `'de'`.                                                         |
| `messages`             | `Partial<SelectMessages>`                                                                    | Overrides individual messages and ARIA text.                                                                     |
| `aria-label`           | `string`                                                                                     | Accessible name for the visible trigger.                                                                         |
| `aria-labelledby`      | `string`                                                                                     | External accessible-label IDs.                                                                                   |
| `aria-describedby`     | `string`                                                                                     | External description IDs combined with internal text.                                                            |
| `triggerRef`           | `Ref<HTMLButtonElement>`                                                                     | Ref for the visible, focusable trigger.                                                                          |

Additional React `aria-*` attributes are forwarded to the visible trigger.

### `Option<TValue>`

```ts
interface Option<TValue = string> {
    value: TValue
    label: string
    subOption?: string
    disabled?: boolean
}
```

`subOption` adds secondary information below the label in both the open list and the closed trigger.

## Tailwind CSS

Import the package entry after Tailwind CSS in your application stylesheet:

```css
@import 'tailwindcss';
@import '@rentnerkev/select/tailwind.css';
```

The package entry scans only the published JavaScript under `dist`. Select styling uses `--color-select-control`, `--color-select-surface`, `--color-select-hover`, `--color-select-border`, `--color-select-border-strong`, `--color-select-foreground`, `--color-select-muted`, and `--color-select-accent`. Override these tokens with a later `@theme inline` block to map them to your app's light/dark tokens. The older shared theme tokens remain available for compatibility.

```css
@theme inline {
    --color-select-control: var(--app-input);
    --color-select-surface: var(--app-panel);
    --color-select-hover: var(--app-hover);
    --color-select-border: var(--app-border);
    --color-select-border-strong: var(--app-border-strong);
    --color-select-foreground: var(--app-text);
    --color-select-muted: var(--app-muted);
    --color-select-accent: var(--app-accent);
}
```

## Public entry points

| Entry point                       | Purpose                                      |
| --------------------------------- | -------------------------------------------- |
| `@rentnerkev/select`              | Component, messages, and public types.       |
| `@rentnerkev/select/select`       | `CustomSelect` component module.             |
| `@rentnerkev/select/value`        | Value comparison and toggle helpers.         |
| `@rentnerkev/select/messages`     | Locale catalog, resolver, and message types. |
| `@rentnerkev/select/types`        | Component and option types.                  |
| `@rentnerkev/select/tailwind.css` | Tailwind source and shared theme tokens.     |
| `@rentnerkev/select/package.json` | Package metadata.                            |

## Development

```bash
bun install
bun run verify
bun run playground:dev
```

`bun run verify` checks types, lint, formatting, tests, the package build, and the published package contents.

## License

MIT
